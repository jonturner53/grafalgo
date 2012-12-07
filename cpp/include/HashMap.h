/** \file HashMap.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef HASHMAP_H
#define HASHMAP_H

#include "stdinc.h"
#include "Adt.h"
#include "HashTbl.h"
#include "SetPair.h"

namespace grafalgo {

/** Maintains set of (key, value) pairs where key is a 64 bit value and
 *  value is a positive 32 bit integer. All keys must be distinct.
 * 
 *  Main methods
 *    get - returns value for given key
 *    put - adds a (key,value) pair
 *    remove - removes the pair for a given key
 *
 *  Each pair is also assigned an index that can be used for iterating
 *  through the pairs.
 * 
 *  The implementation uses a 2-left hash table with eight items
 *  in each bucket. The number of pairs is limited to 2^20 - 1.
 *  This ensures ensures a  maximum load factor of 50%
 *  x to minimize the potential for overloading any bucket.
 */
class HashMap : public Adt {
public:
		HashMap(int);
		~HashMap();

	// common methods
	void	clear(); 	
	void	resize(int); 	
	void	expand(int); 	
	void	copyFrom(const HashMap&);

	// methods for accessing pairs by index
	index	firstPair() const;
	index	nextPair(index) const;
	uint64_t key(index) const;
	int	val(index) const;

	// modifiers
	int	get(uint64_t) const; 		
	bool	put(uint64_t, int); 
	void	remove(uint64_t); 	

	string& toString(string&) const;
private:
	int	*values;		///< array of values
	HashTbl *ht;			///< underlying hash table
	SetPair *kvx;			///< in-use and free key-val indexes

	void makeSpace(int);
	void freeSpace();
};

/** Get the index of the first (key,value) pair in the map.
 *  @return the index of the first pair; the order or pairs is arbitrary
 */
inline index HashMap::firstPair() const { return kvx->firstIn(); }

/** Get the index of the next (key,value) pair in the map.
 *  @param x is the index of some pair in the map
 *  @return the index of the next pair; the order or pairs is arbitrary
 */
inline index HashMap::nextPair(index x) const { return kvx->nextIn(x); }

/** Get the key of the (key,value) pair with a given index.
 *  @param x is the index of some pair in the map
 *  @return the key value part the pair with index x
 */
inline uint64_t HashMap::key(index x) const { return ht->getKey(x); }

/** Get the value of the (key,value) pair with a given index.
 *  @param x is the index of some pair in the map
 *  @return the value part of the pair with index x
 */
inline int HashMap::val(index x) const { return values[x]; }

/** Retrieve value for a given key.
 *  @param key is the key of a pair in the map
 *  @return true on success, false on failure.
 */
inline int HashMap::get(uint64_t key) const {
	index x = ht->lookup(key); return (x == 0 ? 0 : values[x]);
}

/** Add a pair to the map.
 *  @param key is the key of the pair to be added/modified
 *  @param value is the value of the pair to be added/modified
 *  @return true on success, false on failure.
 */
inline bool HashMap::put(uint64_t key, int value) {
	index x = ht->lookup(key);
	if (x != 0) { values[x] = value; return true; }
	x = kvx->firstOut(); if (x == 0) return false;
	if (!ht->insert(key,x)) return false;
	kvx->swap(x); values[x] = value;
	return true;
}

/** Remove an element from the set.
 *  @param key is the key of the pair to be removed
 */
inline void HashMap::remove(uint64_t key) {
	index x = ht->remove(key); if (x != 0) kvx->swap(x);
}

} // ends namespace

#endif
