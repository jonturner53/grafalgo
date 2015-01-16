/** @file Glist.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GLIST_H
#define GLIST_H

#include "Adt.h"
#include "ListPair.h"

namespace grafalgo {

/** Data structure representing a generic list of values. 
 *  Unlike the List and Dlist classes, this class implements a general
 *  list type. However, each item in the list also has an associated index
 *  from the underlying index set. Indexes are used as arguments and
 *  return values by various methods (first(), next(), get, find,..).
 *  The value() method is is used to obtain the value of the list item
 *  with a specified index.
 */
template<class V> class Glist : public Adt {
public:		Glist();
		Glist(int);
		Glist(const Glist&);
		Glist(Glist&&);
		~Glist();

	void	resize(int);
	void	expand(int);

	Glist&	operator=(const Glist&);
	Glist&	operator=(Glist&&);
	bool	operator==(const Glist&);

	// methods to access items
	index 	get(position) const;
	index 	find(const V&, index=0) const;
	index	first() const;
	index	last() const;
	index	next(index) const;
	index	prev(index) const;
	V&	value(index) const;
	int	length() const;

	// predicates
	bool	empty() const;
	bool	member(index) const;
	bool	contains(const V&) const;
	
	// modifiers
	index	insert(const V&, index);
	index	addFirst(const V&);
	index	addLast(const V&);
	bool	remove(index);
	bool	removeFirst();
	bool	removeLast();
	void	clear();

	// input/output
	string	toString() const;

private:
	bool	autoExpand;

	// managing dynamic storage
        void    makeSpace();   
	void	freeSpace();
	void	copyContents(const Glist&);

	ListPair *lp;		///< list pair for index list and free space
	V	*vals;		///< vals[i] is list item with index i
};

/** Default constructor for Glist objects.
 */
template<class V>
Glist<V>::Glist() : Adt(10), autoExpand(true) {
	makeSpace();
}

/** Constructor for Glist objects with explicit index range.
 *  @param n is the largest index in the index range
 */
template<class V>
Glist<V>::Glist(int n) : Adt(n), autoExpand(false) {
	makeSpace();
}

/** Copy constructor. */
template<class V>
Glist<V>::Glist(const Glist& src) : Adt(src.n()) {
	makeSpace(); copyContents(src);
}

/** Move constructor. */
template<class V>
Glist<V>::Glist(Glist&& src) : Adt(src.n()) {
	lp = src.lp; vals = src.vals;
	src.lp = nullptr; src.vals = nullptr;
}

/** Destructor for Glist. */
template<class V>
Glist<V>::~Glist() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
template<class V>
void Glist<V>::makeSpace() { lp = new ListPair(n()); vals = new V[n()+1]; }

/** Free dynamic storage used by list. */
template<class V>
void Glist<V>::freeSpace() { delete lp; delete [] vals; }

/** Copy another Glist to this one.
 *  @param src is the Glist whose contents is to be copied.
 */
template<class V>
void Glist<V>::copyContents(const Glist& src) {
	*lp = *(src.lp);
	for (index x = src.first(); x != 0; x = src.next(x))
		vals[x] = src.vals[x];
}

/** Assignment operator (copy).
 *  @param src is the Glist which is to be assigned to this object.
 */
template<class V>
Glist<V>& Glist<V>::operator=(const Glist& src) {
        if (this == &src) return *this;
        if (src.n() > n()) resize(src.n());
        copyContents(src);
        return *this;
}

/** Assignment operator (move).
 *  @param src is the Glist which is to be assigned to this object.
 */
template<class V>
Glist<V>& Glist<V>::operator=(Glist&& src) {
        if (this == &src) return *this;
	freeSpace(); Adt::resize(src.n());
	lp = src.lp; vals = src.vals;
	src.lp = nullptr; src.vals = nullptr;
        return *this;
}

/** Equality comparison (copy).
 */
template<class V>
bool Glist<V>::operator==(const Glist& other) {
        if (this == &other) return true;
	index x = first(); index y = other.first();
	while (x != 0 && y != 0) {
		if (value(x) != other.value(y)) return false;
		x = next(x); y = other.next(y);
	}
        return x == 0 && y == 0;
}

/** Resize a Glist object.
 *  The old value is discarded.
 *  @param n is the size of the resized object.
 */
template<class V>
void Glist<V>::resize(int n) {
	freeSpace(); Adt::resize(n); makeSpace();
}

/** Expand the space available for this Glist.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
template<class V>
void Glist<V>::expand(int size) {
	if (size <= n()) return;
	lp->expand(size);
	V *old_vals = vals;
	Adt::resize(size);
	vals = new V[n()+1];
	for (index x = first(); x != 0; x = next(x))
		vals[x] = std::move(old_vals[x]);
	delete [] old_vals;
}

/** Return the value of a list item.
 *  @param i is the index of an item on the list
 *  @return the value of the list item with index i; throw illegal
 *  argument exception if no such item
 */
template<class V>
inline V& Glist<V>::value(index i) const {
	assert(member(i)); return vals[i];
}

/** Get the next index in the list.
 *  @param i is an index on the list
 *  @return the index that follows i, or 0 if there is no next index
 */
template<class V>
inline index Glist<V>::next(index i) const {
	assert(member(i)); return lp->nextIn(i);
}

/** Get the previous index in the list.
 *  @param i is an index on the list
 *  @return the index that precedes i, or 0 if there is no previous index
 */
template<class V>
inline index Glist<V>::prev(index i) const {
	assert(member(i)); return lp->prevIn(i);
}

/** Get first index on list.
 *  @return the first index on the list or 0 if the list is empty
 */
template<class V>
inline index Glist<V>::first() const { return lp->firstIn(); }

/** Get the last index on list.
 *  @return the last index on the list or 0 if the list is empty
 */
template<class V>
inline index Glist<V>::last() const { return lp->lastIn(); }

/** Test if list is empty.
 *  @return true if list is empty, else false.
 */
template<class V>
inline bool Glist<V>::empty() const { return lp->getNumIn() == 0; }

/** Determine the length of the list.
 *  @return the number of items in the list.
 */
template<class V>
inline int Glist<V>::length() const { return lp->getNumIn(); }

/** Test if an index is in the list.
 *  @param i is an index
 *  @return true if i is in the list, else false
 */
template<class V>
inline bool Glist<V>::member(index i) const {
	assert(valid(i)); return lp->isIn(i);
}

/** Determine if a value appears in list.
 *  @param v is a value
 *  @return true if some list item has the same value as v
 */
template<class V>
inline bool Glist<V>::contains(const V& v) const { return find(v) != 0; }

/** Add item to the front of the list.
 *  @param v is value to be added.
 *  @return true if the list was modified, else false
 */
template<class V>
inline index Glist<V>::addFirst(const V& v) { return insert(v,0); }

/** Add item to the end of the list.
 *  @param v is value to be added.
 *  @return true if the list was modified, else false
 */
template<class V>
inline index Glist<V>::addLast(const V& v) { return insert(v,last()); }

/** Remove the first item in the list.
 *  @return true if the list was modified, else false
 */
template<class V>
inline bool Glist<V>::removeFirst() { return remove(first()); }

/** Remove the last item in the list.
 *  @return true if the list was modified, else false
 */
template<class V>
inline bool Glist<V>::removeLast() { return remove(last()); }

/** Clear all items from list.
 */
template<class V> void Glist<V>::clear() {
        while (first() != 0) removeFirst();
}


/** Get an index for an item based on its position in the list.
 *  @param i is the position of item to be returned; negative values
 *  are interpreted relative to the end of the list.
 *  @return the index at the specfied position or 0 if no such item
 */
template<class V>
index Glist<V>::get(index i) const {
	if (i > n() || i < -n()) return 0;
	index j = 0;
	if (i > 0) {
		for (j = first(); --i; j = next(j)) {}
	} else if (i < 0) {
		for (j = last(); ++i; j = prev(j)) {}
	}
	return j;
}

/** Find the index of an item with a specified value.
 *  @param v is a reference to a value
 *  @param i is the index of an item in the list, or 0; optional (default=0)
 *  @return the index of the first item following i in the list that
 *  has the same value as v, or 0 if no such item; if i == 0, search
 *  the entire list
 */
template<class V>
index Glist<V>::find(const V& v, index i) const {
	assert(i == 0 || member(i));
	for (index j = (i == 0 ? first() : next(i)); j != 0; j = next(j))
		if (v == vals[j]) return j;
	return 0;
}

/** Insert a value into the list, following another item in the list.
 *  @param v is a reference to a value to insert
 *  @param j is the index of an item in the list or 0; if j == 0, v is
 *  inserted at the front of the list, otherwise it's inserted after item j
 *  @return the index of the new item or 0 if unsuccessful
 */
template<class V>
index Glist<V>::insert(const V& v, index j) {
	assert(j == 0 || member(j));
	index i = lp->firstOut();
	if (i == 0) {
		if (!autoExpand) return 0;
		expand(2*n()); i = lp->firstOut();
	}
	lp->swap(i,j); vals[i] = v; return i;
}

/** Remove an item from the list.
 *  @param i is index of an item to be removed
 *  @return true if the list was modified, else false
 */
template<class V>
bool Glist<V>::remove(index i) {
	assert(member(i)); lp->swap(i); return true;
}

/** Create a string representation of a given string.
 *  @return the string
 */
template<class V>
string Glist<V>::toString() const {
	stringstream ss; ss << "[";
	for (index i = first(); i != 0; i = next(i)) {
		if (i != first()) ss << ", ";
		ss << vals[i];
	}
	ss << "]";
	return ss.str();
}

} // ending namespace

#endif

