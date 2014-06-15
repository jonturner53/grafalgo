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
 *  @param n1 defines the set of integers 1..n on which this object is defined
 */
ClistSet::ClistSet(int n1) : Adt(n1) { makeSpace(n()); }

/** Destructor for ClistSet */
ClistSet::~ClistSet() { freeSpace(); }

/** Allocate and initialize space for ClistSet.
 *  @param size is number of index values to provide space for
 */
void ClistSet::makeSpace(int size) {
	try { node = new lnode[size+1]; } catch (std::bad_alloc e) {
		stringstream ss;
		ss << "ClistSet::makeSpace: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by ClistSet. */
void ClistSet::freeSpace() { delete [] node; }

/** Resize a ClistSet object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void ClistSet::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "ClistSet::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
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
		node[i].next = node[i].prev = i;
	}
}

/** Copy into ClistSet from source. */
void ClistSet::copyFrom(const ClistSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = 0; x <= source.n(); x++) {
		node[x].next = source.suc(x);
		node[x].prev = source.pred(x);
	}
}

/** Remove an index from its list.
 *  This method turns the index into a singleton list.
 *  @param i is an index
 */
void ClistSet::remove(index i) {
	assert(0 <= i && i <= n());
	node[node[i].prev].next = node[i].next;
	node[node[i].next].prev = node[i].prev;
	node[i].next = node[i].prev = i;
}


/** Join two lists together.
 *  @param i is an index on some list
 *  @param j is an index on some other list
 *  Note: the method will corrupt the data structure if
 *  i and j already belong to the same list; it's the caller's
 *  responsiblity to ensure this doesn't happen
 */
void ClistSet::join(index i, index j) {
	assert(0 <= i && i <= n() && 0 <= j && j <= n());
	if (i == 0 || j == 0) return;
	node[node[i].next].prev = node[j].prev;
	node[node[j].prev].next = node[i].next;
	node[i].next = j; node[j].prev = i;
}

/** Produce a string representation of the object.
 *  @return the string
 */
string ClistSet::toString() const {
	index i, j; string s;
	int *mark = new int[n()+1];
	s = "{";
	int cnt = 0;
	for (i = 1; i <= n(); i++) mark[i] = 0;
	for (i = 1; i <= n(); i++) {
		if (mark[i]) continue; 
		mark[i] = 1;
		if (node[i].next == i) continue;
		if (++cnt > 1) s += ", ";
		s += "[";
		s += Adt::item2string(i);
		for (j = node[i].next; j != i; j = node[j].next) {
			mark[j] = 1;
			s += " ";
			s += Adt::item2string(j);
		}
		s += "]";
	}
	s += "}";
	delete [] mark;
	return s;
}

} // ends namespace
