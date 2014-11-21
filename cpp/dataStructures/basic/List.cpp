/** @file List.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "List.h"

namespace grafalgo {

/** Constructor for list.
 *  @param nn1 specifies the maximum index
 */
List::List(int nn1, bool autoX) : Adt(nn1), autoExpand(autoX) {
	makeSpace(); init();
}

/** Copy constructor.
 *  @param src is a List whose contents are copied to this List.
 */
List::List(const List& src) : Adt(src.n()) {
	makeSpace(); copyContents(src); }

/** Move constructor.
 *  @param src is a List whose contents may be re-used
 */
List::List(List&& src) : Adt(src.n()) {
	freeSpace();
	head = src.head; tail = src.tail; len = src.len; nxt = src.nxt;
	autoExpand = src.autoExpand;
	src.nxt = nullptr;
}

/** Destructor for List. */
List::~List() { freeSpace(); }

/** Allocate space for list.
 *  Amount of space allocated is determined by value of n().
 */
void List::makeSpace() {
	try { nxt = new index[n()+1]; } catch (std::bad_alloc e) {
		string s = "List: insufficient space for "
		   	   + to_string(n()) + " list elements";
		throw OutOfSpaceException(s);
	}
}

/** Free dynamic storage used by list. */
void List::freeSpace() { delete [] nxt; }

/** Initialize a list.  */
void List::init() {
	nxt[0] = 0; head = tail = 0; len = 0;
	std::fill(nxt+1, nxt+n()+1, -1);
}

/** Copy the contents of a list.
  * Requires that target have at least as much space as src.
  */
void List::copyContents(const List& src) {
	head = src.head; tail = src.tail; len = src.len;
	autoExpand = src.autoExpand;
	std::copy(src.nxt, src.nxt+src.n()+1, nxt);
	std::fill(nxt+src.n()+1, nxt+n()+1, -1);
}

/** Resize a List object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void List::resize(int size) {
	freeSpace(); Adt::resize(size); makeSpace(); init();
}

/** Expand the space available for this List.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void List::expand(int size) {
	if (size <= n()) return;
	index *old_nxt = nxt; int old_n = n();
	Adt::expand(size); makeSpace();
	std::copy(old_nxt, old_nxt+old_n+1, nxt);
	std::fill(nxt+old_n+1, nxt+n()+1, -1);
	delete [] old_nxt;
}

/** Assignment operator (copy).
 *  @param other is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
List& List::operator=(const List& src) {
	if (this == &src) return *this;
	if (src.n() > n()) resize(src.n());
	copyContents(src);
	return *this;
}

/** Assignment operator (move).
 *  @param other is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
List& List::operator=(List&& src) {
	if (this == &src) return *this;
	freeSpace(); Adt::resize(src.n());
	head = src.head; tail = src.tail; len = src.len;
	autoExpand = src.autoExpand;
	nxt = src.nxt; src.nxt = nullptr;
	return *this;
}

/** Equality relation.
 *  @param other is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
bool List::operator==(const List& other) {
	if (this == &other) return true;
	if (len != other.len) return false;
	index x = first(); index y = other.first();
	while (x != 0) {
		if (x != y) return false;
		x = next(x); y = other.next(y);
	}
	return true;
}

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
	if ((i < 0 || (i > n() && !autoExpand)) || (j < 0 || j > n())) {
		string s = "List::insert(" + to_string(i) + ","
			   + to_string(j) + ")\n";
		throw IllegalArgumentException(s);
	}
	if (i == 0 || member(i)) return false;
	if (i > n() && autoExpand) {
		expand(max(i,2*n()));
	}
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
		string s = "List::removeNext(" + to_string(i) + ") ";
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
	// shrink empty list back to default size
	if (len == 0 && autoExpand) resize(10);
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

/** Remove all elements from list. */
void List::clear() { while (!empty()) removeFirst(); }

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
		s += index2string(i);
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
		if (lst.n() < x) lst.expand(x);
		if (lst.member(x)) {
			string s = "List::operator>>: repeated element in list";
			throw InputException(s);
		}
		lst.addLast(x);
	}
}

} // ending namespace
