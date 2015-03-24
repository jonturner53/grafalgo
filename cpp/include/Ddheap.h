/** @file Ddheap.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DDHEAP_H
#define DDHEAP_H

#include "Dheap.h"

namespace grafalgo {

/** This class implements a dynamic heap data structure by extending the
 *  Dheap class. Specifically, it adds a constant time addtokeys operation.
 */
template<class K>
class Ddheap : public Dheap<K> {
public:		Ddheap(int,int);
		~Ddheap();

	// common methods
	void	clear();
	void	copyFrom(const Ddheap&);

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
inline K Ddheap<K>::key(index i) const { return Dheap<K>::kee[i] + delta; }

/** Constructor for Ddheap class.
 *  @param size is the number of items in the contructed object
 *  @param dd is the degree of the underlying heap-ordered tree
 */
template<class K>
inline Ddheap<K>::Ddheap(int size, int dd) : Dheap<K>(size,dd) { delta = 0; }

/** Destructor for Ddheap class. */
template<class K>
inline Ddheap<K>::~Ddheap() { }

/** Copy into Ddheap from source. */
template<class K>
inline void Ddheap<K>::copyFrom(const Ddheap& source) {
	this->Dheap<K>::copyFrom(source);
	delta = source.delta;
}

/** Clear contents of heap. */
template<class K>
inline void Ddheap<K>::clear() {
	this->Dheap<K>::clear(); delta = 0;
}

/** Add item to the heap.
 *  @param i is the index of an item that is not in the heap
 *  @param k is the key value under which i is to be inserted
 */
template<class K>
inline void Ddheap<K>::insert(index i, K k) {
	Dheap<K>::kee[i] = k - delta; Dheap<K>::hn++; Dheap<K>::siftup(i,Dheap<K>::hn);
}

/** Add to the keys of all items in the heap.
 *  @param x is value to add to all the keys.
 */
template<class K>
inline void Ddheap<K>::addtokeys(K x) { delta += x; }


/** Change the key of an item in the heap.
 *  @param i is the index of an item that is not in the heap
 *  @param k is the new key value for i
 */
template<class K>
inline void Ddheap<K>::changekey(index i, K k) {
	Dheap<K>::changekey(i,k-delta);
}

/** Construct a string representation of this object.
 *  @return the string
 */
template<class K>
inline string Ddheap<K>::toString() const {
	stringstream ss;
	for (int i = 1; i <= Dheap<K>::hn; i++) {
		ss << "(" << Adt::index2string(Dheap<K>::h[i]) << ","
		   << Dheap<K>::kee[Dheap<K>::h[i]] + delta << ")";
		if (i < Dheap<K>::hn) ss << " ";
	}
	return ss.str();
}

} // ends namespace

#endif
