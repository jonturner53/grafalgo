/** @file Pathset.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Pathset.h"

#define left(x) pnode[x].left
#define right(x) pnode[x].right
#define p(x) pnode[x].p
#define dcost(x) pnode[x].dcost
#define dmin(x) pnode[x].dmin

/** Constructor for Pathset class.
 *  @param N is the number of vertices in the object
 */
Pathset::Pathset(int N) : n(N) {
	node i;
	pnode = new PathNode[n+1];
	for (i = 0; i <= n; i++) {
		left(i) = right(i) = p(i) = 0;
		dcost(i) = dmin(i) = 0;
	}
}

/** Destructor for Pathset class. */
Pathset::~Pathset() { delete [] pnode; }

/** Perform a splay operation on the binary search tree representing a path.
 *  @param x is a node in some path; the operation does a splay operation
 *  that moves x to the root of the search tree that represents the path
 *  containing x
 */
node Pathset::splay(node x) {
	while (p(x) != 0) splaystep(x);
	return x;
}

/** Perform a single splay step.
 *  @param x is a node in some path
 */
void Pathset::splaystep(node x) {
        node y = p(x);
        if (y == 0) return;
        node z = p(y);
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
void Pathset::rotate(node x) {
        node y = p(x); if (y == 0) return;
        node a, b, c;
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
}

/** Return the canonical element of some path.
 *  @param i is a node in some path
 *  @return the node that is the canonical element of the path at the
 *  start of the operation; the operation performs a splay at i,
 *  so after the operation i is the canonical element.
 */
path Pathset::findpath(node i) { 
	node x;
	for (x = i; p(x) != 0; x = p(x)) {}
	splay(i);
	return x;
}

/** Return the last node in a path.
 *  @param q is the canonical element of some path
 *  @return the last node in the path containing q
 */
path Pathset::findtail(path q) {
	if (q == 0) return 0;
	while (right(q) != 0) q = right(q);
	return splay(q);
}

/** Add to the cost of every node in a path.
 *  @param q is the canonical element of some path
 *  @param x is the amount to be added to the costs of the nodes in
 *  the path
 */
void Pathset::addpathcost(path q, cost x) { dmin(q) += x; }

/** Find the the last node on a path that has minimum cost.
 *  @param q is the canonical element of some path
 *  @return a pair containing the last node on the path that has minimum
 *  cost and its cost
 */
PathCostPair Pathset::findpathcost(path q) {
	while (1) {
		if (right(q) != 0 && dmin(right(q)) == 0)
			q = right(q);
		else if (dcost(q) > 0)
			q = left(q);
		else
			break;
	}
	q = splay(q);
	PathCostPair cp = { q, dmin(q) };
	return cp;
}

/** Find the root of tree represent a path, while not restructuring the tree.
 *  This is used mainly for constructing a string representation of a path.
 *  @param i is a node in some path
 *  @return the root of the search tree containing i
 */
path Pathset::findtreeroot(node i) {
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
path Pathset::join(path r, node i, path q) {
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
PathPair Pathset::split(node i) {
	PathPair pair;

	splay(i);
	if (left(i) == 0) 
		pair.s1 = 0;
	else {
		pair.s1 = left(i); p(pair.s1) = 0; left(i) = 0;
		dmin(pair.s1) += dmin(i);
	} 
	if (right(i) == 0) 
		pair.s2 = 0;
	else {
		pair.s2 = right(i); p(pair.s2) = 0; right(i) = 0;
		dmin(pair.s2) += dmin(i);
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
cost Pathset::nodeCost(node i) const {
	cost s;
	s = dcost(i);
	while (i != 0) { s += dmin(i); i = p(i); }
	return s;
}

/** Create a string representation of a path.
 *  @param q is the canonical element of some path
 *  @param s is a string in which the result is returned
 *  @return a referece to s
 */
string& Pathset::path2string(path q, string& s) const {
	s = ""; string s1;
	if (q == 0) return s;
	s += path2string(left(q),s1);
	s += Util::node2string(q,n,s1) + ":";
	s += Util::num2string(nodeCost(q),s1) + " ";
	s += path2string(right(q),s1);
	return s;
}

/** Create a string representation of the tree representing a path.
 *  @param q is the canonical element of some path
 *  @param s is a string in which the result is returned
 *  @return a referece to s
 */
string& Pathset::pathTree2string(path q, string& s) const {
	stringstream ss;
	s = "";
	if (q == 0) return s;
	bool singleton = (left(q) = 0 && right(q) == 0);
	if (!singleton) ss << "(";
	ss << pathTree2string(left(q),s);
	ss << Util::node2string(q,n,s) << ":" << nodeCost(q) << " ";
	ss << pathTree2string(right(q),s);
	if (!singleton) ss << ")";
	s = ss.str();
	return s;
}

/** Create a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a referece to s
 */
string& Pathset::toString(string& s) const {
	s = ""; string s1;
	for (node i = 1; i <= n; i++) {
		if (p(i) == 0) s += path2string(i,s1) + "\n";
	}
	return s;
}
