/** @file Djsets_rl.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Djsets_rl.h"

namespace grafalgo {

/** Constructor for Djsets_rl class.
 *  @param n defines the index set for the new object
 */
Djsets_rl::Djsets_rl(int n) : Adt(n) { makeSpace(); clear(); }

/** Destructor for Djsets_rl class. */
Djsets_rl::~Djsets_rl() { freeSpace(); }

/** Allocate space for object. */
void Djsets_rl::makeSpace() {
	node = new ListNode[n()+1]; canon = new bool[n()+1];
}

/** Free dynamic storage used by list. */
void Djsets_rl::freeSpace() { delete [] node; }

/** Resize a Djsets_rl object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void Djsets_rl::resize(int size) {
	freeSpace(); makeSpace(); clear();
}

/** Expand the space available for this Djsets_rl.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Djsets_rl::expand(int size) {
	if (size <= n()) return;
	Djsets_rl old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Return all elements into singleton lists. */
void Djsets_rl::clear() {
	for (index x = 0; x <= n(); x++) {
		node[x].p1 = node[x].p2 = x; canon[x] = true;
	}
}

/** Copy into list from source. */
void Djsets_rl::copyFrom(const Djsets_rl& source) {
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
 *  @return the index of the canonical element of the modified list
 */
index Djsets_rl::pop(index t) {
	assert(valid(t));
	index h = first(t);
	if (h == t) return h;
	index nuHead = next(h,t);
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
index Djsets_rl::join(index t1, index t2) {
	assert((t1 == 0 || valid(t1)) && (t2 == 0 || valid(t2)));
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
index Djsets_rl::reverse(index t) {
	if (t == 0) return t;
	assert(valid(t));
	index h = first(t);
	if (h == t) return t;
	if (t == node[h].p2) node[h].p2 = node[h].p1;
	node[h].p1 = t;
	canon[h] = true; canon[t] = false;
	return h;
}

/** Build a string representation of the set of lists.
 *  All lists with at least two items are printed, one per line.
 *  @return the string
 */
string Djsets_rl::toString() const {
	string s = "";
	for (index x = 1; x <= n(); x++) {
		if (canon[x] && first(x) != x) {
			s += toString(x) + "\n";
		}
	}
	return s;
}

/** Build a string representation of a list.
 *  @param t is the index of the canonical item of some list
 *  @return the string
 */
string Djsets_rl::toString(index t) const {
	assert(valid(t));
	index h = first(t);
	string s = "[ ";
	if (t == 0) s += "-";
	else if (h == t) s += Adt::index2string(h) + " ";
	else {
		index x = h; index y = t;
		do {
			s += index2string(x) + " ";
			advance(x,y);
		} while (x != h);
	}
	s += "]";
	return s;
}

} // ends namespace
