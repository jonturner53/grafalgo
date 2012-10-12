/** @file UiList.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "UiList.h"

/** Create a list that can hold items in 1..nn1 */
UiList::UiList(int nn1) : nn(nn1) {
	assert(nn >= 0);
	try { makeSpace(nn); } catch(OutOfSpaceException e) {
		string s; s = "UiList::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Create a list from another */
UiList::UiList(UiList& source) : nn(source.n()) {
	assert(nn >= 0);
	try { makeSpace(nn); } catch(OutOfSpaceException e) {
		string s; s = "UiList::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
	copyFrom(source);
}

/** Destructor for UiList. */
UiList::~UiList() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param nu_n is number of items to provide space for
 */
void UiList::makeSpace(int nu_n) {
	nn = nu_n;
	try { nxt = new item[nn+1]; } catch (bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << nu_n << "items";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	for (item i = 1; i <= nn; i++) nxt[i] = -1;
	nxt[0] = 0; head = tail = 0;
}

/** Free dynamic storage used by list. */
void UiList::freeSpace() { delete [] nxt; }

/** Copy into list from original. */
void UiList::copyFrom(const UiList& original) {
	if (&original == this) return;
	if (original.n() > n()) reSize(original.n());
	for (item i = original.first(); i != 0; i = original.next(i))
		addLast(i);
}

/** Resize a UiList object.
 *  The old value is discarded.
 *  @param nu_n is the size of the resized object.
 */
void UiList::reSize(int nu_n) {
	freeSpace();
	try { makeSpace(nu_n); } catch(OutOfSpaceException e) {
		string s; s = "UiList::reSize::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Remove all elements from list. */
void UiList::clear() {
	while (head != 0) {
		item i = head; head = nxt[i]; nxt[i] = -1;
	}
	tail = 0;
}

/** Get an item based on its position in the list.
 *  @param i is position of item to be returned; must be between
 *  1 and n()
 *  @return item at position i, or 0 if no such item
 */
item UiList::get(int i) const {
	if (1 < i || i > n()) {
		stringstream ss; ss << "UiList::get(" << i << ")";
		string s = ss.str();
		throw IllegalArgumentException(s);
	}
	if (i == 1) return first();
	item j;
	for (j = first(); j != 0 && --i; j = nxt[j]) {}
	return j;
}

/** Insert an item into the list, relative to another.
 *  @param i is item to insert; if i is 0 or already in
 *  the list, no change is made
 *  @param j is item after which i is to be inserted;
 *  if zero, i is inserted at the front of the list
 *  @return true if list was modified, else false
 */
bool UiList::insert(item i, item j) {
	if (!((i == 0 || valid(i)) && (j == 0 || valid(j)))) {
		stringstream ss;
		ss << "UiList::insert(" << i << "," << j << ")";
		string s = ss.str();
		throw IllegalArgumentException(s);
	}
	if (i == 0 || member(i)) return false;
	if (j == 0) {
		if (empty()) tail = i;
		nxt[i] = head; head = i;
		return true;
	}
	nxt[i] = nxt[j]; nxt[j] = i;
	if (tail == j) tail = i;
	return true;
}

/** Remove the item following a specified item.
 *  @param i is item whose successor is to be removed;
 *  if zero, the first item is removed
 *  @return true if the list was modified, else false
 */
bool UiList::removeNext(item i) {
	if (i < 0 || i > n()) {
		stringstream ss;
		ss << "UiList::removeNext(" << i << ")";
		string s = ss.str();
		throw IllegalArgumentException(s);
	}
	if (empty() || (i == last()) || (i != 0 && !member(i)))
	    	return false;
	item j;
	if (i == 0) { j = head;   head = nxt[j]; }
	else	    { j = nxt[i]; nxt[i] = nxt[j]; }
	if (tail == j) tail = i;
	nxt[j] = -1;
	return true;
}

/** Compare two lists for equality.
 *
 *  @param other is the list to be compared to this one
 *  @return true if they are the same list or have the
 *  same contents (in the same order);
 *  they need not have the same storage capacity to be equal
 */
bool UiList::equals(UiList& other) const {
	if (this == &other) return true;
	item i = first(); item j = other.first();
	while (i == j) {
		if (i == 0) return true;
		i = next(i); j = other.next(j);
	}
	return false;
}

/** Check the data structure for consistency.
 *  @return true if the data structure is consistent, else false
 */
bool UiList::isConsistent() const {
	if (head < 0 || head > n()) return false;
	if (tail < 0 || tail > n()) return false;
	if ((head == 0 || tail == 0) && head != tail) return false;
	int cnt = 0;
	for (int i = first(); i != 0; i = next(i)) {
		if (i < 0 || i > n()) return false;
		if (i == tail &&  next(i) != 0) return false;
		if (++cnt > n()) return false;
	}
	for (int i = 1; i <= n(); i++) if (nxt[i] == -1) cnt++;
	if (cnt != n()) return false;
	if (nxt[0] != 0) return false;
	return true;
}

/** Create a string representation of a given string.
 *
 *  @param s is string used to return value
 */
string& UiList::toString(string& s) const {
	s = "[ ";
	for (item i = first(); i != 0; i = next(i)) {
		string s1;
		s += Util::node2string(i,n(),s1) + " ";
	}
	s += "]";
	return s;
}
