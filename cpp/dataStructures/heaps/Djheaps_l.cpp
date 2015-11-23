/** @file Djheaps_l.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Djheaps_l.h"

#define kee(x) node[x].kee
#define rank(x) node[x].rank
#define left(x) node[x].left
#define right(x) node[x].right

namespace grafalgo {

/** Constructor for Djheaps_l class
 *  @param n is the number of items in the constructed object
 */
Djheaps_l::Djheaps_l(int n) : Adt(n) {
	makeSpace(); clear();
}

/** Destructor for Djheaps_l class. */
Djheaps_l::~Djheaps_l() { freeSpace(); }

/** Allocate and initialize space for Djheaps_l.
 */
void Djheaps_l::makeSpace() { node = new hnode[n()+1]; }

/** Free dynamic storage used by Djheaps_l. */
void Djheaps_l::freeSpace() { delete [] node; }

/** Copy into Djheaps_l from source. */
void Djheaps_l::copyFrom(const Djheaps_l& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (int i = 1; i <= source.n(); i++) {
		node[i] = source.node[i];
	}
}

/** Resize a Djheaps_l object.
 *  The old value is discarded.
 *  @param n is the size of the resized object.
 */
void Djheaps_l::resize(int n) {
	freeSpace(); Adt::resize(n); makeSpace(); clear();
}

/** Expand the space available for this Djheaps_l.
 *  Rebuilds old value in new space.
 *  @param n is the size of the resized object.
 */
void Djheaps_l::expand(int n) {
	if (n <= this->n()) return;
	Djheaps_l old(this->n()); old.copyFrom(*this);
	resize(n); this->copyFrom(old);
}

/** Remove all elements from heap. */
void Djheaps_l::clear() {
	for (int i = 1; i <= n(); i++) {
		left(i) = right(i) = 0; rank(i) = 1; kee(i) = 0;
	}
	rank(0) = 0; left(0) = right(0) = 0;
}

/** Combine a list of heaps into a single heap.
 *  @param hlst is a list of heaps (more precisely, their canonical elements)
 *  @return the new heap obtained by combining all the heaps
 *  in the list into one heap
 */
lheap Djheaps_l::heapify(List& hlst) {
	if (hlst.empty()) return 0;
	while (hlst.get(2) != 0) {
		lheap h = meld(hlst.get(1), hlst.get(2));
		hlst.removeFirst(); hlst.removeFirst(); hlst.addLast(h);
	}
	return hlst.first();
}

/** Combine two heaps.
 *  @param h1 is the canonical element of a heap, or 0
 *  @param h2 is the canonical element of a heap, or 0
 *  @param return the canonical element of the heap obtained
 *  by combining h1 and h2
 */
lheap Djheaps_l::meld(lheap h1, lheap h2) {
	assert((h1 == 0 || valid(h1)) && (h2 == 0 || valid(h2)));
	     if (h1 == 0) return h2;
	else if (h2 == 0) return h1;
	if (kee(h1) > kee(h2)) {
		lheap t = h1; h1 = h2; h2 = t;
	}
	right(h1) = meld(right(h1),h2);
	if (rank(left(h1)) < rank(right(h1))) {
		lheap t = left(h1); left(h1) = right(h1); right(h1) = t;
	}
	rank(h1) = rank(right(h1)) + 1;
	return h1;
}

/** Insert a singleton item into a heap.
 *  @param i is a singleton item
 *  @param h is the canonical element of a heap
 *  @param x is key value under which i is to be inserted
 *  @return the canonical element of the heap that results from inserting
 *  i into h
 */
lheap Djheaps_l::insert(index i, lheap h) {
	assert((i == 0 || valid(i)) && (h == 0 || valid(h)));
	assert(left(i) == 0 && right(i) == 0 && rank(i) == 1);
	return meld(i,h);
}

/** Remove the item with smallest key from a heap.
 *  @param h is the canonical element of some heap
 *  @return the canonical element of the resulting heap
 */
index Djheaps_l::deletemin(lheap h) {
	assert(valid(h));
	lheap h1 = meld(left(h),right(h));
	left(h) = right(h) = 0; rank(h) = 1;
	return h1;
}

/** Construct a string representation of this object.
 *  @return the string
 */
string Djheaps_l::toString() const {
	string s = "";
	int i; bool *isroot = new bool[n()+1];
	for (i = 1; i <= n(); i++) isroot[i] = true;
	for (i = 1; i <= n(); i++)
		isroot[left(i)] = isroot[right(i)] = false;
	for (i = 1; i <= n(); i++) {
		if (isroot[i] && (left(i) != 0 || right(i) != 0)) {
			s += heap2string(i) + "\n";
		}
	}
	delete [] isroot;
	return s;
}

/** Recursive helper for constructing a string representation of a heap.
 *  @param h is a node in one of the trees of the heap
 *  @param isroot is true if h is the canonical element of the heap
 *  @return the string
 */
string Djheaps_l::heap2string(lheap h, bool isroot) const {
	string s = "";
	if (h == 0) return s;
	if (left(h) == 0 && right(h) == 0) {
		s += index2string(h) + ":" + to_string(kee(h)) + ","
			+ to_string(rank(h));
	} else {
		s += "(";
		if (left(h) != 0) s += heap2string(left(h),false) + " ";
		s += index2string(h) + ":" + to_string(kee(h)) + ","
		     + to_string(rank(h));
		if (isroot) s += "*";
		if (right(h) != 0) s += " " + heap2string(right(h),false);
		s += ")";
	}
	return s;
}

} // ends namespace
