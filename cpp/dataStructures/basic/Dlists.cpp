/** @file Dlists.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Dlists.h"

namespace grafalgo {

/** Constructor for Dlists. 
 *  @param n defines the set of integers 1..n on which this object is defined
 */
Dlists::Dlists(int n) : Adt(n) { makeSpace(); clear(); }

/** Default constructor for Dlists. 
 */
Dlists::Dlists() : Adt(10) { makeSpace(); clear(); }

/** Destructor for Dlists */
Dlists::~Dlists() { freeSpace(); }

/** Allocate and initialize space for Dlists.
 *  @param size is number of index values to provide space for
 */
void Dlists::makeSpace() { node = new lnode[n()+1]; }

/** Free dynamic storage used by Dlists. */
void Dlists::freeSpace() { delete [] node; }

/** Resize a Dlists object.
 *  The old value is discarded.
 *  @param n is the size of the resized object.
 */
void Dlists::resize(int n) {
	freeSpace(); Adt::resize(n); makeSpace(); clear();
}

/** Expand the space available for this Dlists.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Dlists::expand(int size) {
	if (size <= n()) return;
	Dlists old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Clear the data structure, moving all index values into single node lists.
 */
void Dlists::clear() {
	for (index i = 0; i <= n(); i++) {
		node[i].succ = 0; node[i].pred = i;
	}
}

/** Copy into Dlists from source. */
void Dlists::copyFrom(const Dlists& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = 1; x <= source.n(); x++) {
		node[x].succ = source.node[x].succ;
		node[x].pred = source.node[x].pred;
	}
}

/** Find the identifier of a list.
 *  @param i is the index of some item
 *  @return the id of the list
 */
index Dlists::findList(index i) const {
	assert(valid(i));
	while (true) {
		index p = node[i].pred;
		if (node[p].succ == 0) return i;
		i = p;
	}
}

/** Remove an index from its list.
 *  This method turns the removed index into a singleton list.
 *  @param i is an index of an item in a set
 *  @param j is an index of an id
 *  @return the id of the modified set, or 0 if i is the only item in the set
 */
index Dlists::remove(index i, index j) {
	assert(valid(i) && valid(j) && node[node[j].pred].succ == 0);
	j = (j != i ? j : (singleton(i) ? 0 : node[i].succ));
	node[node[i].pred].succ = node[i].succ;
	node[node[i].succ].pred = node[i].pred;
	if (node[j].pred ==i) node[j].pred = node[i].pred;
	node[node[j].pred].succ = 0;
	node[i].succ = 0; node[i].pred = i;
	return j;
}

/** Join two lists together.
 *  @param i is the identifier of some list
 *  @param j is the identifier of a different list
 *  @return the id of the resulting list; if i is non-zero,
 *  the returned id is i
 */
index Dlists::join(index i, index j) {
	if (i == 0 || i == j) return j;
	if (j == 0) return i;
	assert(valid(i) && valid(j) && node[node[i].pred].succ == 0
				    && node[node[j].pred].succ == 0);
	index pi = node[i].pred; index pj = node[j].pred;
	node[pi].succ = j; node[j].pred = pi; node[i].pred = pj;
	return i;
}

/** Produce a string representation of the object.
 *  @return the string
 */
string Dlists::toString() const {
	string s = "{";
	int cnt = 0;
	for (index i = 1; i <= n(); i++) {
		if (node[node[i].pred].succ != 0) continue; 
		if (singleton(i)) continue;
		if (++cnt > 1) s += ", ";
		s += "[";
		for (index j = first(i); j != 0; j = next(j)) {
			if (j != first(i)) s += " ";
			s += Adt::index2string(j);
		}
		s += "]";
	}
	s += "}";
	return s;
}

} // ends namespace
