/** @file Clist.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Clist.h"

namespace grafalgo {

/** Constructor for Clist. 
 *  @param n1 defines the set of integers 1..n on which this object is defined
 */
Clist::Clist(int n1) : Adt(n1) { makeSpace(n()); }

/** Destructor for Clist */
Clist::~Clist() { freeSpace(); }

/** Allocate and initialize space for Clist.
 *  @param size is number of index values to provide space for
 */
void Clist::makeSpace(int size) {
	try { node = new lnode[size+1]; } catch (std::bad_alloc e) {
		stringstream ss;
		ss << "Clist::makeSpace: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by Clist. */
void Clist::freeSpace() { delete [] node; }

/** Resize a Clist object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void Clist::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "Clist::resize:" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Clist.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Clist::expand(int size) {
	if (size <= n()) return;
	Clist old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Clear the data structure, moving all index values into single node lists.
 */
void Clist::clear() {
	for (index i = 0; i <= n(); i++) {
		node[i].next = node[i].prev = i;
	}
}

/** Copy into Clist from source. */
void Clist::copyFrom(const Clist& source) {
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
void Clist::remove(index i) {
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
void Clist::join(index i, index j) {
	assert(0 <= i && i <= n() && 0 <= j && j <= n());
	if (i == 0 || j == 0) return;
	node[node[i].next].prev = node[j].prev;
	node[node[j].prev].next = node[i].next;
	node[i].next = j; node[j].prev = i;
}

/** Produce a string representation of the object.
 *  @param s is a string in which the result will be returned
 *  @return a reference to s
 */
string& Clist::toString(string& s) const {
	index i, j; string s1;
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
		s += Adt::item2string(i,s1);
		for (j = node[i].next; j != i; j = node[j].next) {
			mark[j] = 1;
			s += " ";
			s += Adt::item2string(j,s1);
		}
		s += "]";
	}
	s += "}";
	delete [] mark;
	return s;
}

} // ends namespace
