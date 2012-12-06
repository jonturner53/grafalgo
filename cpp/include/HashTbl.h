/** \file HashTbl.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
  

#ifndef HASHTABLE_H
#define HASHTABLE_H

#include "stdinc.h"
#include "Adt.h"

namespace grafalgo {

/** Maintains set of (key, value) pairs where key is a 64 bit value and
 *  value is an index in a specified range.
 *  All (key,value) pairs must be fully disjoint; that is no two pairs may
 *  share the same key and no two pairs may share the same value.
 * 
 *  Main methods
 *    lookup - returns value for given key
 *    insert - adds a (key,value) pair
 *    remove - removes the pair for a given key
 * 
 *  The implementation uses a 2-left hash table with eight items
 *  in each bucket. The hash table is configured for a specified
 *  range of values (max of 10^6) with a maximum load factor of
 *  50% to minimize the potential for overloading any bucket.
 */
class HashTbl : public Adt {
public:
		HashTbl(int);
		~HashTbl();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const HashTbl&);

	int	size() const;
	index	lookup(uint64_t) const; 		
	uint64_t getKey(index) const;

	bool	insert(uint64_t, index); 
	int	remove(uint64_t); 	

	string&	toString(string&) const;
private:
	static const int BKT_SIZ = 8;		///< # of items per bucket
	static const int MAXVAL = (1 << 20)-1;	///< largest stored value
	int	siz;			///< number of entries in the table
	int	nb;			///< number of hash buckets per section
	int	bktMsk;			///< mask used to extract bucket index
	int	valMsk;			///< mask used to extract value
	int	fpMsk;			///< mask used to extract fingerprint

	typedef uint32_t bkt_t[BKT_SIZ]; ///< type declaration for buckets
	bkt_t	*bkt;			///< vector of hash backets
	uint64_t *keyVec;		///< vector of keys, indexed by value

	void	makeSpace(int);
	void	freeSpace();
	void hashit(uint64_t,int,uint32_t&,uint32_t&) const;
};

/** Get the number of entries in the table.
 *  @return the number of elements.
 */
inline int HashTbl::size() const { return siz; }

/** Get the key associated with a given value.
 *  @param i is the value whose key is being retrieved
 *  @return the corresponding key; assumes that i is the value for
 *  some key
 */
inline uint64_t HashTbl::getKey(index i) const { return keyVec[i]; }

} // ends namespace

#endif
