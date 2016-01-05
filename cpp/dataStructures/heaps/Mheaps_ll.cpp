/** @file Mheaps_ll.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Mheaps_ll.h"

#define kee(x) node[x].kee
#define rank(x) node[x].rank
#define left(x) node[x].left
#define right(x) node[x].right

#define deleted(x)((x > (n()/2)) || (delf != 0 && (*delf)(x)))

namespace grafalgo {

/** Constructor for the Mheaps_ll class.
 *  @param n is the number of items that the constructed object can hold;
 *  the index set is actually twice as large, to allow space for dummy nodes
 *  @param delftyp is pointer to a "deleted function"
 *  which takes a single item as its argment and returns true
 *  if that item should be considered deleted from the heap
 *  in which it is present
 */
Mheaps_ll::Mheaps_ll(int n, delftyp f) : Mheaps_l(2*n) {
	makeSpace(); clear(); delf = f;
}

/** Destructor for the Mheaps_ll class. */
Mheaps_ll::~Mheaps_ll() { freeSpace(); }

/** Allocate and initialize space for Mheaps_ll.
 */
void Mheaps_ll::makeSpace() { tmplst = new List(n()); }

/** Free dynamic storage used by Mheaps_ll. */
void Mheaps_ll::freeSpace() { delete tmplst; }

/** Copy another Mheaps_ll object to this one.
 *  @param source is the source object to be copied
 */
void Mheaps_ll::copyFrom(const Mheaps_ll& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index i = n()+1; i <= 2*n() ; i++)
		node[i] = source.node[i];
	dummy = source.dummy; delf = source.delf;
}

/** Resize a Mheaps_ll object.
 *  The old value is discarded.
 *  @param n is the size of the resized object.
 */
void Mheaps_ll::resize(int n) {
	freeSpace(); Mheaps_l::resize(2*n); makeSpace(); clear();
}

/** Expand the space available for this Mheaps_ll.
 *  Rebuilds old value in new space.
 *  @param n is the size of the resized object.
 */
void Mheaps_ll::expand(int n) {
	if (n <= (this->n()/2)) return;
	Mheaps_ll old(this->n()); old.copyFrom(*this);
	resize(n); this->copyFrom(old);
}

/** Remove all elements from heap. */
void Mheaps_ll::clear() {
	// build list of dummy nodes linked using left pointers
	Mheaps_l::clear(); tmplst->clear();
	for (index i = (n()/2)+1; i <= n() ; i++) left(i) = i+1;
	dummy = (n()/2)+1; left(2*n()) = 0;
	rank(0) = 0; left(0) = right(0) = 0;
}

/** Perform a lazy meld on two heaps.
 *  The lazy meld simply inserts a dummy node at the root of a new heap
 *  @param h1 is the canonical element of a heap (the root node of its tree)
 *  @param h2 is the canonical element of a heap
 *  @return the canonical element of the heap obtained by combining h1 and h2
 */
lheap Mheaps_ll::lmeld(lheap h1, lheap h2) {
	assert((h1 == 0 || valid(h1)) && (h2 == 0 || valid(h2)) && dummy != 0);
	int i = dummy; dummy = left(dummy);
	left(i) = h1; right(i) = h2;
	return i;
}

/** Insert an item into a heap.
 *  @param i is a singleton item
 *  @param h is the caonical element of some heap
 *  @return the canonical element of the heap obtained by inserting i into h
 */
lheap Mheaps_ll::insert(index i, lheap h) {
	assert(0 <= i && i <= (n()/2) && left(i) == 0 && right(i) == 0 &&
		rank(i) ==1 && valid(h));
	tmplst->clear(); purge(h,*tmplst); h = heapify(*tmplst);
	return meld(i,h);
}

/** Find the item with the smallest key in a heap.
 *  @param h is the canonical element of some heap
 *  @return the item in h that has the smallest key
 */
index Mheaps_ll::findmin(lheap h) {
	assert(h == 0 || valid(h));
	tmplst->clear(); purge(h,*tmplst); return heapify(*tmplst);
}

/** Remove "deleted nodes" from the top of a heap and construct a
 *  list of "sub-heaps" whose root nodes have not been deleted.
 *  This is a private helper function.
 *  @param h is the root of a "heap tree"
 *  @hlst is a list in which the result of the operation is returned;
 *  if h is a non-deleted node, it is removed and its children are
 *  purged.
 */
void Mheaps_ll::purge(lheap h, List& hlst) {
	if (h == 0) return;
	assert(valid(h));
	if (!deleted(h)) {
		hlst.addLast(h);
	} else {
		purge(left(h),hlst); purge(right(h),hlst);
		if (h > n()) {
			left(h) = dummy; dummy = h; right(h) = 0;
		} else {
			left(h) = right(h) = 0; rank(h) = 1;
		}
	}
}

/** Construct a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string Mheaps_ll::toString() const {
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
string Mheaps_ll::heap2string(lheap h, bool isroot) const {
	string s = "";
	if (h == 0) return s;
	if (left(h) == 0 && right(h) == 0) {
		if (deleted(h)) s += "- ";
		else s += index2string(h) + ":" + to_string(kee(h)) + ","
			+ to_string(rank(h));
	} else {
		s += "(";
		if (left(h) != 0) s += heap2string(left(h),false) + " ";
		if (deleted(h)) {
			s += "- ";
		} else {
			s += index2string(h) + ":" + to_string(kee(h)) + ","
			   + to_string(rank(h));
			if (isroot) s += "*";
		}
		if (right(h) != 0) s += " " + heap2string(right(h),false);
		s += ")";
	}
	return s;
}

} // ends namespace
