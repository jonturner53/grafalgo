/** @file SaTreeMap.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "SaTreeMap.h"

/** Constructor for SaTreeMap, allocates space and initializes map.
 *  N1 is the max number of key-value pairs that can be stored.
 */
SaTreeMap::SaTreeMap(int n1) : n(n1) {
	st = new SelfAdjBsts(n);
	values = new uint32_t[n+1];
	nodes = new UiSetPair(n);
	root = 0;

	clear();
};
	
/** Destructor for SaTreeMap. */
SaTreeMap::~SaTreeMap() {
	delete st; delete [] values; delete nodes;
}

/** Clear the TreeMap contents. */
// could speed this up with a post-order traversal
// but would really need to do this in the search tree object
void SaTreeMap::clear() {
	while (root != 0) {
		nodes->swap(root); st->remove(root,root);
	}
}

/** Get the value for a specified key.
 *  @param key is the key to be looked up in the table
 *  @return the value stored for the given key, or UNDEF_VAL if there is none.
 */
int SaTreeMap::get(keytyp key) {
	if (root == 0) return UNDEF_VAL;
	item x = st->access(key,root);
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
	item x;
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
	item x;
	if (root != 0 && (x = st->access(key,root)) != 0) {
		st->remove(x,root);
		nodes->swap(x);
	}
	return;
}

/** Construct string listing the key,value pairs in the map.
 *  @param s is a reference to a string in which result is to be returned
 *  @return a reference to s
 */
string& SaTreeMap::toString(string& s) const {
	stringstream ss;
	for (item u = nodes->firstIn(); u != 0; u = nodes->nextIn(u)) {
		ss << " " << st->key(u) << "," << values[u];
	}
	s = ss.str();
	return s;
}
