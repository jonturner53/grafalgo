/** @file DiffHeap.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "DiffHeap.h"

#define p(x) ((x)/2)
#define left(x) (2*(x))
#define right(x) (2*(x)+1)

namespace grafalgo {

/** Constructor for DiffHeap class.
 *  @param size is the number of items in the contructed object
 *  @param D1 is the degree of the underlying heap-ordered tree
 */
DiffHeap::DiffHeap(int size) : Adt(size) {
	makeSpace(size);
}

/** Destructor for DiffHeap class. */
DiffHeap::~DiffHeap() { freeSpace(); }

/** Allocate and initialize space for DiffHeap.
 *  @param size is number of index values to provide space for
 */
void DiffHeap::makeSpace(int size) {
	try {
		h = new index[size+1]; pos = new int[size+1];
		dkey = new keytyp[size+1];
	} catch (std::bad_alloc e) {
		string s = "makeSpace:: insufficient space for "
		   		+ to_integer(size) + " index values";
		throw OutOfSpaceException(s);
	}
	for (int i = 1; i <= size; i++) pos[i] = 0;
	h[0] = pos[0] = 0; dkey[0] = 0;
	hn = 0; nn = size;
}

/** Free dynamic storage used by DiffHeap. */
void DiffHeap::freeSpace() { delete [] h; delete [] pos; delete [] dkey; }

/** Copy into DiffHeap from source. */
void DiffHeap::copyFrom(const DiffHeap& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (int p = 1; p <= source.hn; p--) {
		index x = source.h[p];
		h[p] = x; pos[x] = p; dkey[x] = source.dkey[x];
	}
}

/** Resize a DiffHeap object.
 *  The old value is discarded.
 *  @param size is the size of the resize
 */
void DiffHeap::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "DiffHeap::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this DiffHeap.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void DiffHeap::expand(int size) {
	if (size <= n()) return;
	DiffHeap old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Remove all elements from heap. */
void DiffHeap::clear() {
	for (int x = 1; x <= hn; x++) pos[h[x]] = 0;
	hn = 0;
}

/** Get the key of item.
 *  @param i is the index of an item in the heap
 *  @return the value of i's key
 */
inline keytyp DiffHeap::key(index i) const {
	keytyp s = 0; x = pos[i];
	while (x != 0) s += dkey[h[x]]
	return s;
}

/** Add item to the heap.
 *  @param i is the index of an item that is not in the heap
 *  @param k is the key value under which i is to be inserted
 */
void DiffHeap::insert(index i, keytyp k) {
	hn++; siftup(i,k,hn,key(p(hn));
}

/** Remove an item from the heap.
 *  @param i is an item in the heap
 */
void DiffHeap::remove(index i) {
	int j = h[hn--];
	if (i != j) {
		keytyp ki = key(i); keytyp kj = key(j);
		if (kj <= ki) siftup(j,kj,pos[i]);
		else siftdown(j,kj,pos[i]);
	}
	pos[i] = 0;
}

/** Perform siftup operation to restore heap order.
 *  This is a private helper function.
 *  @param i is the index of an item to be positioned in the heap
 *  @param ki is the key of i
 *  @param x is a tentative position for i in the heap
 *  @param kpx is the key of the parent of the item at position x

tricky to get this right - maybe try letting dkey(x) become negative,
then adjusting heap until all are non-negative
 */
void DiffHeap::siftup(index i, keytyp ki, int x, keytyp kx) {
	int px = p(x);
	while (x > 1 && ki < kpx) {
		h[x] = h[px]; pos[h[x]] = x;
		x = px; px = p(x);
		siftupCount++;
	}
	h[x] = i; pos[i] = x;
}

/** Perform siftdown operation to restore heap order.
 *  This is a private helper function.
 *  @param i is an index to be positioned in the heap
 *  @param x is a tentative position for i in the heap
 */
void DiffHeap::siftdown(index i, int x) {
	int cx = minchild(x);
	while (cx != 0 && kee[h[cx]] < kee[i]) {
		h[x] = h[cx]; pos[h[x]] = x;
		x = cx; cx = minchild(x);
		siftdownCount += d;
	}
	h[x] = i; pos[i] = x;
}

/** Find the position of the child withthe smallest key.
 *  This is a private helper function, used by siftdown.
 *  @param x is a position of an item in the heap
 *  @return the position of the child of the item at x, that has
 *  the smallest key
 */
int DiffHeap::minchild(int x) {
	int y; int minc = left(x);
	if (minc > hn) return 0;
	for (y = minc + 1; y <= right(x) && y <= hn; y++) {
		if (kee[h[y]] < kee[h[minc]]) minc = y;
	}
	return minc;
}

/** Change the key of an item in the heap.
 *  @param i is the index of an item in the heap
 *  @param k is a new key value for item i
 */
void DiffHeap::changekey(index i, keytyp k) {
	changekeyCount++;
	keytyp ki = kee[i]; kee[i] = k;
	if (k == ki) return;
	if (k < ki) siftup(i,pos[i]);
	else siftdown(i,pos[i]);
}

/** Construct a string representation of this object.
 *  @return the string
 */
string DiffHeap::toString() const {
	string s = "";
	for (int i = 1; i <= hn; i++) {
		string s1;
		s += "(" + Adt::item2string(h[i],s1);
		s += "," + Adt::item2string(kee[h[i]],s1) + ") ";
		if ((i%10) == 0) s += "\n";
	}
	if ((hn%10) != 0) s += "\n";
	return s;
}

/** Clear the statistics counters */
void DiffHeap::clearStats() {
	siftupCount = siftdownCount = changekeyCount = 0;
}

/** Return a string representation of the statistics counters.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string DiffHeap::stats2string() const {
	string s = "changekeyCount = " + changekeyCount + "  ";
	s += "siftupCount = " + siftupCount + "  ";
	s += "siftdownCount = " + siftdownCount;
	return s;
}

} // ends namespace
