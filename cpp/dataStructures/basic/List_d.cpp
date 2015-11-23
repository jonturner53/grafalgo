/** @file List_d.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "List_d.h"

namespace grafalgo {

/** Default constructor for List_d objects.  */
List_d::List_d() : List() { makeSpace(); init(); }

/** Constructor for List_d objects with explicit index range.
 *  @param n specifies the maximum index
 */
List_d::List_d(int n) : List(n) { makeSpace(); init(); }

/** Copy constructor.
 *  @param src is a List_d whose contents are copied to this List_d.
 */
List_d::List_d(const List_d& src) : List(src) {
	makeSpace(); init();
	for (index x = src.first(); x != 0; x = src.next(x))
		pred[x] = src.pred[x];
}

/** Move constructor.
 *  @param src is a List_d whose contents may be re-used
 */
List_d::List_d(List_d&& src) : List(src) {
	pred = src.pred; src.pred = nullptr;
}

/** Destructor for List_d. */
List_d::~List_d() { freeSpace(); }

/** Allocate and initialize space for list.
 *  Amount of space allocated is determined by value of n().
 */
void List_d::makeSpace() { pred = new index[n()+1]; }

/** Free dynamic storage used by list. */
void List_d::freeSpace() { delete [] pred; }

/** Initialize object.  */
void List_d::init() { std::fill(pred, pred+n()+1, -1); pred[0] = 0; }

/** Resize a List_d object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void List_d::resize(int size) {
	freeSpace(); List::resize(size); makeSpace(); init();
}

/** Expand the space available for this List_d.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void List_d::expand(int size) {
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
List_d& List_d::operator=(const List_d& src) {
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
List_d& List_d::operator=(List_d&& src) {
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
index List_d::get(int i) const {
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
void List_d::insert(index i, index j) {
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
void List_d::remove(index i) {
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
void List_d::clear() { while (!empty()) removeFirst(); }

} // ends namespace
