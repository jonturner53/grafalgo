/** @file LheapSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "LheapSet.h"

#define kee(x) node[x].kee
#define rank(x) node[x].rank
#define left(x) node[x].left
#define right(x) node[x].right

namespace grafalgo {

/** Constructor for LheapSet class
 *  @param size is the number of items in the constructed object
 */
LheapSet::LheapSet(int size) : Adt(size) {
	makeSpace(size);
}

/** Destructor for LheapSet class. */
LheapSet::~LheapSet() { freeSpace(); }

/** Allocate and initialize space for LheapSet.
 *  @param size is number of index values to provide space for
 */
void LheapSet::makeSpace(int size) {
	try {
		node = new hnode[size+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by LheapSet. */
void LheapSet::freeSpace() { delete [] node; }

/** Copy into LheapSet from source. */
void LheapSet::copyFrom(const LheapSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (int i = 1; i <= source.n(); i++) {
		node[i] = source.node[i];
	}
}

/** Resize a LheapSet object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void LheapSet::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "LheapSet::resize::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this LheapSet.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void LheapSet::expand(int size) {
	if (size <= n()) return;
	LheapSet old(n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Remove all elements from heap. */
void LheapSet::clear() {
	for (int i = 1; i <= n(); i++) {
		left(i) = right(i) = 0; rank(i) = 1; kee(i) = 0;
	}
	rank(0) = 0; left(0) = right(0) = 0;
}

/** Combine two heaps.
 *  @param h1 is the canonical element of a heap
 *  @param h2 is the canonical element of a heap
 *  @param return the canonical element of the heap obtained
 *  by combining h1 and h2
 */
lheap LheapSet::meld(lheap h1, lheap h2) {
	assert(0 <= h1 && h1 <= n() && 0 <= h2 && h2 <= n());
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
lheap LheapSet::insert(index i, lheap h) {
	assert(0 <= i && i <= n() && 0 <= h && h <= n());
	assert(left(i) == 0 && right(i) == 0 && rank(i) ==1);
	return meld(i,h);
}

/** Remove the item with smallest key from a heap.
 *  @param h is the canonical element of some heap
 *  @return the canonical element of the resulting heap
 */
index LheapSet::deletemin(lheap h) {
	lheap h1 = meld(left(h),right(h));
	left(h) = right(h) = 0; rank(h) = 1;
	return h1;
}

/** Construct a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& LheapSet::toString(string& s) const {
	s = "";
	int i; bool *isroot = new bool[n()+1];
	for (i = 1; i <= n(); i++) isroot[i] = true;
	for (i = 1; i <= n(); i++)
		isroot[left(i)] = isroot[right(i)] = false;
	for (i = 1; i <= n(); i++) {
		if (isroot[i] && (left(i) != 0 || right(i) != 0)) {
			string s1; s += heap2string(i,s1) + "\n";
		}
	}
	delete [] isroot;
	return s;
}

/** Recursive helper for constructing a string representation of a heap.
 *  @param h is a node in one of the trees of the heap
 *  @param isroot is true if h is the canonical element of the heap
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& LheapSet::heap2string(lheap h, bool isroot, string& s) const {
	s = "";
	if (h == 0) return s;
	stringstream ss;
	if (left(h) == 0 && right(h) == 0) {
		ss << item2string(h,s) << ":" << kee(h) << "," << rank(h);
	} else {
		ss << "(";
		if (left(h) != 0) ss << heap2string(left(h),false,s) << " ";
		ss << item2string(h,s) << ":" << kee(h) << "," << rank(h);
		if (isroot) ss << "*";
		if (right(h) != 0) ss << " " << heap2string(right(h),false,s);
		ss << ")";
	}
	s = ss.str();
	return s;
}

} // ends namespace