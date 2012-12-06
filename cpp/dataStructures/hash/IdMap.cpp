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
	try { hset = new HashSet(n()); } catch (std::bad_alloc e) {
		stringstream ss;
		ss << "IdMap::makeSpace: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
}

/** Free dynamic storage used by list. */
void IdMap::freeSpace() { delete hset; }

/** Resize a IdMap object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void IdMap::resize(int size) {
	Adt::resize(size);
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "IdMap::resize:" + e.toString(s);
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
void IdMap::clear() { hset->clear(); }

/** Copy into this from source. */
void IdMap::copyFrom(const IdMap& source) { hset->copyFrom(*source.hset); }

/** Add a new key->id pair.
 *  @param key is the key for which an id is required
 *  @return the new id or 0 if the key is already mapped or the
 *  operation fails
 */
int IdMap::addPair(uint64_t key) { return hset->insert(key); }

/** Add a new key->id pair.
 *  @param key is the key for which an id is required
 *  @param id is the requested id that the key is to be mapped to
 *  @return the new id or 0 if the key is already mapped or the
 *  id is already in use or the operation fails
 */
int IdMap::addPair(uint64_t key, int id) { return hset->insertPair(key,id); }

/** Remove a pair from the mapping.
 *  This operation removes a (key,id) pair from the mapping.
 *  @param key is the key whose id is to be released
 */
void IdMap::dropPair(uint64_t key) { hset->remove(key); }

/** Create a string representation of the IdMap.
 *  @param s is the string in which the result is returned.
 */
string& IdMap::toString(string& s) const {
	stringstream ss; ss << "{ ";
	for (index x = hset->first(); x != 0; x = hset->next(x)) {
		ss << "(" << hset->val(x) << "," << x << ") ";
	}	
	ss << "}"; s = ss.str(); return s;
}

} // ends namespace
