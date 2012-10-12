/** \file HashSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef HASHSET_H
#define HASHSET_H

#include "stdinc.h"

/** Maintains set of keys, where a key is a 64 bit value unsigned integer.
 * 
 *  Main methods
 *    member - tests a key for membership in the set
 *    insert - adds a key to the set
 *    remove - removes a key from the set
 * 
 *  The implementation uses a 2-left hash table with eight items
 *  in each bucket. The number of keys is limited to 2^20 - 1.
 *  This ensures ensures a  maximum load factor of 50%
 *  to minimize the potential for overloading any bucket.
 */
class HashSet {
public:
		HashSet(int);
		~HashSet();

	int	size() const;
	bool	member(uint64_t) const; 		
	bool	insert(uint64_t); 
	void	remove(uint64_t); 	
	string& toString(string&) const;
	void	clear(); 	
private:
	static const int BKT_SIZ = 8;		///< # of items per bucket
	static const int MAXSIZE = (1 << 20)-1;	///< max number of pairs
	int	ssiz;			///< size of set
	int	n;			///< max number of items in set
	int	nb;			///< number of hash buckets per section
	int     bktMsk;                 ///< mask used to extract bucket index
	int	kxMsk;			///< mask used to extract key index
	int	fpMsk;			///< mask used to extract fingerprint

	typedef uint32_t bkt_t[BKT_SIZ]; ///< type declaration for buckets
	bkt_t	*bkt;			///< vector of hash backets
	uint64_t *keyTab;		///< array of keys in set
	int	free;			///< index of first free entry in keyTab

	void hashit(uint64_t,int,uint32_t&,uint32_t&) const;
};

/** Determine the number of keys in the set.
 *  @return the number of keys in the set
 */
inline int HashSet::size() const { return ssiz; }

#endif
