/** @file IdMap.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "IdMap.h"

namespace grafalgo {

/** Constructor for IdMap, allocates space and initializes table.
 *  N1 is the limit on the range of values; it must be less than 2^20.
 */
IdMap::IdMap(int n1) : Adt(n1) { makeSpace(n()); };
	
/** Destructor for IdMap. */
IdMap::~IdMap() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
void IdMap::makeSpace(int size) {
	try {
		ht = new HashTbl(size);
		ids = new SetPair(size);
	} catch (std::bad_alloc e) {
		string s = "IdMap::makeSpace: insufficient space for "
		   	 + to_string(size) + "index values";
		throw OutOfSpaceException(s);
	}
	nn = size;
}

/** Free dynamic storage used by list. */
void IdMap::freeSpace() { delete ht; delete ids; }

/** Resize a IdMap object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void IdMap::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "IdMap::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this IdMap.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void IdMap::expand(int size) {
	if (size <= n()) return;
	IdMap old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Remove all elements from map. */
void IdMap::clear() {
	while (firstId() != 0) dropPair(getKey(firstId()));
}

/** Copy into this from source. */
void IdMap::copyFrom(const IdMap& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = source.firstId(); x != 0; x = source.nextId(x))
		addPair(source.getKey(x),x);
}

/** Add a new key->id pair.
 *  @param key is the key for which an id is required
 *  @return the new id or 0 if the key is already mapped or the
 *  operation fails
 */
int IdMap::addPair(uint64_t key) {
	index x = ids->firstOut();
	if (x == 0 || !ht->insert(key,x)) return 0;
	ids->swap(x);
	return x;
}

/** Add a new key->id pair.
 *  @param key is the key for which an id is required
 *  @param id is the requested id that the key is to be mapped to
 *  @return the new id or 0 if the key is already mapped or the
 *  id is already in use or the operation fails
 */
int IdMap::addPair(uint64_t key, int id) {
	if (ids->isIn(id) || !ht->insert(key,id)) return 0;
	ids->swap(id);
	return id;
}

/** Remove a pair from the mapping.
 *  This operation removes a (key,id) pair from the mapping.
 *  @param key is the key whose id is to be released
 */
void IdMap::dropPair(uint64_t key) {
	index x = ht->remove(key);
	if (ids->isIn(x)) ids->swap(x);
}

/** Create a string representation of the IdMap.
 *  @return the string
 */
string IdMap::toString() const {
	string s = "{";
	for (index x = firstId(); x != 0; x = nextId(x)) {
		if (x != firstId()) s += " ";
		s += to_string(getKey(x)) + ":" + to_string(x);
	}	
	s += "}"; return s;
}

} // ends namespace
