/** @file BstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "BstSet.h"

#define left(x) (node[x].left)
#define right(x) (node[x].right)
#define p(x) (node[x].p)
#define kee(x) node[x].kee
#define p2(x) (p(p(x)))
#define sib(x) (x == left(p(x)) ? right(p(x)) : left(p(x)))
#define uncle(x) (sib(p(x))
#define nephew(x) (x == left(p(x)) ? right(right(p(x))) : left(left(p(x))))
#define niece(x) (x == left(p(x)) ? left(right(p(x))) : right(left(p(x))))
#define inner(x) (x!=0 && (x == left(right(p2(x))) || x == right(left(p2(x)))))
#define outer(x) (x!=0 && (x == left(left(p2(x))) || x == right(right(p2(x)))))

namespace grafalgo {

/** Constructor for BstSet class.
 *  @param size defines the index range for the constructed object.
 */
BstSet::BstSet(int size) : Adt(size) {
	makeSpace(size);
}

/** Destructor for BstSet class. */
BstSet::~BstSet() { freeSpace(); }

/** Allocate and initialize space for BstSet.
 *  @param size is number of index values to provide space for
 */
void BstSet::makeSpace(int size) {
	try {
		node = new BstNode[size+1];
	} catch (std::bad_alloc e) {
		string s = "makeSpace:: insufficient space for "
			   + to_string(size) + "index values";
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by BstSet. */
void BstSet::freeSpace() {
	delete [] node;
}

/** Reinitialize data structure, creating single node trees. */
void BstSet::clear() {
	for (index i = 0; i <= n(); i++) {
		left(i) = right(i) = p(i) = kee(i) = 0;
	}
	// note that null node (0) has null pointers
}

/** Resize a BstSet object, discarding old value.
 *  @param size is the size of the resized object.
 */
void BstSet::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "BstSet::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void BstSet::expand(int size) {
	if (size <= n()) return;
	BstSet old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}
/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void BstSet::copyFrom(const BstSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	for (index x = 1; x <= n(); x++) {
		node[x] = source.node[x];
	}
}

/** Perform a rotation in a search tree.
 *  @param x is a node in some search tree; this method
 *  moves x up into its parent's position
 */
void BstSet::rotate(index x) {
	index y = p(x);
	if (y == 0) return;
	index z;
	if (x == left(y)) { 
		z = right(x); left(y) = z; right(x) = y;
	} else {
		z = left(x); right(y) = z; left(x) = y;
	}
	if (y == left(p(y))) left(p(y)) = x;
	else if (y == right(p(y))) right(p(y)) = x;
	p(x) = p(y); p(y) = x;
	if (z != 0) p(z) = y;
}

void BstSet::rotate2(index x) {
	if (outer(x))	   { rotate(p(x)); rotate(x); }
	else if (inner(x)) { rotate(x); rotate(x); }
}

/** Get the root of a bst.
 *  @param i is the index of a node in some bst
 *  @return the root of the bst containing i; this method
 *  does not restructure the search tree
 */
bst BstSet::find(index i) const {
	assert (0 <= i && i <= n());
	while (p(i) != 0) i = p(i);
	return i;
}

/** Get the item with a specified key value.
 *  @param k is a key value
 *  @param t is a reference to the root of some bst;
 *  if the operation modifies the root, then s will change
 *  @return the item in s that has key value k, or 0 if there is no such item
 */
index BstSet::access(keytyp k, bst& t) const {
	assert (0 <= t && t <= n());
	index x = t;
	while (x != 0 && k != kee(x)) {
		if (k < kee(x)) x = left(x);
		else x = right(x);
	}
	return x;
}

/** Return the "first" node in a bst.
 *  This operation does not restructure the underlying search tree.
 *  @param t is the root of some bst
 *  @return the node with smallest key1 value in s
 */
index BstSet::first(bst t) const {
	while (left(t) != 0) t = left(t);
	return t;
}

/** Return the "last" node in a bst.
 *  This operation does not restructure the underlying search tree.
 *  @param t is the root of some bst
 *  @return the node with smallest key1 value in s
 */
index BstSet::last(bst t) const {
	while (right(t) != 0) t = right(t);
	return t;
}

/** Return the successor of a node in a bst.
 *  This operation does not restructure the underlying search tree.
 *  @param i is a node in some bst
 *  @return the node with largest key1 value in the bst
 */
index BstSet::suc(index i) const {
	if (right(i) != 0) {
		for (i = right(i); left(i) != 0; i = left(i)) {}
	} else {
		index c = i; i = p(i); 
		while (i != 0 && right(i) == c) { c = i; i = p(i); }
	}
	return i;
}

/** Return the predecessor of a node in a bst.
 *  This operation does not restructure the underlying search tree.
 *  @param i is a node in some bst
 *  @return the node with largest key1 value in the bst
 */
index BstSet::pred(index i) const {
	if (left(i) != 0) {
		for (i = left(i); right(i) != 0; i = right(i)) {}
	} else {
		index c = i; i = p(i); 
		while (i != 0 && left(i) == c) { c = i; i = p(i); }
	}
	return i;
}

/** Insert item into a bst.
 *  @param i is a singleton bst
 *  @param t is a reference to the root of some bst; if
 *  the insertion operation changes the root, t will be changed
 *  @return true on success (that is, i was inserted), false on failure
 *  (because key clashed with existing item)
 */
bool BstSet::insert(index i, bst& t) {
	assert (1 <= i && i <= n() && 0 <= t && t <= n());
	assert (left(0) == 0 && right(0) == 0 && p(0) == 0);
	if (t == 0) { t = i; return true; }
	index x = t;
	while (1) {
		     if (kee(i) < kee(x) &&  left(x) != 0) x = left(x);
		else if (kee(i) > kee(x) && right(x) != 0) x = right(x);
		else break;
	}
	     if (kee(i) < kee(x))  left(x) = i;
	else if (kee(i) > kee(x)) right(x) = i;
	else return false;
	p(i) = x;
	return true;
}

/** Swap the positions of two nodes in the same tree.
 *  @param i is a node in a search tree
 *  @param j is another node in the same tree, which is not the parent of i;
 *  this is a helper method for the remove method; it exchanges the
 *  positions of the nodes in the tree
 */
void BstSet::swap(index i, index j) {
	assert(1 <= i && i <= n() && 1 <= j && j <= n() && j != p(i));

	// save pointer fields for items i and j
	index li,ri,pi,lj,rj,pj;
	li = left(i); ri = right(i); pi = p(i);
	lj = left(j); rj = right(j); pj = p(j);

	// fixup fields in i's neighbors
	if (li != 0) p(li) = j;
	if (ri != 0) p(ri) = j;
	if (pi != 0) {
		if (i == left(pi)) left(pi) = j;
		else right(pi) = j;
	}
	// fixup fields in j's neighbors
	if (lj != 0) p(lj) = i;
	if (rj != 0) p(rj) = i;
	if (pj != 0) {
		if (j == left(pj)) left(pj) = i;
		else right(pj) = i;
	}

	// update fields in items i and j
	left(i) = lj; right(i) = rj; p(i) = pj;
	left(j) = li; right(j) = ri; p(j) = pi;

	// final fixup for the case that i was originally the parent of j
	     if (j == li) { left(j) = i; p(i) = j; }
	else if (j == ri) { right(j) = i; p(i) = j; }
}

/** Remove a node from a bst.
 *  @param i is a node in some bst
 *  @param t is a reference to the root of some bst; if
 *  the operation changes the root, t will be changed
 */
void BstSet::remove(index i, bst& t) {
	assert(1 <= i && i <= n() && 1 <= t && t <= n());
	index c = (left(t) != 0 ? left(t) : right(t));
        index j;
        if (left(i) != 0 && right(i) != 0) {
                for (j = left(i); right(j) != 0; j = right(j)) {}
                swap(i,j);
        }
        // now, i has at most one child
        j = (left(i) != 0 ? left(i) : right(i));
        // j is now the index of the only child that could be non-null
        if (j != 0) p(j) = p(i);
        if (p(i) != 0) {
                     if (i ==  left(p(i)))  left(p(i)) = j;
                else if (i == right(p(i))) right(p(i)) = j;
        }
        p(i) = left(i) = right(i) = 0;
	if (i == t) t = (p(c) == 0 ? c : p(c));
	return;
}

/** Form new bst by combining two bsts at a node.
 *  @param t1 is the root of some bst
 *  @param t2 is the root of some bst
 *  @param i is a singleton item with key value larger than those of the
 *  items in t1 and smaller than those of the items in t2
 *  @return new bst formed by merging t1, i and t2
 */
bst BstSet::join(bst t1, index i, bst t2) {
	assert(0 <= t1 && t1 <= n() && 1 <= i && i <= n() && 
	       0 <= t2 && t2 <= n());
	left(i) = t1; right(i) = t2;
	if (t1 != 0) p(t1) = i;
	if (t2 != 0) p(t2) = i;
	return i;
}

/** Divide a bst at a node.
 *  @param i is a node in some bst
 *  @param s is the root of the bst containing i
 *  @return the pair of bsts [t1,t2] that results from splitting s into three
 *  parts; t1 (containing ityems with keys smaller than that of i), i itself,
 *  and t2 (contining items with keys larger than that of i)
 */
BstSet::BstPair BstSet::split(index i, bst s) {
	assert(1 <= i && i <= n() && 1 <= s && s <= n());
	bst y = i; bst x = p(y);
	BstPair pair(left(i),right(i));
	while (x != 0) {
		bst px = p(x); // get this now, since join may change it
		if (y == left(x)) pair.t2 = join(pair.t2,x,right(x));
		else 		  pair.t1 = join(left(x),x,pair.t1);
		y = x; x = px;
	}
	left(i) = right(i) = p(i) = 0;
	p(pair.t1) = p(pair.t2) = 0;
	return pair;
}

/** Create a string representation of a node in a bst.
 *  @param i is a node in some bst
 *  @return the string
 */
string BstSet::node2string(index i) const {
	string s;
	if (i == 0) return s;
	s += Adt::index2string(i);
	if (p(i) == 0)	s += "*";
	else 		s += ":";
	s += to_string(key(i));
	return s;
}

/** Create a string representation of a bst.
 *  @param t is the root of some bst
 *  @return the string
 */
string BstSet::bst2string(bst t) const {
	string s;
	if (t == 0) return s;
	if (left(t) != 0) s += "(" + bst2string(left(t)) + ") ";
	s += node2string(t);
	if (right(t) != 0) s += " (" + bst2string(right(t)) + ")";
	return s;
}

/** Create a string representation of this object.
 *  Omits singleton trees.
 *  @return the string
 */
string BstSet::toString() const {
	string s;
	for (index i = 1; i <= n(); i++) {
		if (p(i) == 0 && (left(i) != 0 || right(i) != 0)) {
			s += bst2string(i) + "\n";
		}
	}
	return s;
}

} // ends namespace
