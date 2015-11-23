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
