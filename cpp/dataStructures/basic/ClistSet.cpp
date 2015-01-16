/** @file ClistSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "ClistSet.h"

namespace grafalgo {

/** Constructor for ClistSet. 
 *  @param n defines the set of integers 1..n on which this object is defined
 */
ClistSet::ClistSet(int n) : Adt(n) { makeSpace(); clear(); }

/** Destructor for ClistSet */
ClistSet::~ClistSet() { freeSpace(); }

/** Allocate and initialize space for ClistSet.
 *  @param size is number of index values to provide space for
 */
void ClistSet::makeSpace() { node = new lnode[n()+1]; }

/** Free dynamic storage used by ClistSet. */
void ClistSet::freeSpace() { delete [] node; }

/** Resize a ClistSet object.
 *  The old value is discarded.
 *  @param n is the size of the resized object.
 */
void ClistSet::resize(int n) {
	freeSpace(); Adt::resize(n); makeSpace(); clear();
}

/** Expand the space available for this ClistSet.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void ClistSet::expand(int size) {
	if (size <= n()) return;
	ClistSet old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Clear the data structure, moving all index values into single node lists.
 */
void ClistSet::clear() {
	for (index i = 0; i <= n(); i++) {
		node[i].succ = node[i].pred = i;
	}
}

/** Copy into ClistSet from source. */
void ClistSet::copyFrom(const ClistSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = 1; x <= source.n(); x++) {
		node[x].succ = source.next(x);
		node[x].pred = source.prev(x);
	}
}

/** Remove an index from its list.
 *  This method turns the index into a singleton list.
 *  @param i is an index
 */
void ClistSet::remove(index i) {
	assert(valid(i));
	node[node[i].pred].succ = node[i].succ;
	node[node[i].succ].pred = node[i].pred;
	node[i].succ = node[i].pred = i;
}


/** Join two lists together.
 *  @param i is an index on some list
 *  @param j is an index on some other list
 *  Note: the method will corrupt the data structure if
 *  i and j already belong to the same list; it's the caller's
 *  responsiblity to ensure this doesn't happen
 */
void ClistSet::join(index i, index j) {
	if (i == 0 || j == 0) return;
	assert(valid(i) && valid(j));
	node[node[i].succ].pred = node[j].pred;
	node[node[j].pred].succ = node[i].succ;
	node[i].succ = j; node[j].pred = i;
}

/** Produce a string representation of the object.
 *  @return the string
 */
string ClistSet::toString() const {
	index i, j; string s;
	bool mark[n()+1];
	s = "{";
	int cnt = 0;
	for (i = 1; i <= n(); i++) mark[i] = false;
	for (i = 1; i <= n(); i++) {
		if (mark[i]) continue; 
		mark[i] = true;
		if (node[i].succ == i) continue;
		if (++cnt > 1) s += ", ";
		s += "[";
		s += Adt::index2string(i);
		for (j = node[i].succ; j != i; j = node[j].succ) {
			mark[j] = true;
			s += " ";
			s += Adt::index2string(j);
		}
		s += "]";
	}
	s += "}";
	return s;
}

} // ends namespace
