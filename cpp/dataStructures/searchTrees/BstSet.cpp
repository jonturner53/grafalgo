/** @file BstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "BstSet.h"

#define left(x) node[x].left
#define right(x) node[x].right
#define p(x) node[x].p
#define kee(x) node[x].kee

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
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
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
}

/** Resize a BstSet object, discarding old value.
 *  @param size is the size of the resized object.
 */
void BstSet::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "BstSet::resize::" + e.toString(s);
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
 *  @param x is a node in some search tree; this method does a rotation
 *  at the parent of x, moving x up into it's parent's position
 */
void BstSet::rotate(index x) {
	index y = p(x);
	if (y == 0) return;
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
}

/** Get the canonical element of a bst.
 *  @param i is the index of an item in some bst
 *  @return the canonical element of the bst containing i; this method
 *  does not restructure the search tree
 */
bst BstSet::find(index i) const {
	assert (0 <= i && i <= n());
	while (p(i) != 0) i = p(i);
	return i;
}

/** Get the item with a specified key value.
 *  @param k is a key value
 *  @param t is a reference to the canonical element of some bst;
 *  if the operation modifies the canonical element, then s will change
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

/** Insert item into a bst.
 *  @param i is a singleton item
 *  @param t is a reference to the canonical element of some bst; if
 *  the insertion operation changes the canonical element, t will be changed
 *  @return true on success, false on failure
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

/** Remove an item from a bst.
 *  @param i is an item in some bst
 *  @param t is a reference to the canonical element of some bst; if
 *  the operation changes the canonical element, t will be changed
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

/** Form new bst by combining two bsts at an item.
 *  @param t1 is the canonical element of some bst
 *  @param t2 is the canonical element of some bst
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

/** Divide a bst at an item
 *  @param i is an item in some bst
 *  @param s is the canonical element of the bst containing i
 *  @return the pair of bsts [t1,t2] that results from splitting s into three
 *  parts; t1 (containing ityems with keys smaller than that of i), i itself,
 *  and t2 (contining items with keys larger than that of i)
 */
BstSet::BstPair BstSet::split(index i, bst s) {
	assert(1 <= i && i <= n() && 1 <= s && s <= n());
	bst y = i; BstPair pair(left(i),right(i));
	for (bst x = p(y); x != 0; x = p(y)) {
		     if (y ==  left(x)) pair.t2 = join(pair.t2,x,right(x));
		else if (y == right(x)) pair.t1 = join(left(x),x,pair.t1);
		y = x;
	}
	left(i) = right(i) = p(i) = 0;
	p(pair.t1) = p(pair.t2) = 0;
	return pair;
}

/** Create a string representation of an item in a bst.
 *  @param i is an item in some bst
 *  @param s is a string in which the result will be returned
 *  @return a reference to s
 */
string& BstSet::node2string(index i, string& s) const {
	stringstream ss;
	s = "";
	if (i == 0) return s;
	ss << Adt::item2string(i,s) << ":" << key(i);
	if (p(i) == 0) ss << "*";
	s = ss.str();
	return s;
}

/** Create a string representation of a bst.
 *  @param t is the canonical element of some bst
 *  @param s is a string in which the result will be returned
 *  @return a reference to s
 */
string& BstSet::bst2string(bst t, string& s) const {
	s = "";
	if (t == 0) return s;
	string s1;
	if (left(t) != 0) s += "(" + bst2string(left(t),s1) + ") ";
	s += node2string(t,s1);
	if (right(t) != 0) s += " (" + bst2string(right(t),s1) + ")";
	return s;
}

/** Create a string representation of this object.
 *  Omits singleton trees.
 *  @param s is a string in which the result will be returned
 *  @return a reference to s
 */
string& BstSet::toString(string& s) const {
	string s1;
	s = "";
	for (index i = 1; i <= n(); i++) {
		if (p(i) == 0 && (left(i) != 0 || right(i) != 0)) {
			s += bst2string(i,s1) + "\n";
		}
	}
	return s;
}

} // ends namespace
