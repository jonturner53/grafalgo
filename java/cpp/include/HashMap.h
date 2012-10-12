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
#include "UiSetPair.h"

/** Maintains set of (key, value) pairs where key is a 64 bit value and
 *  value is a positive 32 bit integer. All keys must be distinct.
 * 
 *  Main methods
 *    get - returns value for given key
 *    put - adds a (key,value) pair
 *    remove - removes the pair for a given key
 * 
 *  The implementation uses a 2-left hash table with eight items
 *  in each bucket. The number of pairs is limited to 2^20 - 1.
 *  This ensures ensures a  maximum load factor of 50%
 *  x to minimize the potential for overloading any bucket.
 */
class HashMap {
public:
		HashMap(int);
		~HashMap();

	int	get(uint64_t); 		
	bool	put(uint64_t, int); 
	void	remove(uint64_t); 	
	string& toString(string&) const;
	void	clear(); 	
private:
	static const int BKT_SIZ = 8;		///< # of items per bucket
	static const int MAXSIZE = (1 << 20)-1;	///< max number of pairs
	static const int UNDEF_VAL = INT_MIN;	///< undefined value
	int	n;			///< range of values is 1..n
	int	nb;			///< number of hash buckets per section
	int	bktMsk;			///< mask used to extract bucket index
	int	kvxMsk;			///< mask used to extract key-val index
	int	fpMsk;			///< mask used to extract fingerprint

	typedef uint32_t bkt_t[BKT_SIZ]; ///< type declaration for buckets
	bkt_t	*bkt;			///< vector of hash backets
	struct KeyValPairs {
		uint64_t key;		
		int	val;
	};
	KeyValPairs *pairs;		///< vector of key value pairs
	UiSetPair *kvx;			///< in-use and free key-val indexes

	void hashit(uint64_t,int,uint32_t&,uint32_t&);
};

#endif
