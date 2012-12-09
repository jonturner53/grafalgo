/** @file SaTreeMap.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "SaTreeMap.h"

namespace grafalgo {

/** Constructor for SaTreeMap class.
 *  @param size defines the index range for the constructed object.
 */
SaTreeMap::SaTreeMap(int size) : Adt(size) {
	makeSpace(size);
}

/** Destructor for SaTreeMap class. */
SaTreeMap::~SaTreeMap() { freeSpace(); }

/** Allocate and initialize space for SaTreeMap.
 *  @param size is number of index values to provide space for
 */
void SaTreeMap::makeSpace(int size) {
	try {
		st = new SaBstSet(size);
		values = new uint32_t[size+1];
		nodes = new SetPair(size);
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	root = 0; nn = size; clear();
}

/** Free dynamic storage used by SaTreeMap. */
void SaTreeMap::freeSpace() {
	delete st; delete [] values; delete nodes;
}

/** Reinitialize data structure, creating single node trees. */
void SaTreeMap::clear() {
	while (root != 0) remove(st->key(root));
}

/** Resize a SaTreeMap object, discarding old value.
 *  @param size is the size of the resized object.
 */
void SaTreeMap::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "SaTreeMap::resize::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void SaTreeMap::expand(int size) {
	if (size <= n()) return;
	SaTreeMap old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}
/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void SaTreeMap::copyFrom(const SaTreeMap& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	for (index x = source.nodes->firstIn(); x != 0;
		   x = source.nodes->nextIn(x)) {
		put(source.st->key(x),source.values[x]);
	}
}

/** Get the value for a specified key.
 *  @param key is the key to be looked up in the table
 *  @return the value stored for the given key, or UNDEF_VAL if there is none.
 */
int SaTreeMap::get(keytyp key) {
	if (root == 0) return UNDEF_VAL;
	index x = st->access(key,root);
	if (x == 0) return UNDEF_VAL;
	return values[x];
}

/** Put a (key,value) pair into the map.
 *  If there is already a pair defined for the given key value,
 *  just update the value
 *  @param key is the key part of the pair
 *  @param val is the value part of the pair
 *  @return true on success, false on failure.
 */
bool SaTreeMap::put(uint64_t key, uint32_t val) {
	index x;
	if (root == 0 || (x = st->access(key,root)) == 0) {
		x = nodes->firstOut();
		if (x == 0) return false;
		nodes->swap(x);
		st->setkey(x,key);
		if (root == 0) root = x;
		else st->insert(x,root);
	}
	values[x] = val;
	return true;
}

/** Remove a (key, value) pair from the table.
 *  @param key is the key of the pair to be removed
 */
void SaTreeMap::remove(uint64_t key) {
	index x;
	if (root != 0 && (x = st->access(key,root)) != 0) {
		st->remove(x,root); nodes->swap(x);
	}
	return;
}

/** Construct string listing the key,value pairs in the map.
 *  @param s is a reference to a string in which result is to be returned
 *  @return a reference to s
 */
string& SaTreeMap::toString(string& s) const {
	stringstream ss;
	for (index u = nodes->firstIn(); u != 0; u = nodes->nextIn(u)) {
		ss << " " << st->key(u) << "," << values[u];
	}
	s = ss.str();
	return s;
}

} // ends namespace
