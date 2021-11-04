/** @file Heap_dd.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef HEAP_DD_H
#define HEAP_DD_H

#include "Heap_d.h"

namespace grafalgo {

/** This class implements a dynamic heap data structure by extending the
 *  Heap_d class. Specifically, it adds a constant time addtokeys operation.

Tarjan describes more elaborate version of this that uses
key differences along path to root. Is that really necessary?

can we prove simple version works?

invariant: for each heap item i key(i) = delta + dkey(i).

addtokeys changes both key and delta by same amount,
so invariant is preserved by addtokeys.

insert(i) sets dkey(i) to value that makes invariant true;
no change to delta, so invariant preserved by insert.

delete/deletemin does not change any other heap item, so invariant is
preserved.

changekey alters dkey(i) but not delta, so invariant is preserved

All key comparisons can use either key or dkey, since all have
the same difference with delta

This all seems to support the simpler version, so why does Tarjan
describe the more complicated version? Is it because we do need key
differences in dynamic trees and he just wants to introduce idea?
Or perhaps simple version works for dheaps but not leftist heaps?
Or is there some subtlety I am missing?

The issue arises with melding heaps. If two heaps have different
delta values, then melding requires updating of dkey fields.
So no problem with simpler approach with dheap.
 */
template<class K>
class Heap_dd : public Heap_d<K> {
public:		Heap_dd(int,int);
		~Heap_dd();

	// common methods
	void	clear();
	void	copyFrom(const Heap_dd&);

	// access methods
	K	key(index) const;

	// modifiers
	void	insert(index,K);
	void	changekey(index,K);	
	void	addtokeys(K);	

	string toString() const;
private:
	K	delta;
};

/** Get the key of item.
 *  @param i is the index of an item in the heap
 *  @return the value of i's key
 */
template<class K>
inline K Heap_dd<K>::key(index i) const { return Heap_d<K>::kee[i] + delta; }

/** Constructor for Heap_dd class.
 *  @param size is the number of items in the contructed object
 *  @param dd is the degree of the underlying heap-ordered tree
 */
template<class K>
inline Heap_dd<K>::Heap_dd(int size, int dd) : Heap_d<K>(size,dd) { delta = 0; }

/** Destructor for Heap_dd class. */
template<class K>
inline Heap_dd<K>::~Heap_dd() { }

/** Copy into Heap_dd from source. */
template<class K>
inline void Heap_dd<K>::copyFrom(const Heap_dd& source) {
	this->Heap_d<K>::copyFrom(source);
	delta = source.delta;
}

/** Clear contents of heap. */
template<class K>
inline void Heap_dd<K>::clear() {
	this->Heap_d<K>::clear(); delta = 0;
}

/** Add item to the heap.
 *  @param i is the index of an item that is not in the heap
 *  @param k is the key value under which i is to be inserted
 */
template<class K>
inline void Heap_dd<K>::insert(index i, K k) {
	Heap_d<K>::kee[i] = k - delta; Heap_d<K>::hn++; Heap_d<K>::siftup(i,Heap_d<K>::hn);
}

/** Add to the keys of all items in the heap.
 *  @param x is value to add to all the keys.
 */
template<class K>
inline void Heap_dd<K>::addtokeys(K x) { delta += x; }


/** Change the key of an item in the heap.
 *  @param i is the index of an item that is not in the heap
 *  @param k is the new key value for i
 */
template<class K>
inline void Heap_dd<K>::changekey(index i, K k) {
	Heap_d<K>::changekey(i,k-delta);
}

/** Construct a string representation of this object.
 *  @return the string
 */
template<class K>
inline string Heap_dd<K>::toString() const {
	stringstream ss;
	for (int i = 1; i <= Heap_d<K>::hn; i++) {
		ss << "(" << Adt::index2string(Heap_d<K>::h[i]) << ","
		   << Heap_d<K>::kee[Heap_d<K>::h[i]] + delta << ")";
		if (i < Heap_d<K>::hn) ss << " ";
	}
	return ss.str();
}

} // ends namespace

#endif
