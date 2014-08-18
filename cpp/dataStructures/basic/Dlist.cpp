/** @file Dlist.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dlist.h"

namespace grafalgo {

/** Constructor for list.
 *  @param nn1 specifies the maximum index
 */
Dlist::Dlist(int nn1) : List(nn1) {
	makeSpace(); std::fill(prv, prv+n()+1, -1); prv[0] = 0;
}

/** Copy constructor.
 *  @param src is a Dlist whose contents are copied to this Dlist.
 */
Dlist::Dlist(const Dlist& src) : List(src) {
	makeSpace(); std::fill(prv, prv+n()+1, -1); prv[0] = 0;
	for (index x = src.first(); x != 0; x = src.next(x))
		prv[x] = src.prv[x];
}

/** Move constructor.
 *  @param src is a Dlist whose contents may be re-used
 */
Dlist::Dlist(Dlist&& src) : List(src) {
	prv = src.prv; src.prv = nullptr;
}

/** Destructor for Dlist. */
Dlist::~Dlist() { freeSpace(); }

/** Allocate and initialize space for list.
 *  Amount of space allocated is determined by value of n().
 */
void Dlist::makeSpace() {
	try { prv = new index[n()+1]; } catch (std::bad_alloc e) {
		string s = "Dlist: insufficient space for "
			   + to_string(n()) + " list elements";
		throw OutOfSpaceException(s);
	}
}

/** Free dynamic storage used by list. */
void Dlist::freeSpace() { delete [] prv; }

/** Resize a Dlist object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void Dlist::resize(int size) {
	freeSpace(); List::resize(size); makeSpace();
	std::fill(prv, prv+n()+1, -1); prv[0] = 0;
}

/** Expand the space available for this Dlist.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void Dlist::expand(int size) {
	int old_n = n();
	List::expand(size);
	if (n() == old_n) return;
	index *old_prv = prv; makeSpace();
	std::copy(old_prv, old_prv+old_n+1, prv);
	std::fill(prv+old_n+1, prv+n()+1, -1);
	delete [] old_prv;
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
	std::fill(prv, prv+n()+1, -1); prv[0] = 0;
	for (index x = src.first(); x != 0; x = src.next(x))
		prv[x] = src.prv[x];
	return *this;
}

/** Assignment operator (move).
 *  @param other is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
Dlist& Dlist::operator=(Dlist&& src) {
	if (this == &src) return *this;
	List::operator=(src); // move parent class data
	delete [] prv; prv = src.prv; src.prv = nullptr;
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
	for (j = last(); j != 0 && ++i; j = prv[j]) {}
	return j;
}

/** Insert an index into the list, relative to another.
 *  @param i is index to insert; if i is 0 or already in
 *  the list, no change is made
 *  @param j is index after which i is to be inserted;
 *  if j == 0, i is inserted at the front of the list
 *  @return true if list was modified, else false
 */
bool Dlist::insert(index i, index j) {
	if ((i < 0 || (i > n() && !autoExpand)) || (j < 0 || j > n())) {
                string s = "Dlist::insert(" + to_string(i) + ","
                           + to_string(j) + ")\n";
                throw IllegalArgumentException(s);
        }
        if (i == 0 || member(i)) return false;
        if (i > n() && autoExpand) expand(max(i,2*n()));

	if (!List::insert(i,j)) return false;
	// now update prv
	prv[i] = j;
	if (next(i) != 0) prv[next(i)] = i;
        return true;
}

/** Remove a specified index.
 *  @param i is an index to be removed
 *  @return true if the list was modified, else false
 */
bool Dlist::remove(index i) {
	if (!member(i)) return false;
	int old_n = n();
	if (i == first()) {
		prv[next(i)] = 0; List::removeNext(0);
	} else if (i == last()) {
		List::removeNext(prv[i]);
	} else {
		prv[next(i)] = prv[i]; List::removeNext(prv[i]);
	}
	prv[i] = -1;
	if (n() != old_n) { // parent class shrunk object
		freeSpace(); makeSpace();
		std::fill(prv, prv+n()+1, -1); prv[0] = 0;
	}
	return true;
}

/** Remove all elements from list. */
void Dlist::clear() { while (!empty()) removeFirst(); }

} // ends namespace
