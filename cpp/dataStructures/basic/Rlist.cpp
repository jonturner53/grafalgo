/** @file Rlist.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Rlist.h"

namespace grafalgo {

/** Constructor for Rlist class.
 *  @param nn defines the set of integers 1..nn on which the lists are defined.
 */
Rlist::Rlist(int nn) : Adt(nn) { makeSpace(n()); }

/** Destructor for Rlist class. */
Rlist::~Rlist() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
void Rlist::makeSpace(int size) {
	try {
		node = new ListNode[size+1]; canon = new bool[size+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "Rlist::makeSpace: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by list. */
void Rlist::freeSpace() { delete [] node; }

/** Resize a Rlist object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void Rlist::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "Rlist::resize:" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Rlist.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Rlist::expand(int size) {
	if (size <= n()) return;
	Rlist old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Return all elements into singleton lists. */
void Rlist::clear() {
	for (index x = 0; x <= n(); x++) {
		node[x].p1 = node[x].p2 = x; canon[x] = true;
	}
}

/** Copy into list from source. */
void Rlist::copyFrom(const Rlist& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = 1; x <= source.n(); x++) {
		node[x].p1 = source.node[x].p1;
		node[x].p2 = source.node[x].p2;
		canon[x] = source.canon[x];
	}
}

/** Remove first item from a list.
 *  Has no effect on a singleton list, since all index values must
 *  be on some list.
 *  @param t is the index of the canonical element of some list
 *  @return the last index of the canonical element of the modified list
 */
index Rlist::pop(index t) {
	index h = first(t);
	if (h == t) return h;
	index nuHead = suc(h,t);
	if (node[h].p2 == t)	node[t].p1 = node[h].p1;
	else 			node[t].p1 = node[h].p2;
	if (node[nuHead].p1 == h) node[nuHead].p1 = t;
	else			  node[nuHead].p2 = t;
	node[h].p1 = node[h].p2 = h;
	canon[h] = true;
	return t;
}

/** Combine two lists.
 *  @param t1 is the index of the canonical item on some list
 *  @param t2 is the index of the canonical item on a second list
 *  @return the index of the canonical item of the list formed by appending
 *  the second list to the end of the first
 */
index Rlist::join(index t1, index t2) {
	if (t1 == 0) return t2;
	else if (t2 == 0 || t2 == t1) return t1;

	index h1 = node[t1].p1; index h2 = node[t2].p1;
	node[t1].p1 = h2; node[t2].p1 = h1;
	if (t1 == node[h1].p2)	node[h1].p2 = t2;
	else                	node[h1].p1 = t2;
	if (t2 == node[h2].p2)	node[h2].p2 = t1;
	else                	node[h2].p1 = t1;

	canon[t1] = false;
	return t2;
}

/** Reverse a list.
 *  @param t is the index of the canonical item on some list
 *  @return the index of the canonical item on the list obtained by
 *  reversing the original list.
 */
index Rlist::reverse(index t) {
	index h = first(t);
	if (t == 0 || h == t) return t;
	if (t == node[h].p2) node[h].p2 = node[h].p1;
	node[h].p1 = t;
	canon[h] = true; canon[t] = false;
	return h;
}

/** Build a string representation of the set of lists.
 *  All lists with at least two items are printed, one per line.
 *  @param s is the string in which the result is returned
 *  @return a reference to s
 */
string& Rlist::toString(string& s) const {
	s = "";
	for (index x = 1; x <= n(); x++) {
		if (canon[x] && first(x) != x) {
			string s1; s += toString(x,s1) + "\n";
		}
	}
	return s;
}

/** Build a string representation of a list.
 *  @param t is the index of the canonical item of some list
 *  @param s is the string in which the result is returned
 *  @return a reference to s
 */
string& Rlist::toString(index t, string& s) const {
	index h = first(t);
	s = "[ "; string s1;
	if (t == 0) s += "-";
	else if (h == t) s += Adt::item2string(h,s1) + " ";
	else {
		index x = h; index y = t;
		do {
			s += item2string(x,s1) + " ";
			advance(x,y);
		} while (x != h);
	}
	s += "]";
	return s;
}

} // ends namespace
