/** @file Map_rbt.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Map_rbt.h"

namespace grafalgo {

/** Constructor for Map_rbt class.
 *  @param n defines the index range for the constructed object.
 */
Map_rbt::Map_rbt(int n) : Adt(n) { makeSpace(); init(); }

/** Destructor for Map_rbt class. */
Map_rbt::~Map_rbt() { freeSpace(); }

/** Allocate and initialize space for Map_rbt.
 */
void Map_rbt::makeSpace() {
	st = new Ssets_rbt(n());
	values = new uint32_t[n()+1];
	nodes = new ListPair(n());
}

/** Free dynamic storage used by Map_rbt. */
void Map_rbt::freeSpace() {
	delete st; delete [] values; delete nodes;
}

/** Reinitialize data structure, creating single node trees. */
void Map_rbt::clear() {
	while (root != 0) { remove(st->key(root)); }
}

/** Resize a Map_rbt object, discarding old value.
 *  @param n is the size of the resized object.
 */
void Map_rbt::resize(int n) {
	freeSpace(); Adt::resize(n); makeSpace(); init();
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param n is the size of the expanded object.
 */
void Map_rbt::expand(int n) {
	if (n <= this->n()) return;
	Map_rbt old(this->n()); old.copyFrom(*this);
	resize(n); this->copyFrom(old);
}
/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void Map_rbt::copyFrom(const Map_rbt& source) {
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
int Map_rbt::get(keytyp key) {
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
bool Map_rbt::put(uint64_t key, uint32_t val) {
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
void Map_rbt::remove(uint64_t key) {
	index x;
	if (root != 0 && (x = st->access(key,root)) != 0) {
		st->remove(x,root); nodes->swap(x);
	}
	return;
}

// Construct string listing the key,value pairs in the map
string Map_rbt::toString() const {
	string s;
	for (index u = nodes->firstIn(); u != 0; u = nodes->nextIn(u)) {
		s += " " + to_string(st->key(u)) + "," + to_string(values[u]);
	}
	return s;
}

} // ends namespace
