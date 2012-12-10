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

/** Maintains a set, where an element is a 64 bit value unsigned integer.
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
 *  in each bucket. The number of elements is limited to 2^20 - 1.
 *  This ensures ensures a  maximum load factor of 50%
 *  to minimize the potential for overloading any bucket.
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
	bool	member(uint64_t) const; 		

	index	first() const;
	index	next(index) const;
	bool	isValid(index) const;
	uint64_t val(index) const;
	index	getIndex(uint64_t) const;

	index	insert(uint64_t); 
	index	insertPair(uint64_t,index); 
	void	remove(uint64_t); 	

	string& toString(string&) const;
private:
	HashTbl *ht;			///< underlying hash table
	SetPair	*ex;			///< indexes of in-set elements and out

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
inline bool HashSet::member(uint64_t e) const { return getIndex(e) != 0; }

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

/** Find the index associated with a given set element.
 *  @param e is the value to be looked up in the set
 *  @return the index of the set element, or 0 if it's not in the set
 */
inline index HashSet::getIndex(uint64_t e) const { return ht->lookup(e); }

/** Determine if an index corresponds to a set element.
 *  @param x is an index
 *  @return true if there is some element with x as its index, else false
 */
inline bool HashSet::isValid(index x) const { return ex->isIn(x); }

/** Get the value of an element in the set.
 *  @param x is an index of a set element
 *  @return the element value
 */
inline uint64_t HashSet::val(index x) const { return ht->getKey(x); }

/** Add an element to the set.
 *  @param e is the element to be added; if already present in set
 *  no change is made to the set
 *  @return the index of the inserted element on success, 0 on failure.
 */
inline index HashSet::insert(uint64_t e) {
	index x = ex->firstOut();
	if (x == 0) return 0;
	return insertPair(e,x);
}

/** Add an element to the set, using a specific index.
 *  @param e is the element to be added; if already present in set
 *  no change is made to the set
 *  @param x is the index that e is to be paired with
 *  @return the index of the inserted element on success, 0 on failure.
 */
inline index HashSet::insertPair(uint64_t e, index x) {
	if (ex->isIn(x)) return 0;
	if (!ht->insert(e,x)) return 0;
	ex->swap(x);
	return x;
}

/** Remove an element from the set.
 *  @param e is the element to be removed
 */
inline void HashSet::remove(uint64_t e) {
cout << "remove " << e << endl;
//cout << (*ht) << endl;
	index x = ht->remove(e);
cout << "x=" << x << endl;
	if (x != 0) ex->swap(x);
}

} // ends namespace

#endif
