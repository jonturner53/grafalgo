/** \file HashSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef HASHSET_H
#define HASHSET_H

#include "Adt.h"
#include "HashTbl.h"
#include "SetPair.h"

namespace grafalgo {

/** Maintains a set, where an element is a 64 bit integer.
 * 
 *  Main methods
 *    member - tests an element for membership in the set
 *    insert - adds an element to the set
 *    remove - removes an element from the set
 *
 *  Each element is assigned an index that can be used for iterating
 *  through the set.
 * 
 *  The implementation uses a 2-left hash table with eight items
 *  in each bucket. The table is dimensioned for a load factor of
 *  no more than 50%.
 */
class HashSet : public Adt {
public:
		HashSet(int);
		~HashSet();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const HashSet&);

	int	size() const;
	bool	member(int64_t) const; 		

	index	first() const;
	index	next(index) const;
	bool	isValid(index) const;
	uint64_t val(index) const;
	index	getIndex(int64_t) const;

	index	insert(int64_t); 
	void	remove(int64_t); 	

	string& toString(string&) const;
private:
	static const int BKT_SIZ = 8;	///< # of elements per bucket
	typedef uint32_t bkt_t[BKT_SIZ]; ///< bucket type

	int	nb;			///< # of buckets in each half
	uint32_t bktMsk;		///< mask used by hash function
	bkt_t	*bkt;			///< buckets for hash table
	SetPair	*ex;			///< indexes of in-set elements and out

	uint32_t hashit(int64_t, int) const;
	void	makeSpace(int);
	void	freeSpace();
};

/** Determine the number of elements in the set.
 *  @return the number of elements in the set
 */
inline int HashSet::size() const { return ex->getNumIn(); }

/** Determine if an element is in the set.
 *  @parmam e is an element to be tested for set membership
 *  @return true if e is a member of the set, else false
 */
inline bool HashSet::member(int64_t e) const { return getIndex(e) != 0; }

/** Get the index of the first element in the set.
 *  @return the index of the first element in the set; the order
 *  of the elements is arbitrary
 */
inline index HashSet::first() const { return ex->firstIn(); }

/** Determine the index of the next element in the set.
 *  @param x is an index for a set element
 *  @return the index of the element that follows x in the set
 */
inline index HashSet::next(index x) const { return ex->nextIn(x); }

/** Determine if an index corresponds to a set element.
 *  @param x is an index
 *  @return true if there is some element with x as its index, else false
 */
inline bool HashSet::isValid(index x) const { return ex->isIn(x); }

/** Get the value of an element in the set.
 *  @param x is an index of a set element
 *  @return the element value
 */
inline uint64_t HashSet::val(index x) const {
	return bkt[(x-1)/BKT_SIZ][(x-1)%BKT_SIZ];
}

} // ends namespace

#endif
