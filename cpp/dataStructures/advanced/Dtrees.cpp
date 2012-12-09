/** @file Dtrees.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Dtrees.h"

#define p(x) parentOf[x]
#define succ(x) successor[x]

namespace grafalgo {

/** Constructor for Dtrees class.
 *  @param size defines the index range for the constructed object.
 */
Dtrees::Dtrees(int size) : Adt(size) {
	makeSpace(size);
}

/** Destructor for Dtrees class. */
Dtrees::~Dtrees() { freeSpace(); }

/** Allocate and initialize space for Dtrees.
 *  @param size is number of index values to provide space for
 */
void Dtrees::makeSpace(int size) {
	try {
		ps = new PathSet(size);
		parentOf = new index[size+1];
		successor = new index[size+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by Dtrees. */
void Dtrees::freeSpace() {
	delete ps; delete [] parentOf; delete [] successor;
}

/** Reinitialize data structure, creating single node trees. */
void Dtrees::clear() {
	ps->clear();
	for (index x = 1; x <= n(); x++) {
		p(x) = succ(x) = 0;
	}
}

/** Resize a Dtrees object, discarding old value.
 *  @param size is the size of the resized object.
 */
void Dtrees::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "Dtrees::resize::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void Dtrees::expand(int size) {
	if (size <= n()) return;
	Dtrees old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}
/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void Dtrees::copyFrom(const Dtrees& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	ps->copyFrom(*(source.ps));
	for (index x = 1; x <= n(); x++) {
		p(x) = source.parentOf[x];
		succ(x) = source.successor[x];
	}
}

/** Expose a path in a tree.
 *  @param i is a node
 *  @return a path from i to the root of the tree
 *  Restructures underlying path set, so the path from i to the root is
 *  a single path.
 */
path Dtrees::expose(index i) {
	PathNodePair pnPair(0,i);
	while (pnPair.i != 0) pnPair = splice(pnPair);
	succ(pnPair.p) = 0;
	return pnPair.p;
}

/** Combine two path segments.
 *  Splice is a private method used by the expose method.
 *  @param pnPair is a pair containing a path .p and its successor .i
 *  @return a new pnPair that can be used in next step of expose operation
 *  The operation splits the path containing i and then joins p to
 *  the last part of the path originally containing i, effectively
 *  extending p furtrher up the tree.
 */ 
Dtrees::PathNodePair Dtrees::splice(PathNodePair pnPair) {
	index w = succ(ps->findpath(pnPair.i));
	PathSet::PathPair pp = ps->split(pnPair.i);
	if (pp.p1 != 0) succ(pp.p1) = pnPair.i;
	pnPair.p = ps->join(pnPair.p,pnPair.i,pp.p2); pnPair.i = w;
	return pnPair;
}

/** Return the root of a tree.
 *  @param i is a node in some tree
 *  @return the root of the tree containing i
 */
index Dtrees::findroot(index i) {
	index x;
	x = ps->findtail(expose(i));
	succ(x) = 0; // relies on fact that x is canonical element on return
	return x;
}

/** Find the last min cost node on the path to the root.
 *  @param i is a node in some tree
 *  @return a pair consisting of the last min cost node on the path from
 *  i to the root and its cost
 */
NodeCostPair Dtrees::findcost(index i) {
	NodeCostPair cp = ps->findpathcost(expose(i));
	succ(cp.x) = 0;
	return cp;
}

/** Add to the cost of every node on the path from a node to its tree root.
 *  @param i is a node in some tree
 *  @param x is an increment to be added to the costs of the nodes on the
 *  path from i to the tree root
 */
void Dtrees::addcost(index i, cost x) {
	ps->addpathcost(expose(i),x);
}

/** Link two trees.
 *  @param t is the root of some tree
 *  @param i is a node in some other tree
 *  the tree t to the tree containing i at i.
 *  This operation makes i the parent of t.
 */
void Dtrees::link(tree t, index i) {
	p(t) = i;
	succ(ps->join(0,expose(t),expose(i))) = 0;
}

/** Divide a tree into two subtrees.
 *  @param i is a node in some tree.
 *  The operation removes the edge from i to its parent.
 */
void Dtrees::cut(index i) {
	p(i) = 0;
	expose(i);
	PathSet::PathPair pp = ps->split(i);
	succ(i) = 0;
	if (pp.p2 != 0) succ(pp.p2) = 0;
	return;
}

/** Create a string representing a path.
 *  @param q is a path in some tree
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Dtrees::path2string(path q, string& s) const {
	string s1;
	s = ps->path2string(q,s1);
	s += " succ(" + Adt::item2string(q,s1);
	s += ")=" + Adt::item2string(succ(q),s1) + "\n";
	return s;
}

/** Create a string representing all the trees in this Dtrees object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Dtrees::toString(string& s) const {
	string s1;
	s = "";
	for (index i = 1; i <= n(); i++) {
		index j = ps->findtreeroot(i);
		if (i == j) s += path2string(i,s1);
	}
	return s;
}

} // ends namespace
