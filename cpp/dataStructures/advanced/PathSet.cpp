/** @file PathSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "PathSet.h"

#define left(x) pnode[x].left
#define right(x) pnode[x].right
#define p(x) pnode[x].p
#define dcost(x) pnode[x].dcost
#define dmin(x) pnode[x].dmin

namespace grafalgo {

/** Constructor for PathSet class.
 *  @param size defines the index range for the constructed object.
 *  @param pathVals is a vector of integer values, which is defined for
 *  each path in the set; that is if u is the handle of some path,
 *  then pathVals[u] will be an integer which the application using
 *  the PathSet has defined for the path; since the PathSet object
 *  may change the handle of a path as a side effect of any operation,
 *  the PathSet object updates pathVals whenever the handle for a path
 *  changes
 */
PathSet::PathSet(int size, int *pathVals) : Adt(size), pvals(pathVals) {
	makeSpace(size);
}

/** Destructor for PathSet class. */
PathSet::~PathSet() { freeSpace(); }

/** Allocate and initialize space for PathSet.
 *  @param size is number of index values to provide space for
 */
void PathSet::makeSpace(int size) {
	try {
		pnode = new PathNode[size+1];
	} catch (std::bad_alloc e) {
		string s = "makeSpace:: insufficient space for "
			    + to_string(size) + "index values";
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by PathSet. */
void PathSet::freeSpace() {
	delete [] pnode;
}

/** Reinitialize data structure, creating single node trees. */
void PathSet::clear() {
	for (index i = 0; i <= n(); i++) {
		left(i) = right(i) = p(i) = dcost(i) = dmin(i) = 0;
	}
}

/** Resize a PathSet object, discarding old value.
 *  @param size is the size of the resized object.
 */
void PathSet::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "PathSet::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void PathSet::expand(int size) {
	if (size <= n()) return;
	PathSet old(this->n(),pvals); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void PathSet::copyFrom(const PathSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	for (index x = 1; x <= n(); x++) {
		pnode[x] = source.pnode[x];
		pvals[x] = source.pvals[x];
	}
}

/** Perform a splay operation on the binary search tree representing a path.
 *  @param x is a node in some path; the operation does a splay operation
 *  that moves x to the root of the search tree that represents the path
 *  containing x
 */
index PathSet::splay(index x) {
	while (p(x) != 0) splaystep(x);
	return x;
}

/** Perform a single splay step.
 *  @param x is a node in some path
 */
void PathSet::splaystep(index x) {
        index y = p(x);
        if (y == 0) return;
        index z = p(y);
        if (x == left(left(z)) || x == right(right(z)))
                rotate(y);
        else if (z != 0) // x is "inner grandchild"
                rotate(x);
        rotate(x);
}

/** Perform a rotation in a search tree representing a path.
 *  @param x is a node in some path; the operation performs a rotation
 *  at the parent of x, moving x up into its parent's position.
 */
void PathSet::rotate(index x) {
        index y = p(x); if (y == 0) return;
        index a, b, c;
        if (x == left(y)) { a = left(x);  b = right(x); c = right(y); }
        else              { a = right(x); b = left(x);  c = left(y);  }

	// do the rotation
        p(x) = p(y);
             if (y == left(p(y)))  left(p(x)) = x;
        else if (y == right(p(y))) right(p(x)) = x;
        if (x == left(y)) {
                left(y) = right(x);
                if (left(y) != 0) p(left(y)) = y;
                right(x) = y;
        } else {
                right(y) = left(x);
                if (right(y) != 0) p(right(y)) = y;
                left(x) = y;
        }
        p(y) = x;

	// update dmin, dcost values
        dmin(a) += dmin(x); dmin(b) += dmin(x);

        dcost(x) = dcost(x) + dmin(x);
        cost dmx = dmin(x);
        dmin(x) = dmin(y);

        dmin(y) = dcost(y);
        if (b != 0) dmin(y) = min(dmin(y),dmin(b)+dmx);
        if (c != 0) dmin(y) = min(dmin(y),dmin(c));
        dcost(y) = dcost(y) - dmin(y);

        dmin(b) -= dmin(y); dmin(c) -= dmin(y);

	pvals[x] = pvals[y]; // ensures that root node always has path value
}

/** Return the canonical element of some path.
 *  @param i is a node in some path
 *  @return the node that is the canonical element of the path at the
 *  start of the operation; the operation performs a splay at i,
 *  so after the operation i is the canonical element.
 */
path PathSet::findpath(index i) { return splay(i); }

/** Return the last node in a path.
 *  @param q is the canonical element of some path
 *  @return the last node in the path containing q
 */
path PathSet::findtail(path q) {
	if (q == 0) return 0;
	while (right(q) != 0) q = right(q);
	return splay(q);
}

/** Add to the cost of every node in a path.
 *  @param q is the canonical element of some path
 *  @param x is the amount to be added to the costs of the nodes in
 *  the path
 */
void PathSet::addpathcost(path q, cost x) { dmin(q) += x; }

/** Find the the last node on a path that has minimum cost.
 *  @param q is the canonical element of some path
 *  @return a pair containing the last node on the path that has minimum
 *  cost and its cost
 */
PathSet::PathCostPair PathSet::findpathcost(path q) {
	while (1) {
		if (right(q) != 0 && dmin(right(q)) == 0)
			q = right(q);
		else if (dcost(q) > 0)
			q = left(q);
		else
			break;
	}
	q = splay(q);
	PathCostPair cp(q,dmin(q));
	return cp;
}

/** Find the root of tree represent a path, while not restructuring the tree.
 *  This is used mainly for constructing a string representation of a path.
 *  @param i is a node in some path
 *  @return the root of the search tree containing i
 */
path PathSet::findtreeroot(index i) {
	while (p(i) != 0) i = p(i);
	return i;
}

/** Join two paths at a node.
 *  @param r is the canonical element of some path
 *  @param i is an isolated node (equivalently, it is in a length 1 path)
 *  @param q is the canonical element of some path
 *  @return the new path formed by combining r,i and q (so r is the first
 *  part of the resultant path, then i, then q); this new path replaces
 *  the original paths
 */
path PathSet::join(path r, index i, path q) {
	cost dmin_i = dmin(i);
	left(i) = r; right(i) = q;
	if (r == 0 && q == 0) {
		; // do nothing
	} else if (r == 0) {
		dmin(i) = min(dmin(i),dmin(q));
		dmin(q) -= dmin(i);
		p(q) = i;
	} else if (q == 0) {
		dmin(i) = min(dmin(i),dmin(r));
		dmin(r) -= dmin(i);
		p(r) = i;
	} else {
		dmin(i) = min(dmin(r),min(dmin(i),dmin(q)));
		dmin(r) -= dmin(i); dmin(q) -= dmin(i);
		p(r) = p(q) = i;
	}
	dcost(i) = dmin_i - dmin(i);
	return i;
}

/** Divide a path at a node.
 *  @param i is a node in some path; the operation splits the path into three
 *  parts, the original portion of the path that precedes i, i itself, and
 *  the portion of the original path that follows i
 *  @return the a pair consisting of the two new path segments
 */
PathSet::PathPair PathSet::split(index i) {
	PathPair pair(0,0);

	splay(i);
	if (left(i) == 0) 
		pair.p1 = 0;
	else {
		pair.p1 = left(i); p(pair.p1) = 0; left(i) = 0;
		dmin(pair.p1) += dmin(i);
	} 
	if (right(i) == 0) 
		pair.p2 = 0;
	else {
		pair.p2 = right(i); p(pair.p2) = 0; right(i) = 0;
		dmin(pair.p2) += dmin(i);
	} 
	dmin(i) += dcost(i);
	dcost(i) = 0;

	return pair;
}

/** Determine the cost of a node without restructuring tree.
 *  This method is used mainly to construct a string representation of
 *  a path.
 *  @param i is a node in some path
 *  @return the cost of node i
 */
cost PathSet::nodeCost(index i) const {
	cost s;
	s = dcost(i);
	while (i != 0) { s += dmin(i); i = p(i); }
	return s;
}

/** Create a string representation of a path.
 *  @param q is the canonical element of some path
 *  @return the string
 */
string PathSet::path2string(path q) const {
	string s;
	if (q == 0) return s;
	s += path2string(left(q));
	s += Adt::index2string(q) + ":" + to_string(nodeCost(q)) + " ";
	s += path2string(right(q));
	return s;
}

/** Create a string representation of the tree representing a path.
 *  @param q is the canonical element of some path
 *  @return the string
 */
string PathSet::pathTree2string(path q) const {
	string s;
	if (q == 0) return s;
	bool singleton = (left(q) = 0 && right(q) == 0);
	if (!singleton) s += "(";
	s += pathTree2string(left(q));
	s += Adt::index2string(q) + ":" + to_string(nodeCost(q)) + " ";
	s += pathTree2string(right(q));
	if (!singleton) s += ")";
	return s;
}

/** Create a string representation of this object.
 *  @return the string
 */
string PathSet::toString() const {
	string s;
	for (index i = 1; i <= n(); i++) {
		if (p(i) == 0) s += path2string(i) + "\n";
	}
	return s;
}

} // ends namespace
