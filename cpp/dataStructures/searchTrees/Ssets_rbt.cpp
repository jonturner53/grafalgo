/** @file Ssets_rbt.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Ssets_rbt.h"

#define left(x) (node[x].left)
#define right(x) (node[x].right)
#define p(x) (node[x].p)
#define kee(x) node[x].kee
#define rank(x) (rvec[x])
#define p2(x) (p(p(x)))
#define sib(x) (x == left(p(x)) ? right(p(x)) : left(p(x)))
#define uncle(x) (sib(p(x)))
#define nephew(x) (x == left(p(x)) ? right(right(p(x))) : left(left(p(x))))
#define niece(x) (x == left(p(x)) ? left(right(p(x))) : right(left(p(x))))
#define inner(x) (x!=0 && (x == left(right(p2(x))) || x == right(left(p2(x)))))
#define outer(x) (x!=0 && (x == left(left(p2(x))) || x == right(right(p2(x)))))

namespace grafalgo {

/** Constructor for Ssets_rbt class.
 *  @param n defines the index range for the constructed object.
 */
Ssets_rbt::Ssets_rbt(int n) : Ssets(n) { makeSpace(); init(); }

/** Destructor for Ssets_rbt class. */
Ssets_rbt::~Ssets_rbt() { freeSpace(); }

/** Allocate and initialize space for Ssets_rbt.  */
void Ssets_rbt::makeSpace() { rvec = new int[n()+1]; }

/** Free dynamic storage used by Ssets_rbt. */
void Ssets_rbt::freeSpace() { delete [] rvec; }

/** Reinitialize data structure, creating single node trees. */
void Ssets_rbt::clear() { Ssets::clear(); init(); }

/** Initialize data defined by subclass. */
void Ssets_rbt::init() {
	for (index i = 1; i <= n(); i++) rank(i) = 1;
	rank(0) = 0; // note: null node has rank 0
}

/** Resize a Ssets_rbt object, discarding old value.
 *  @param n is the size of the resized object.
 */
void Ssets_rbt::resize(int n) {
	freeSpace(); Ssets::resize(n); makeSpace(); clear();
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param n is the size of the expanded object.
 */
void Ssets_rbt::expand(int n) {
	if (n <= this->n()) return;
	Ssets_rbt old(this->n()); old.copyFrom(*this);
	resize(n); this->copyFrom(old);
}

/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void Ssets_rbt::copyFrom(const Ssets_rbt& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	Ssets::copyFrom(source);
	for (index x = 1; x <= n(); x++) {
		rvec[x] = source.rvec[x];
	}
}

/** Swap the positions of two nodes in the same tree.
 *  @param i is a node in a search tree
 *  @param j is another node in the same tree, which is not the parent of i;
 *  this is a helper method for the remove method; it exchanges the
 *  positions of the nodes in the tree
 */
void Ssets_rbt::swap(index i, index j) {
	Ssets::swap(i,j);
	int r = rvec[i]; rvec[i] = rvec[j]; rvec[j] = r;
}

/** Insert a singleton index into a bst in the collection.
 *  @param i is an index of a (singleton) node to be inserted
 *  @param root is a reference to the index of the root of the tree that i
 *  is to be added to; if the operation changes the root
 *  then the variable in the calling program is changed
 *  @return true on success, false on failure
 */
bool Ssets_rbt::insert(index i, bst& root) {
	if (!Ssets::insert(i,root)) return false;
	if (root == i) return true;
	rebalance1(i);
	if (p(root) != 0) root = p(root); // rebalancing might move root down 1
	return true;
}

/** Rebalance the tree after a node rank increases.
 *  @param x is a node whose rank may equal that of its grandparent,
 *  in violation of the rank invariant.
 */
void Ssets_rbt::rebalance1(index x) {
	while (rank(p2(x)) == rank(x) && rank(uncle(x)) == rank(x)) {
		x = p2(x); rank(x)++;
	}
	if (rank(x) != rank(p2(x))) return;
	if (outer(x)) rotate(p(x));
	else rotate2(x);
}

/** Remove a node from a bst.
 *  @param i is the index of a node to be removed
 *  @param root is a reference to the root of the bst
 *  containing i; if the operation changes the root,
 *  s will be changed to reflect that
 */
void Ssets_rbt::remove(index i, bst& root) {
	assert(valid(i) && valid(root) && p(root) == 0 && rank(0) == 0);
	if (i == 0 || root == 0) return;
	index top = (root != i ? root :
			(right(root) != 0 ? right(root) : left(root)));
	// top is a node that will remain close to the root even
	// after deletion and rebalancing

	// remove i from the tree
	index j;
	if (left(i) != 0 && right(i) != 0) {
		for (j = left(i); right(j) != 0; j = right(j)) {}
		swap(i,j);
	}
	// now, i has at most one child
	j = (left(i) != 0 ? left(i) : right(i));
	// j is now the index of the only child that could be non-null
	index pj = p(i);
	if (pj != 0) {
		if (i == left(pj)) left(pj) = j;
		else 		   right(pj) = j;
	}
	if (j != 0) p(j) = pj;
	p(i) = left(i) = right(i) = 0; rank(i) = 1;

	rebalance2(j,pj);
	// top is 0 or is within 2 steps of the root
	root = (p(top) == 0 ? top : (p2(top) == 0 ? p(top) : p2(top)));
}

/** Rebalance the tree after a node rank decreases.
 *  @param x is a node in a tree or 0
 *  @param px is the parent of x, or a node with a null child, if x=0
 *  in violation of the rank invariant.
 */
void Ssets_rbt::rebalance2(index x, index px) {
	while (rank(px) == rank(x)+2) {
		int r = rank(x);
		index sx, nefu, nece;
		if (x != 0) {
			sx = sib(x); nefu = nephew(x); nece = niece(x);
		} else if (left(px) != 0) { // && x == 0
			sx = left(px); nefu = left(sx); nece = right(sx);
		} else { // x == 0 && right(px) != 0
			sx = right(px); nefu = right(sx); nece = left(sx);
		}
		if (rank(sx) == r+2) {
			rotate(sx);
		} else { // rank(sx) == r+1
			if (rank(nefu) == r && rank(nece) == r) {
				rank(px) = r+1; x = px; px = p(x);
			} else {
				if (rank(nefu) == r+1) rotate(sx);
				else 			  rotate2(nece);
				rank(px) = r+1; rank(p(px)) = r+2;
				break;
			}
		}
	}
}

/** Join two bsts at an node.
 *  @param t1 is the index of the root of some bst (or subtree)
 *  @param t2 is the index of the root of some bst (or subtree)
 *  @param i is the index of a node whose key is larger than
 *  that of the keys in t1 and smaller than that of the keys in t2
 *  @return the new bst that results from merging t1, i and t2
 */
bst Ssets_rbt::join(bst t1, index i, bst t2) {
	assert(valid(i) && (t1 == 0 || valid(t1)) && (t2 == 0 || valid(t2)));
	// first, detach t1, t2 if necessary
	if (p(t1) != 0) { // implies t1 != 0
		if (t1 == left(p(t1)))	left(p(t1)) = 0;
		else			right(p(t1)) = 0;
		p(t1) = 0;
	} 
	if (p(t2) != 0) { // implies t2 != 0
		if (t2 == left(p(t2)))	left(p(t2)) = 0;
		else			right(p(t2)) = 0;
		p(t2) = 0;
	}
	left(i) = right(i) = p(i) = 0; rank(i) = 1;
	// handle cases of null subtrees
	if (t1 == 0 && t2 == 0) {
		return i;
	} else if (t1 == 0) {
		insert(i,t2); return t2;
	} else if (t2 == 0) {
		insert(i,t1); return t1;
	}
	// now proceed to typical cases
	if (rank(t1) == rank(t2)) {
		left(i) = t1; right(i) = t2; p(i) = 0; p(t1) = p(t2) = i;
		rank(i) = rank(t1) + 1;
		return i;
	} else if (rank(t1) < rank(t2)) {
		index x;
		for (x = left(t2); rank(t1) < rank(x); x = left(x)) {}
		left(i) = t1; right(i) = x; p(i) = p(x);
		left(p(i)) = i; p(x) = p(t1) = i;
		rank(i) = rank(t1) + 1; // this may violate rank invariant
		rebalance1(i);
		if (p(t2) != 0) t2 = p(t2);
		return t2;
	} else { // rank(t1) > rank(t2);
		index x;
		for (x = right(t1); rank(x) > rank(t2); x = right(x)) {}
		left(i) = x; right(i) = t2; p(i) = p(x);
		right(p(i)) = i; p(x) = p(t2) = i;
		rank(i) = rank(t2) + 1; // this may violate rank invariant
		rebalance1(i);
		if (p(t1) != 0) t1 = p(t1);
		return t1;
	}
}

/** Create a string representing an item.
 *  @param i is an item in some bst
 *  @return the string
 */
string Ssets_rbt::node2string(index i) const {
	string s;
	if (i == 0) return s;
	s += Adt::index2string(i);
	if (p(i) == 0)	s += "*";
	else 		s += ":";
	s += to_string(key(i)) + ":" + to_string(rank(i));
	return s;
}

} // ends namespace
