/** @file HashSet.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "HashSet.h"

namespace grafalgo {

/** Constructor for HashSet, allocates space and initializes table.
 *  N1 is the limit on the size of the set; it must be less than 2^20.
 */
HashSet::HashSet(int n1) : Adt(n1) { makeSpace(n()); };
	
/** Destructor for HashSet. */
HashSet::~HashSet() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
void HashSet::makeSpace(int size) {
	try {
		ht = new HashTbl(n()); elements = new SetPair(n());
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "HashSet::makeSpace: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
}

/** Free dynamic storage used by list. */
void HashSet::freeSpace() { delete ht; delete elements; }

/** Clear the set contents. */
void HashSet::clear() {
	while (elements->firstIn() != 0) remove(elements->firstIn());
}

/** Resize a HashSet object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void HashSet::resize(int size) {
	freeSpace();
	Adt::resize(size);
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "HashSet::resize:" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this HashSet.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void HashSet::expand(int size) {
	if (size <= n()) return;
	HashSet old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Copy into list from source. */
void HashSet::copyFrom(const HashSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = source.first(); x != 0; x = source.next(x))
		insert(x);
}

/** Construct string listing the elements in the set.
 *  @param s is a reference to a string in which the result is returned
 */
string& HashSet::toString(string& s) const {
	s = "{ ";
	for (index x = elements->firstOut(); x!=0; x = elements->nextOut(x)) {
		string s1; s += Adt::item2string(x,s1) + " ";
	}
	s += "}";
	return s;
}

} // ends namespace
