/** @file BalBstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "BalBstSet.h"

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

/** Constructor for BalBstSet class.
 *  @param size defines the index range for the constructed object.
 */
BalBstSet::BalBstSet(int size) : BstSet(size) {
	makeSpace(size);
}

/** Destructor for BalBstSet class. */
BalBstSet::~BalBstSet() { freeSpace(); }

/** Allocate and initialize space for BalBstSet.
 *  @param size is number of index values to provide space for
 */
void BalBstSet::makeSpace(int size) {
	try {
		rvec = new int[size+1];
	} catch (std::bad_alloc e) {
		string s = "makeSpace:: insufficient space for "
			   + to_string(size) + "index values";
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by BalBstSet. */
void BalBstSet::freeSpace() {
	delete [] rvec;
}

/** Reinitialize data structure, creating single node trees. */
void BalBstSet::clear() {
	BstSet::clear();
	for (index i = 1; i <= n(); i++) {
		rank(i) = 1;
	}
	rank(0) = 0; // note: null node has rank 0
}

/** Resize a BalBstSet object, discarding old value.
 *  @param size is the size of the resized object.
 */
void BalBstSet::resize(int size) {
	freeSpace();
	BstSet::resize(size);
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "BalBstSet::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void BalBstSet::expand(int size) {
	if (size <= n()) return;
	BalBstSet old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}
/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void BalBstSet::copyFrom(const BalBstSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	BstSet::copyFrom(source);
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
void BalBstSet::swap(index i, index j) {
	BstSet::swap(i,j);
	int r = rvec[i]; rvec[i] = rvec[j]; rvec[j] = r;
}

/** Insert a singleton tree into a bst (bst) in the collection.
 *  @param i is an item (node) to be inserted; it must be a singleton
 *  @param root is a reference to the root of the bst that i
 *  is to be added to; if the operation changes the root
 *  then root will be changed
 *  @return true on success, false on failure
 */
bool BalBstSet::insert(index i, bst& root) {
	assert(rank(0) == 0);
	if (!BstSet::insert(i,root)) return false;
	if (root == i) return true;
	rebalance1(i);
	if (p(root) != 0) root = p(root); // rebalancing might move root down 1
	return true;
}

/** Rebalance the tree after a node rank increases.
 *  x is a node whose rank may equal that of its grandparent,
 *  in violation of the rank invariant.
 */
void BalBstSet::rebalance1(index x) {
	while (rank(p2(x)) == rank(x) && rank(uncle(x)) == rank(x)) {
		x = p2(x); rank(x)++;
	}
	if (rank(x) != rank(p2(x))) return;
	if (outer(x)) rotate(p(x));
	else rotate2(x);
}

/** Remove an item from a bst.
 *  @param i is the item to be removed
 *  @param root is a reference to the root of the bst
 *  containing i; if the operation changes the root,
 *  s will be changed to reflect that
 */
void BalBstSet::remove(index i, bst& root) {
	assert(rank(0) == 0);
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
 *  x is a node in a tree or 0
 *  px is the parent of x, or a node with a null child, if x=0
 *  in violation of the rank invariant.
 */
void BalBstSet::rebalance2(index x, index px) {
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
				else 		      rotate2(nece);
				rank(px) = r+1; rank(p(px)) = r+2;
				break;
			}
		}
	}
}

/** Join two bsts at an item.
 *  @param t1 is the root of some bst
 *  @param t2 is the root of some bst
 *  @param i is a singleton i whose key is larger than that of the keys
 *  in t1 and smaller than that of the keys in t2
 *  @return the new bst that results from merging t1, i and t2
 */
bst BalBstSet::join(bst t1, index i, bst t2) {
	if (i == 0) return 0;
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
	// ensure i is a singleton
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
string BalBstSet::node2string(index i) const {
	string s;
	if (i == 0) return s;
	s += Adt::item2string(i);
	if (p(i) == 0)	s += "*";
	else 		s += ":";
	s += to_string(key(i)) + ":" + to_string(rank(i));
	return s;
}

} // ends namespace
