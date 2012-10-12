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

/** Constructor for Dtrees class.
 *  @param N is the number of nodes in this object (numbered 1..N)
 */
Dtrees::Dtrees(int N) {
	node i;
	n = N;
	successor = new node[n+1]; parentOf = new node[n+1];
	ps = new Pathset(n);
	for (i = 0; i <= n; i++) p(i) = succ(i) = 0;
}

/** Destructor for Dtrees class */
Dtrees::~Dtrees() { delete [] successor; delete [] parentOf; delete ps; }

/** Expose a path in a tree.
 *  @param i is a node
 *  @return a path from i to the root of the tree
 *  Restructures underlying path set, so the path from i to the root is
 *  a single path.
 */
path Dtrees::expose(node i) {
	PathNodePair pnPair;
	pnPair.p = 0; pnPair.i = i;
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
PathNodePair Dtrees::splice(PathNodePair pnPair) {
	PathPair pp; node w;
	w = succ(ps->findpath(pnPair.i));
	pp = ps->split(pnPair.i);
	if (pp.s1 != 0) succ(pp.s1) = pnPair.i;
	pnPair.p = ps->join(pnPair.p,pnPair.i,pp.s2); pnPair.i = w;
	return pnPair;
}

/** Return the root of a tree.
 *  @param i is a node in some tree
 *  @return the root of the tree containing i
 */
node Dtrees::findroot(node i) {
	node x;
	x = ps->findtail(expose(i));
	succ(x) = 0; // relies on fact that x is canonical element on return
	return x;
}

/** Find the last min cost node on the path to the root.
 *  @param i is a node in some tree
 *  @return a pair consisting of the last min cost node on the path from
 *  i to the root and its cost
 */
NodeCostPair Dtrees::findcost(node i) {
	NodeCostPair cp = ps->findpathcost(expose(i));
	succ(cp.s) = 0;
	return cp;
}

/** Add to the cost of every node on the path from a node to its tree root.
 *  @param i is a node in some tree
 *  @param x is an increment to be added to the costs of the nodes on the
 *  path from i to the tree root
 */
void Dtrees::addcost(node i, cost x) {
	ps->addpathcost(expose(i),x);
}

/** Link two trees.
 *  @param t is the root of some tree
 *  @param i is a node in some other tree
 *  the tree t to the tree containing i at i.
 *  This operation makes i the parent of t.
 */
void Dtrees::link(tree t, node i) {
	p(t) = i;
	succ(ps->join(0,expose(t),expose(i))) = 0;
}

/** Divide a tree into two subtrees.
 *  @param i is a node in some tree.
 *  The operation removes the edge from i to its parent.
 */
void Dtrees::cut(node i) {
	PathPair pp;
	p(i) = 0;
	expose(i); pp = ps->split(i);
	succ(i) = 0;
	if (pp.s2 != 0) succ(pp.s2) = 0;
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
	s += " succ(" + Util::node2string(q,n,s1);
	s += ")=" + Util::node2string(succ(q),n,s1) + "\n";
	return s;
}

/** Create a string representing all the trees in this Dtrees object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Dtrees::toString(string& s) const {
	string s1;
	s = "";
	for (node i = 1; i <= n; i++) {
		node j = ps->findtreeroot(i);
		if (i == j) s += path2string(i,s1);
	}
	return s;
}
