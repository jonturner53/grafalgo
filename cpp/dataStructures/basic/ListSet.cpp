/** @file ListSet.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ListSet.h"

namespace grafalgo {

/** Constructor for ListSet.
 *  @param nitems defines the set of integers 1..nn1 on which the
 *  lists are defined; each integer can be on at most one list
 *  @param nlists specifies the number of lists in the set
 */
ListSet::ListSet(int nitems, int nlists) : Adt(nitems), nlst(nlists) {
	makeSpace(nitems,nlists);
}

/** Destructor for ListSet class. */
ListSet::~ListSet() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param nitems is number of index values to provide space for
 *  @param nlists is the number of lists to provide space for
 */
void ListSet::makeSpace(int nitems, int nlists) {
	try {
		nxt = new index[nitems+1]; lh = new listhdr[nlists+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "ListSet::makeSpace: insufficient space for "
		   << nitems << "index values and " << nlists << " lists";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	for (int i = 0; i <= nlst; i++) { lh[i].head = lh[i].tail = 0; }
	for (int i = 0; i <= nitems; i++) nxt[i] = -1;
	nn = nitems; nlst = nlists;
}

/** Free dynamic storage used by list. */
void ListSet::freeSpace() { delete [] lh; delete [] nxt; }

/** Remove all items from all lists. */
void ListSet::clear() {
	for (alist ll = 1; ll <= nlst; ll++) {
		while (!empty(ll)) removeFirst(ll);
	}
}

/** Resize a ListSet object.
 *  The old value is discarded.
 *  @param nitems is the number of items in the resized object.
 *  @param nlists is the number of lists in the resized object.
 */
void ListSet::resize(int nitems, int nlists) {
	freeSpace();
	try { makeSpace(nitems,nlists); } catch(OutOfSpaceException e) {
		string s; s = "ListSet::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ListSet.
 *  Rebuilds old value in new space.
 *  @param nitems is the size of the resized object.
 */
void ListSet::expand(int nitems, int nlists) {
	if (nitems <= n() && nlists <= nlst) return;
	ListSet old(this->n(),this->nlst); old.copyFrom(*this);
	resize(nitems,nlists); this->copyFrom(old);
}

/** Copy into list from source. */
void ListSet::copyFrom(const ListSet& src) {
	if (&src == this) return;
	if (src.n() > n() || src.nlst > nlst) resize(src.n(),src.nlst);
	else clear();
	for (alist ll = 1; ll <= src.nlst; ll++) {
		for (index x = src.first(ll); x != 0; x = src.next(ll))
			addLast(x,ll);
	}
}

/** Add an index to a list.
 *  @param i is a list index, which is currently not in any list
 *  @param j is a list number; the index i is added to the end of list j
 */
void ListSet::addLast(index i, alist j) {
	if (i == 0) return;
	if (lh[j].head == 0) lh[j].head = i;
	else nxt[lh[j].tail] = i;
	lh[j].tail = i; nxt[i] = 0;
}

/** Remove the first index from a list.
 *  @param j is a list number
 *  @return the first index on list j or 0, if it is empty
 */
int ListSet::removeFirst(alist j) {
	int i = lh[j].head;
	if (i == 0) return 0;
	lh[j].head = nxt[i]; nxt[i] = -1;
	return i;
}

/** Add an index to the front of a list.
 *  @param i is an index, which is currently not in any list
 *  @param j is a list number; the index i is added to the front of list j
 */
void ListSet::addFirst(index i, alist j) {
	if (i == 0) return;
	if (lh[j].head == 0) lh[j].tail = i;
	nxt[i] = lh[j].head;
	lh[j].head = i;
}

/** Build a string representation of a list.
 *  @param j is a list number
 *  @return the string
 */
string ListSet::list2string(alist j) const {
	int i;
	string s = "";
	s += to_string(j) + ": ";
	for (i = first(j); i != 0; i = next(i)) {
		string s1;
		s += item2string(i) + " ";
	}
	s += "\n";
	return s;
}

/** Build a string representation of a set of lists.
 *  @return the string
 */
string ListSet::toString() const {
	alist j;
	string s = "";
	for (j = 1; j <= nlst; j++) {
		if (lh[j].head != 0) s += list2string(j);
	}
	return s;
}

} // ends namespace
