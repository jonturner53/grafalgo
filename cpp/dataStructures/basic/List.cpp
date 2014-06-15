/** @file List.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "List.h"

namespace grafalgo {

/** Create a list with space for index values in 1..nn1 */
List::List(int nn1) : Adt(nn1), len(0) {
	try { makeSpace(n()); } catch(OutOfSpaceException e) {
		string s; s = "List::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Destructor for List. */
List::~List() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
void List::makeSpace(int size) {
	try { nxt = new index[size+1]; } catch (std::bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	for (index i = 1; i <= size; i++) nxt[i] = -1;
	nxt[0] = 0; head = tail = 0;
	nn = size; len = 0;
}

/** Free dynamic storage used by list. */
void List::freeSpace() { delete [] nxt; }

/** Copy into list from source. */
void List::copyFrom(const List& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = source.first(); x != 0; x = source.next(x))
		addLast(x);
}

/** Resize a List object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void List::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "List::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this List.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void List::expand(int size) {
	if (size <= n()) return;
	List old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Remove all elements from list. */
void List::clear() { while (!empty()) removeFirst(); }

/** Get an index based on its position in the list.
 *  @param i is position of index to be returned; must be between
 *  1 and n()
 *  @return index at position i, or 0 if no such index
 */
index List::get(position i) const {
	if (i < 1 || i > length()) return 0;
	if (i == 1) return first();
	index j;
	for (j = first(); j != 0 && --i; j = nxt[j]) {}
	return j;
}

/** Insert an index into the list, relative to another.
 *  @param i is index to insert; if i is 0 or already in
 *  the list, no change is made
 *  @param j is index after which i is to be inserted;
 *  if zero, i is inserted at the front of the list
 *  @return true if list was modified, else false
 */
bool List::insert(index i, index j) {
	if (!((i == 0 || valid(i)) && (j == 0 || valid(j)))) {
		stringstream ss;
		ss << "List::insert(" << i << "," << j << ")";
		string s = ss.str();
		throw IllegalArgumentException(s);
	}
	if (i == 0 || member(i)) return false;
	len++;
	if (j == 0) {
		if (empty()) tail = i;
		nxt[i] = head; head = i;
		return true;
	}
	nxt[i] = nxt[j]; nxt[j] = i;
	if (tail == j) tail = i;
	return true;
}

/** Remove the index following a specified index.
 *  @param i is index whose successor is to be removed;
 *  if zero, the first index is removed
 *  @return true if the list was modified, else false
 */
bool List::removeNext(index i) {
	if (i < 0 || i > n()) {
		stringstream ss;
		ss << "List::removeNext(" << i << ")";
		string s = ss.str();
		throw IllegalArgumentException(s);
	}
	if (empty() || (i == last()) || (i != 0 && !member(i)))
	    	return false;
	index j;
	if (i == 0) { j = head;   head = nxt[j]; }
	else	    { j = nxt[i]; nxt[i] = nxt[j]; }
	if (tail == j) tail = i;
	nxt[j] = -1;
	len--;
	return true;
}

/** Compare two lists for equality.
 *
 *  @param other is the list to be compared to this one
 *  @return true if they are the same list or have the
 *  same contents (in the same order);
 *  they need not have the same storage capacity to be equal
 */
bool List::equals(List& other) const {
	if (this == &other) return true;
	if (this->length() != other.length()) return false;
	index i = first(); index j = other.first();
	while (i == j) {
		if (i == 0) return true;
		i = next(i); j = other.next(j);
	}
	return false;
}

/** Check the data structure for consistency.
 *  @return true if the data structure is consistent, else false
 */
bool List::isConsistent() const {
	if (head < 0 || head > n()) return false;
	if (tail < 0 || tail > n()) return false;
	if ((head == 0 || tail == 0) && head != tail) return false;
	int cnt = 0;
	for (int i = first(); i != 0; i = next(i)) {
		if (i < 0 || i > n()) return false;
		if (i == tail &&  next(i) != 0) return false;
		if (++cnt > length()) return false;
	}
	if (cnt != length()) return false;
	for (int i = 1; i <= n(); i++) if (nxt[i] == -1) cnt++;
	if (cnt != n()) return false;
	if (nxt[0] != 0) return false;
	return true;
}

/** Create a string representation of a given string.
 *  @return the string
 */
string List::toString() const {
	string s = "[";
	bool isFirst = true;
	for (index i = first(); i != 0; i = next(i)) {
		if (isFirst) isFirst = false;
		else s += " ";
		s += item2string(i);
	}
	s += "]";
	return s;
}

istream& operator>>(istream& in, List& lst) {
	lst.clear();
	if (!Util::verify(in,'[')) return in;
	while (true) {
		Util::skipSpace(in);
		char c = in.peek();
		if (!in.good()) {
			string s = "List::operator>>: misformatted list";
			throw InputException(s);
		}
		index x;
		if (c == ']') {
			c = in.get(); return in;
		} else if (isalpha(c)) {
			x = (c - 'a') + 1; c = in.get();
		} else if (isdigit(c)) {
			in >> x;
		} else {
			string s = "List::operator>>: unexpected input "
				   "character "; s += c;
			throw InputException(s);
		}
		if (lst.n() < x) lst.expand(max(x,2*lst.n()));
		if (lst.member(x)) {
			string s = "List::operator>>: repeated element in list";
			throw InputException(s);
		}
		lst.addLast(x);
	}
}

} // ending namespace
