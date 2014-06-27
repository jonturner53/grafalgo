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
template<class K, class V>
class HashMap : public HashSet<K> {
public:
		HashMap(uint32_t (*)(const K&,int), int=15);
		~HashMap();

	// common methods
	void	clear(); 	
	void	resize(int); 	
	void	expand(int); 	
	void	copyFrom(const HashMap&);

	// inherited methods
	using	Adt::n;
	using	HashSet<K>::first;
	using	HashSet<K>::next;
	using	HashSet<K>::find;
	using	HashSet<K>::valid;
	using	HashSet<K>::size;
	using	HashSet<K>::remove;

	// methods for accessing pairs
	V&	get(const K&) const;
	const K& getKey(index) const;
	V&	getValue(index) const;

	// modifiers
	index	put(const K&, const V&); 		
	index	put(const K&, const V&, index); 		

	string  toString() const;
private:
	V	*values;		///< array of values

	void makeSpace(int);
	void freeSpace();

	// inherited methods
	using	HashSet<K>::retrieve;
	using	HashSet<K>::contains;
	using	HashSet<K>::insert;
	using	HashSet<K>::hashit;
};

/** Constructor for HashMap, allocates space and initializes table.
 *  @param hf is a pointer to a hash function that hashes a key to
 *  a 32 bit hash value
 *  @param N1 is the maximum number of elements in the map;
 *  it must be less than 2^24.
 */
template<class K, class V>
HashMap<K,V>::HashMap(uint32_t (*hf)(const K&,int),int n1) : HashSet<K>(hf,n1) {
	makeSpace(n1);
}
	
/** Destructor for HashMap. */
template<class K, class V>
HashMap<K,V>::~HashMap() { freeSpace(); }

/** Allocate and initialize space for map.
 *  @param size is number of index values to provide space for
 */
template<class K, class V>
void HashMap<K,V>::makeSpace(int size) {
	try {
		values = new V[size+1];
	} catch (std::bad_alloc e) {
		string s = "HashMap::makeSpace: insufficient space for "
		   	   + to_string(size) + " index values";
		throw OutOfSpaceException(s);
	}
}

/** Free dynamic storage used by map. */
template<class K, class V>
void HashMap<K,V>::freeSpace() { delete [] values; }

/** Resize a HashMap object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
template<class K, class V>
void HashMap<K,V>::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "HashMap::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this map.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
template<class K, class V>
void HashMap<K,V>::expand(int size) {
	if (size <= n()) return;
	HashMap<K,V> old(hashit,this->n()); old.copyFrom(*this);
	HashSet<K>::resize(size);
	resize(size); this->copyFrom(old);
}

/** Clear the hashtable contents. */
template<class K, class V>
void HashMap<K,V>::clear() {
	while (first() != 0) remove(getKey(first()));
}

/** Copy into map from src. */
template<class K, class V>
void HashMap<K,V>::copyFrom(const HashMap& src) {
	if (&src == this) return;
	if (src.n() > n()) resize(src.n());
	else clear();
        for (index x = src.first(); x != 0; x = src.next(x))
		put(src.getKey(x), src.getValue(x), x);
}

/** Get the key of the (key,value) pair with a given index.
 *  @param x is the index of some pair in the map
 *  @return a const reference to the key part of the pair with index x
 *  throws an illegal argument exception if x is not a valid index
 */
template<class K, class V>
inline const K& HashMap<K,V>::getKey(index x) const {
	if (!valid(x)) {
		string s = "HashMap::getValue: invalid index " + to_string(x);
		throw IllegalArgumentException(s);
	}
	return retrieve(x);
}

/** Get the value of the (key,value) pair with a given index.
 *  @param x is the index of some pair in the map
 *  @return a reference to the value part of the pair with index x
 *  throws an illegal argument exception if x is not a valid index
 */
template<class K, class V>
inline V& HashMap<K,V>::getValue(index x) const {
	if (!valid(x)) {
		string s = "HashMap::getValue: invalid index " + to_string(x);
		throw IllegalArgumentException(s);
	}
	return values[x];
}

/** Get the value associated with a given key.
 *  @param key is a reference to a key
 *  @return a reference to the value part of the corresponding (key,value) pair;
 *  throws an illegal argument exception if no such key
 */
template<class K, class V>
inline V& HashMap<K,V>::get(const K& key) const {
	return getValue(find(key));
}

/** Add a pair to the map.
 *  @param key is the key of the pair to be added/modified
 *  @param value is the value of the pair to be added/modified
 *  @return true on success, false on failure.
 */
template<class K, class V>
inline index HashMap<K,V>::put(const K& key, const V& val) {
	index x = this->insert(key);
	if (x != 0) values[x] = val;
	return x;
}

/** Add a pair to the map, using a specified index.
 *  @param key is the key of the pair to be added/modified
 *  @param value is the value of the pair to be added/modified
 *  @param x is the index to be assigned to the new pair
 *  @return true on success, false on failure.
 */
template<class K, class V>
inline index HashMap<K,V>::put(const K& key, const V& val, index x) {
	x = insert(key,x);  // note if key already in map, may get new x
	if (x == 0) return 0;
	values[x] = val;
	return x;
}

/** Construct string listing the key,value pairs in the map
 *  @return the string
 */
template<class K, class V>
string HashMap<K,V>::toString() const {
	stringstream ss; ss << "{";
        for (int x = first(); x != 0; x = next(x)) {
		if (x != first()) ss << " ";
                ss << "(" << getKey(x) << "," << getValue(x) << ")";
        }
	ss << "}"; return ss.str();
}

} // ends namespace

#endif
