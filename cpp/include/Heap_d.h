/** @file Heap_d.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#ifndef HEAP_D_H
#define HEAP_D_H

//#include "stdinc.h"
#include "Adt.h"

namespace grafalgo {

/** This class implements a heap data structure.
 *  The heap elements are identified by integers in 1..n where n
 *  is specified when an object is constructed.
 */
template<class K> class Heap_d : public Adt {
public:		Heap_d(int,int=4);
		~Heap_d();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Heap_d&);

	// access methods
	index	findmin() const;
	K	key(index) const;

	// predicates
	bool	member(index) const;
	bool	empty() const;	
	int	size() const;

	// modifiers
	void	insert(index,K);
	void	remove(index);
	index 	deletemin();
	void	changekey(index,K);	

	string toString() const;
protected:
	int 	d;			///< base of heap
	int	hn;			///< number of items in the heap

	index	*h;			///< {h[1],...,h[hn]} is set of items
	int	*pos;			///< pos[i] gives position of i in h
	K	*kee;			///< kee[i] is key of item i

	// convenience methods for positions of parent, left child, right child
	int	p(int i) { return (i + (d-2))/d; };
	int	left(int i) { return d*(i-1) + 2; };
	int	right(int i) { return d*i + 1; };

	index	minchild(index);		
	void	siftup(index,int);
	void	siftdown(index,int);

	void	makeSpace();
	void	freeSpace();
	void	init();
};

/** Constructor for Heap_d class.
 *  @param n defines the index range for the object
 *  @param D1 is the degree of the underlying heap-ordered tree
 */
template<class K>
Heap_d<K>::Heap_d(int n, int dd) : Adt(n), d(dd) { makeSpace(); init(); }

/** Destructor for Heap_d class. */
template<class K>
Heap_d<K>::~Heap_d() { freeSpace(); }

/** Allocate space for Heap_d.
 *  @param size is number of index values to provide space for
 */
template<class K>
void Heap_d<K>::makeSpace() {
	h = new index[n()+1]; pos = new int[n()+1]; kee = new K[n()+1];
}

/** Initialize a Heap_d object. */
template<class K>
void Heap_d<K>::init() {
	for (int i = 1; i <= n(); i++) pos[i] = 0;
	h[0] = pos[0] = hn = 0;
}

/** Free dynamic storage used by Heap_d. */
template<class K>
void Heap_d<K>::freeSpace() { delete [] h; delete [] pos; delete [] kee; }

/** Copy into Heap_d from source. */
template<class K>
void Heap_d<K>::copyFrom(const Heap_d& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	d = source.d;
	for (int p = 1; p <= source.hn; p--) {
		index x = source.h[p];
		h[p] = x; pos[x] = p; kee[x] = source.key(x);
	}
}

/** Resize a Heap_d object.
 *  The old value is discarded.
 *  @param n is the size of the resize
 */
template<class K>
void Heap_d<K>::resize(int n) {
	freeSpace(); Adt::resize(n); makeSpace(); init();
}

/** Expand the space available for this Heap_d.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
template<class K>
void Heap_d<K>::expand(int size) {
	if (size <= n()) return;
	Heap_d old(this->n(),d); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Find an item in the heap with the smallest key.
 *  @return the index of an item that has the smallest key
 */
template<class K>
inline int Heap_d<K>::findmin() const { return hn == 0 ? 0 : h[1]; }

/** Delete a minimum key item from the heap and return it.
 *  @return the index an item of minimum key from the heap, after deleting it
 *  from the heap
 */
template<class K>
inline int Heap_d<K>::deletemin() {
	if (hn == 0) return 0;
	index i = h[1]; remove(h[1]);
	return i;
}

/** Get the key of item.
 *  @param i is the index of an item in the heap
 *  @return the value of i's key
 */
template<class K>
inline K Heap_d<K>::key(index i) const { assert(valid(i)); return kee[i]; }

/** Determine if an item is in the heap.
 *  @param i is the index of an item in the heap
 *  @return true if i is in the heap, else false
 */
template<class K>
inline bool Heap_d<K>::member(index i) const {
	assert(valid(i)); return pos[i] != 0;
}

/** Determine if the heap is empty.
 *  @return true if heap is empty, else false
 */
template<class K>
inline bool Heap_d<K>::empty() const { return hn == 0; };

/** Return size of heap.
 */
template<class K>
inline int Heap_d<K>::size() const { return hn; };

/** Remove all elements from heap. */
template<class K>
void Heap_d<K>::clear() {
	for (int x = 1; x <= hn; x++) pos[h[x]] = 0;
	hn = 0;
}

/** Add item to the heap.
 *  @param i is the index of an item that is not in the heap
 *  @param k is the key value under which i is to be inserted
 */
template<class K>
void Heap_d<K>::insert(index i, K k) {
	assert(valid(i) && !member(i)); kee[i] = k; hn++; siftup(i,hn);
}

/** Remove an item from the heap.
 *  @param i is an item in the heap
 */
template<class K>
void Heap_d<K>::remove(index i) {
	assert(member(i));
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
template<class K>
void Heap_d<K>::siftup(index i, int x) {
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
template<class K>
void Heap_d<K>::siftdown(index i, int x) {
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
template<class K>
int Heap_d<K>::minchild(int x) {
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
template<class K>
void Heap_d<K>::changekey(index i, K k) {
	assert(member(i));
	K ki = kee[i]; kee[i] = k;
	if (k == ki) return;
	if (k < ki) siftup(i,pos[i]);
	else siftdown(i,pos[i]);
}

/** Construct a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
template<class K>
string Heap_d<K>::toString() const {
	stringstream ss;
	for (int i = 1; i <= hn; i++) {
		if (i != 1) ss << " ";
		ss << "(" << index2string(h[i]) << "," << kee[h[i]] << ")";
	}
	return ss.str();
}

} // ends namespace

#endif
