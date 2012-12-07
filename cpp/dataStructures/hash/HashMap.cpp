/** @file HashMap.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "HashMap.h"

namespace grafalgo {

/** Constructor for HashMap, allocates space and initializes table.
 *  N1 is the limit on the range of values; it must be less than 2^20.
 */
HashMap::HashMap(int n1) : Adt(n1) { makeSpace(n()); };
	
/** Destructor for HashMap. */
HashMap::~HashMap() { freeSpace(); }

/** Allocate and initialize space for map.
 *  @param size is number of index values to provide space for
 */
void HashMap::makeSpace(int size) {
	try {
		values = new int[size+1];
		ht = new HashTbl(size); kvx = new SetPair(size);
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "HashMap::makeSpace: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size;
}

/** Free dynamic storage used by map. */
void HashMap::freeSpace() { delete [] values; delete ht; delete kvx; }

/** Resize a HashMap object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void HashMap::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "HashMap::resize::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this map.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void HashMap::expand(int size) {
	if (size <= n()) return;
	HashMap old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Clear the hashtable contents. */
void HashMap::clear() {
	while (firstPair() != 0) remove(key(firstPair()));
}

/** Copy into map from src. */
void HashMap::copyFrom(const HashMap& src) {
	if (&src == this) return;
	if (src.n() > n()) resize(src.n());
	else clear();
        for (index x = src.firstPair(); x != 0; x = src.nextPair(x))
		put(src.key(x), src.val(x));
}

// Construct string listing the key,value pairs in the map
string& HashMap::toString(string& s) const {
	stringstream ss; ss << "{";
	bool isFirst = true;
        for (int kvi = kvx->firstIn(); kvi != 0; kvi = kvx->nextIn(kvi)) {
		if (isFirst) isFirst = false;
		else ss << " ";
                ss << "(" << key(kvi) << "," << val(kvi) << ")";
        }
	ss << "}"; s = ss.str(); return s;
}

} // ends namespace
