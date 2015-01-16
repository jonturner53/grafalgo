/** \file HashMap.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef HASHMAP_H
#define HASHMAP_H

#include "stdinc.h"
#include "Adt.h"
#include "HashSet.h"
#include "ListPair.h"

namespace grafalgo {

/** Maintains set of (key, value) pairs where both key and value are
 *  template parameters.  Each pair is also assigned an index that can
 *  be used for iterating through the pairs.
 * 
 *  Main methods
 *    find - returns index of pair with given key
 *    insert - adds a (key,value) pair
 *    remove - removes the pair for a given key
 *
 *  The implementation uses a 2-left hash table with eight items
 *  in each bucket. The number of pairs is limited to 2^24 - 1.
 *
 *  Requires a user-supplied hash function to compute 32 bit hash values
 *  from keys.
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
class HashMap : public HashSet<K,H> {
public:
		HashMap(int=10, bool=true);
		HashMap(const HashMap&);
		HashMap(HashMap&&);
		~HashMap();

	// operators
	HashMap& operator=(const HashMap&);
	HashMap& operator=(HashMap&&);

	// adjusting size
	void	resize(int); 	
	void	expand(int); 	

	// inherited methods
	using	Adt::n;
	using	HashSet<K,H>::first;
	using	HashSet<K,H>::next;
	using	HashSet<K,H>::find;
	using	HashSet<K,H>::contains;
	using	HashSet<K,H>::valid;
	using	HashSet<K,H>::size;
	using	HashSet<K,H>::retrieve;

	// methods for accessing pairs
	V&	get(const K&) const;
	const K& getKey(index) const;
	V&	getValue(index) const;

	// modifiers
	index	put(const K&, const V&); 		
	index	put(const K&, const V&, index); 		
	void	remove(const K&);
	bool	rekey(index, const K&);
	void	clear(); 	

	string  toString() const;
private:
	V	*values;		///< array of values

	void makeSpace();
	void freeSpace();
};

/** Constructor for HashMap, allocates space.
 *  @param hf is a pointer to a hash function that hashes a key to
 *  a 32 bit hash value
 *  @param n1 is the maximum number of elements in the map;
 *  it must be less than 2^24; default=10
 *  @param autoX determines if the data structure is automatically expanded
 *  when necessary or not; default=true
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
HashMap<K,V,H>::HashMap(int n1, bool autoX) : HashSet<K,H>(n1,autoX) {
	makeSpace();
}

/** Copy constructor */
template<class K, class V, uint32_t (*H)(const K&, int)>
HashMap<K,V,H>::HashMap(const HashMap<K,V,H>& src) : HashSet<K,H>(src) {
	makeSpace(); 
}

/** Move constructor */
template<class K, class V, uint32_t (*H)(const K&, int)>
HashMap<K,V,H>::HashMap(HashMap<K,V,H>&& src) : HashSet<K,H>(src) {
	values = src.values; src.values = nullptr;
} 

/** Destructor for HashMap. */
template<class K, class V, uint32_t (*H)(const K&, int)>
HashMap<K,V,H>::~HashMap() { freeSpace(); }

/** Allocate space for map.
 *  @param size is number of index values to provide space for
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
void HashMap<K,V,H>::makeSpace() { values = new V[n()+1]; }

/** Free dynamic storage used by map. */
template<class K, class V, uint32_t (*H)(const K&, int)>
void HashMap<K,V,H>::freeSpace() { delete [] values; }

/** Assignment operator (copy version).
 *  @return a reference to this object.
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
HashMap<K,V,H>& HashMap<K,V,H>::operator=(const HashMap<K,V,H>& src) {
	if (this == &src) return *this;
	int old_n = n();
	HashSet<K,H>::operator=(src);
	if (n() != old_n) { // parent class re-sized object
		freeSpace(); makeSpace();
	}
	for (index x = src.first(); x != 0; x = src.next(x))
		values[x] = src.values[x];
	return *this;
}

/** Assignment operator (move version).
 *  @return a reference to this object.
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
HashMap<K,V,H>& HashMap<K,V,H>::operator=(HashMap<K,V,H>&& src) {
	if (this == &src) return *this;
	HashSet<K,H>::operator=(src);
	delete [] values; values = src.values; src.values = nullptr;
	return *this;
}

/** Resize a HashMap object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
void HashMap<K,V,H>::resize(int size) {
	freeSpace(); HashSet<K,H>::resize(size); makeSpace();
}

/** Expand the space available for this map.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
void HashMap<K,V,H>::expand(int size) {
	int old_n = n();
	HashSet<K,H>::expand(size);
	if (n() == old_n) return;
	V *old_values = values; makeSpace();
	for (index x = first(); x != 0; x = next(x))
		values[x] = old_values[x];
	delete[] old_values;
}

/** Clear the hash map contents. */
template<class K, class V, uint32_t (*H)(const K&, int)>
void HashMap<K,V,H>::clear() {
	while (first() != 0) remove(getKey(first()));
}

/** Get the key of the (key,value) pair with a given index.
 *  @param x is the index of some pair in the map
 *  @return a const reference to the key part of the pair with index x
 *  throws an illegal argument exception if x is not a valid index
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
inline const K& HashMap<K,V,H>::getKey(index x) const {
	assert(valid(x)); return retrieve(x);
}

/** Get the value of the (key,value) pair with a given index.
 *  @param x is the index of some pair in the map
 *  @return a reference to the value part of the pair with index x
 *  throws an illegal argument exception if x is not a valid index
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
inline V& HashMap<K,V,H>::getValue(index x) const {
	assert(valid(x)); return values[x];
}

/** Get the value associated with a given key.
 *  @param key is a reference to a key
 *  @return a reference to the value part of the corresponding (key,value) pair;
 *  throws an illegal argument exception if no such key
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
inline V& HashMap<K,V,H>::get(const K& key) const {
	return getValue(find(key));
}

/** Add a pair to the map.
 *  @param key is the key of the pair to be added/modified
 *  @param value is the value of the pair to be added/modified
 *  @return true on success, false on failure.
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
index HashMap<K,V,H>::put(const K& key, const V& val) {
	int old_n = n();
	index x = HashSet<K,H>::insert(key);
	if (n() != old_n) { // parent class expanded space
		V *old_values = values; makeSpace();
		for (index z = first(); z != 0; z = next(z))
			values[z] = old_values[z];
		delete[] old_values;
	}
	if (x != 0) values[x] = val;
	return x;
}

/** Add a pair to the map, using a specified index.
 *  @param key is the key of the pair to be added/modified
 *  @param value is the value of the pair to be added/modified
 *  @param x is the index to be assigned to the new pair
 *  @return true on success, false on failure.
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
index HashMap<K,V,H>::put(const K& key, const V& val, index x) {
	int old_n = n();
	x = HashSet<K,H>::insert(key,x);
	if (n() != old_n) { // parent class expanded space
		V *old_values = values; makeSpace();
		for (index z = first(); z != 0; z = next(z))
			values[z] = old_values[z];
		delete[] old_values;
	}
	if (x != 0) values[x] = val;
	return x;
}

template<class K, class V, uint32_t (*H)(const K&, int)>
void HashMap<K,V,H>::remove(const K& key) {
	int old_n = n();
	HashSet<K,H>::remove(key);
	if (n() != old_n) { // parent class shrunk set
		freeSpace(); makeSpace();
	}
}

/** Change the key for a specific (key,value) pair.
 *  @param x is the index of a pair that is to be re-keyed
 *  @param key is the new key for the pair
 *  @return true on success, false on failure.
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
bool HashMap<K,V,H>::rekey(index x, const K& key) {
	if (!valid(x)) return false;
	K oldkey = getKey(x);
	remove(oldkey);
	if (HashSet<K,H>::insert(key,x) == 0) {
		HashSet<K,H>::insert(oldkey,x); return false;
	}
	return true;
}

/** Construct string listing the key,value pairs in the map
 *  @return the string
 */
template<class K, class V, uint32_t (*H)(const K&, int)>
string HashMap<K,V,H>::toString() const {
	stringstream ss; ss << "{";
        for (int x = first(); x != 0; x = next(x)) {
		if (x != first()) ss << " ";
                ss << "(" << getKey(x) << "," << getValue(x) << ")";
        }
	ss << "}"; return ss.str();
}

} // ends namespace

#endif
