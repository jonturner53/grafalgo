/** @file Dlist.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dlist.h"

namespace grafalgo {

/** Default constructor for Dlist objects.  */
Dlist::Dlist() : List() { makeSpace(); init(); }

/** Constructor for Dlist objects with explicit index range.
 *  @param n specifies the maximum index
 */
Dlist::Dlist(int n) : List(n) { makeSpace(); init(); }

/** Copy constructor.
 *  @param src is a Dlist whose contents are copied to this Dlist.
 */
Dlist::Dlist(const Dlist& src) : List(src) {
	makeSpace(); init();
	for (index x = src.first(); x != 0; x = src.next(x))
		pred[x] = src.pred[x];
}

/** Move constructor.
 *  @param src is a Dlist whose contents may be re-used
 */
Dlist::Dlist(Dlist&& src) : List(src) {
	pred = src.pred; src.pred = nullptr;
}

/** Destructor for Dlist. */
Dlist::~Dlist() { freeSpace(); }

/** Allocate and initialize space for list.
 *  Amount of space allocated is determined by value of n().
 */
void Dlist::makeSpace() { pred = new index[n()+1]; }

/** Free dynamic storage used by list. */
void Dlist::freeSpace() { delete [] pred; }

/** Initialize object.  */
void Dlist::init() { std::fill(pred, pred+n()+1, -1); pred[0] = 0; }

/** Resize a Dlist object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void Dlist::resize(int size) {
	freeSpace(); List::resize(size); makeSpace(); init();
}

/** Expand the space available for this Dlist.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void Dlist::expand(int size) {
	int old_n = n();
	List::expand(size);
	if (n() == old_n) return;
	index *old_pred = pred; makeSpace();
	std::copy(old_pred, old_pred+old_n+1, pred);
	std::fill(pred+old_n+1, pred+n()+1, -1);
	delete [] old_pred;
}

/** Assignment operator (copy).
 *  @param other is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
Dlist& Dlist::operator=(const Dlist& src) {
	if (this == &src) return *this;
	int old_n = n();
	List::operator=(src); // copy parent class data
	if (n() != old_n) {  // parent resized, do likewise
		freeSpace(); makeSpace();
	}
	init();
	for (index x = src.first(); x != 0; x = src.next(x))
		pred[x] = src.pred[x];
	return *this;
}

/** Assignment operator (move).
 *  @param other is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
Dlist& Dlist::operator=(Dlist&& src) {
	if (this == &src) return *this;
	List::operator=(src); // move parent class data
	delete [] pred; pred = src.pred; src.pred = nullptr;
	return *this;
}

/** Get an index based on its position in the list.
 *  @param i is position of index to be returned; negative values
 *  are interpreted relative to the end of the list.
 *  @return the index at the specfied position
 */
index Dlist::get(int i) const {
	if (i >= 0) return List::get(i);
	index j;
	for (j = last(); j != 0 && ++i; j = pred[j]) {}
	return j;
}

/** Insert an index into the list, relative to another.
 *  @param i is index to insert
 *  @param j is index after which i is to be inserted;
 *  if j == 0, i is inserted at the front of the list
 *  @return true if list was modified, else false
 */
void Dlist::insert(index i, index j) {
        if (i > n() && autoExpand) expand(max(i,2*n()));
	assert((valid(i) && !member(i)) && (j == 0 || member(j)));
	List::insert(i,j);
	// now update pred
	pred[i] = j;
	if (next(i) != 0) pred[next(i)] = i;
}

/** Remove a specified index.
 *  @param i is an index to be removed
 */
void Dlist::remove(index i) {
	if (!member(i)) return;
	if (i == first()) {
		pred[next(i)] = 0; List::removeNext(0);
	} else {
		if (i != last()) pred[next(i)] = pred[i];
		List::removeNext(pred[i]);
	}
	pred[i] = -1;
}

/** Remove all elements from list. */
void Dlist::clear() { while (!empty()) removeFirst(); }

} // ends namespace
