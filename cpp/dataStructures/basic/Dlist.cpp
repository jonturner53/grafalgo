/** @file Dlist.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dlist.h"

namespace grafalgo {

/** Constructor for a Dlist object.
 *  @param nn1 defines the set of integers 1..nn1 for which this object
 *  is defined.
 */
Dlist::Dlist(int n1) : List(n1) {
	assert(n() >= 0); makeSpace(n());
}

/** Destructor for Dlist */
Dlist::~Dlist() { freeSpace(); }

/** Allocate and initialize dynamic storage space.
 *  @param size is the number of elements for which space is to be allocated
 */
void Dlist::makeSpace(int size) {
        prv = new index[size+1];
        for (index i = 1; i <= size; i++) prv[i] = -1;
        prv[0] = 0;
	nn = size;
}

/** Release dynamic storage used by this object. */
void Dlist::freeSpace() { delete [] prv; }

/** Resize a Dlist object.
 *  This discards the old object.
 *  @param size is the number of elements in the re-sized list object
 */
void Dlist::resize(int size) {
	List::resize(size); freeSpace(); makeSpace(size);
}

/** Expand the space available for this List.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Dlist::expand(int size) {
        if (size <= n()) return;
        Dlist old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
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
	if (i == 0 || !List::removeNext(prev(i)))
		return false;
	if (prv[i] == 0) prv[first()] = 0;
	else {
		index j = prv[i];
		if (next(j) != 0) prv[next(j)] = j;
	}
	prv[i] = -1;
	return true;
}

} // ends namespace
