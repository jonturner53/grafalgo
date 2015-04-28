/** @file List.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "List.h"

namespace grafalgo {

/** Default constructor for List objects.
 *  Creates list with index range of 1..10, with autoExpand=true.
 */
List::List() : Adt(10), autoExpand(true) { makeSpace(); init(); }

/** Constructor for List objects with explicit index range.
 *  @param n specifies the maximum index
 */
List::List(int n) : Adt(n), autoExpand(false) { makeSpace(); init(); }

/** Copy constructor.
 *  @param src is a List whose contents are copied to this List.
 */
List::List(const List& src) : Adt(src.n()) { makeSpace(); copyContents(src); }

/** Move constructor.
 *  @param src is a List whose contents may be re-used
 */
List::List(List&& src) : Adt(src.n()) {
	freeSpace();
	head = src.head; tail = src.tail; len = src.len; succ = src.succ;
	autoExpand = src.autoExpand;
	src.succ = nullptr;
}

/** Destructor for List. */
List::~List() { freeSpace(); }

/** Allocate space for list.
 *  Amount of space allocated is determined by value of n().
 */
void List::makeSpace() { succ = new index[n()+1]; }

/** Free dynamic storage used by list. */
void List::freeSpace() { delete [] succ; }

/** Initialize a list.  */
void List::init() {
	succ[0] = 0; head = tail = 0; len = 0;
	std::fill(succ+1, succ+n()+1, -1);
}

/** Copy the contents of a list.
  * Requires that target have at least as much space as src.
  */
void List::copyContents(const List& src) {
	head = src.head; tail = src.tail; len = src.len;
	autoExpand = src.autoExpand;
	std::copy(src.succ, src.succ+src.n()+1, succ);
	std::fill(succ+src.n()+1, succ+n()+1, -1);
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
	index *old_succ = succ; int old_n = n();
	Adt::expand(size); makeSpace();
	std::copy(old_succ, old_succ+old_n+1, succ);
	std::fill(succ+old_n+1, succ+n()+1, -1);
	delete [] old_succ;
}

/** Assignment operator (copy).
 *  @param src is a reference to a list to be copied to this
 *  @return true if the two lists are equal
 */
List& List::operator=(const List& src) {
	if (this == &src) return *this;
	if (src.n() > n()) resize(src.n());
	copyContents(src);
	return *this;
}

/** Assignment operator (move).
 *  @param src is a reference to a list to be moved to this
 *  @return true if the two lists are equal
 */
List& List::operator=(List&& src) {
	if (this == &src) return *this;
	freeSpace(); Adt::resize(src.n());
	head = src.head; tail = src.tail; len = src.len;
	autoExpand = src.autoExpand;
	succ = src.succ; src.succ = nullptr;
	return *this;
}

/** Equality relation.
 *  @param src is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
bool List::operator==(const List& src) {
	if (this == &src) return true;
	if (len != src.len) return false;
	if (first() != src.first()) return false;
	for (index x = first(); x != 0; x = next(x)) {
		if (next(x) != src.next(x)) return false;
	}
	return true;
}

/** Get an index based on its position in the list.
 *  @param i is position of index to be returned; must be between
 *  1 and n()
 *  @return index at position i, or 0 if no such index
 */
index List::get(position i) const {
	assert(valid(i));
	if (i == 1) return first();
	index j;
	for (j = first(); j != 0 && --i; j = succ[j]) {}
	return j;
}

/** Insert an index into the list, relative to another.
 *  @param i is index to insert
 *  @param j is index in the list after which i is to be inserted;
 *  if zero, i is inserted at the front of the list
 */
void List::insert(index i, index j) {
	if (i > n() && autoExpand) expand(max(i,2*n()));
	assert((valid(i) && !member(i)) && (j == 0 || member(j)));
	len++;
	if (j == 0) {
		if (empty()) tail = i;
		succ[i] = head; head = i;
		return;
	}
	succ[i] = succ[j]; succ[j] = i;
	if (tail == j) tail = i;
}

/** Remove the index following a specified index.
 *  @param i is index whose successor is to be removed;
 *  if zero, the first index is removed
 *  @return true if the list was modified, else false
 */
void List::removeNext(index i) {
if (!(i == 0 || (member(i) && next(i) != 0))) {
cerr << "removeNext(" << i << ") from " << *this << endl;
}
	assert(i == 0 || (member(i) && next(i) != 0));
	index j;
	if (i == 0) { j = head;   head = succ[j]; }
	else	    { j = succ[i]; succ[i] = succ[j]; }
	if (tail == j) tail = i;
	succ[j] = -1;
	len--;
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
	for (int i = 1; i <= n(); i++) if (succ[i] == -1) cnt++;
	if (cnt != n()) return false;
	if (succ[0] != 0) return false;
	return true;
}

/** Create a string representation of the list object.
 *  @return the string
 */
string List::toString() const {
	string s = "[";
	for (index i = first(); i != 0; i = next(i)) {
		if (i != first()) s += " ";
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
		if (!in.good())
			Util::fatal("List::operator>>: misformatted list");
		index x = 0;
		if (c == ']') {
			c = in.get(); return in;
		} else if (isalpha(c)) {
			x = (c - 'a') + 1; c = in.get();
		} else if (isdigit(c)) {
			in >> x;
		} else {
			string s = "List::operator>>: unexpected input "
				   "character "; s += c;
			Util::fatal(s);
		}
		if (lst.n() < x) lst.expand(x);
		if (lst.member(x))
			Util::fatal("List::operator>>: repeated index");
		lst.addLast(x);
	}
}

} // ending namespace
