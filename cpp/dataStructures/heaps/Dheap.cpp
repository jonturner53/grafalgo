/** @file Dheap.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dheap.h"

#define p(x) (((x)+(d-2))/d)
#define left(x) (d*((x)-1)+2)
#define right(x) (d*(x)+1)

namespace grafalgo {

/** Constructor for Dheap class.
 *  @param size is the number of items in the contructed object
 *  @param D1 is the degree of the underlying heap-ordered tree
 */
Dheap::Dheap(int size, int dd) : Adt(size), d(dd) {
	makeSpace(size);
}

/** Destructor for Dheap class. */
Dheap::~Dheap() { freeSpace(); }

/** Allocate and initialize space for Dheap.
 *  @param size is number of index values to provide space for
 */
void Dheap::makeSpace(int size) {
	try {
		h = new index[size+1]; pos = new int[size+1];
		kee = new keytyp[size+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	for (int i = 1; i <= size; i++) pos[i] = 0;
	h[0] = pos[0] = 0; kee[0] = 0;
	hn = 0; nn = size;
}

/** Free dynamic storage used by Dheap. */
void Dheap::freeSpace() { delete [] h; delete [] pos; delete [] kee; }

/** Copy into Dheap from source. */
void Dheap::copyFrom(const Dheap& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	d = source.d;
	for (int p = 1; p <= source.hn; p--) {
		index x = source.h[p];
		h[p] = x; pos[x] = p; kee[x] = source.key(x);
	}
}

/** Resize a Dheap object.
 *  The old value is discarded.
 *  @param size is the size of the resize
 */
void Dheap::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "Dheap::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Dheap.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Dheap::expand(int size) {
	if (size <= n()) return;
	Dheap old(this->n(),d); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Remove all elements from heap. */
void Dheap::clear() {
	for (int x = 1; x <= hn; x++) pos[h[x]] = 0;
	hn = 0;
}

/** Add item to the heap.
 *  @param i is the index of an item that is not in the heap
 *  @param k is the key value under which i is to be inserted
 */
void Dheap::insert(index i, keytyp k) {
	kee[i] = k; hn++; siftup(i,hn);
}

/** Remove an item from the heap.
 *  @param i is an item in the heap
 */
void Dheap::remove(index i) {
	int j = h[hn--];
	if (i != j) {
		if (kee[j] <= kee[i]) siftup(j,pos[i]);
		else siftdown(j,pos[i]);
	}
	pos[i] = 0;
}

/** Perform siftup operation to restore heap order.
 *  This is a private helper function.
 *  @param i is the index of an item to be positioned in the heap
 *  @param x is a tentative position for i in the heap
 */
void Dheap::siftup(index i, int x) {
	int px = p(x);
	while (x > 1 && kee[i] < kee[h[px]]) {
		h[x] = h[px]; pos[h[x]] = x;
		x = px; px = p(x);
	}
	h[x] = i; pos[i] = x;
}

/** Perform siftdown operation to restore heap order.
 *  This is a private helper function.
 *  @param i is an index to be positioned in the heap
 *  @param x is a tentative position for i in the heap
 */
void Dheap::siftdown(index i, int x) {
	int cx = minchild(x);
	while (cx != 0 && kee[h[cx]] < kee[i]) {
		h[x] = h[cx]; pos[h[x]] = x;
		x = cx; cx = minchild(x);
	}
	h[x] = i; pos[i] = x;
}

/** Find the position of the child withthe smallest key.
 *  This is a private helper function, used by siftdown.
 *  @param x is a position of an item in the heap
 *  @return the position of the child of the item at x, that has
 *  the smallest key
 */
int Dheap::minchild(int x) {
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
void Dheap::changekey(index i, keytyp k) {
	keytyp ki = kee[i]; kee[i] = k;
	if (k == ki) return;
	if (k < ki) siftup(i,pos[i]);
	else siftdown(i,pos[i]);
}

/** Construct a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string Dheap::toString() const {
	string s;
	for (int i = 1; i <= hn; i++) {
		if (i != 1) s += " ";
		s += "(" + item2string(h[i]) + ","
			+ to_string(kee[h[i]]) + ")";
	}
	return s;
}

} // ends namespace
