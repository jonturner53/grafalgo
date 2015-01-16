/** \file ListPair.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LISTPAIR_H
#define LISTPAIR_H

#include "stdinc.h"

#include "Adt.h"

namespace grafalgo {

/** Data structure that represents a pair of complementary index lists.
 *  The index values have a limited range 1..n and each index is
 *  always in one of the two lists.  The lists are referred to as
 *  "in" and "out" and can be accessed using the provided methods.
 *  The only way to modify the data structure is to move an item
 *  from one list to the other, using the swap methods.
 *  Initially, all index values are in the out list.
 */
class ListPair : public Adt {
public:
		ListPair(int=26);
		ListPair(const ListPair&);
		ListPair(ListPair&&);
		~ListPair();

	void	clear();
	void	resize(int);
	void	expand(int);

	// operators
        ListPair&   operator=(const ListPair&);
        ListPair&   operator=(ListPair&&);
        bool    operator==(const ListPair&);

	// predicates
	bool	isIn(index) const;
	bool	isOut(index) const;

	// iteration methods
	index	firstIn() const; 	
	index	lastIn() const; 	
	index	nextIn(index) const; 	
	index	prevIn(index) const; 	

	index	firstOut() const; 	
	index	lastOut() const; 	
	index	nextOut(index) const; 	
	index	prevOut(index) const; 	

	// getters
	int	getNumIn() const;
	int	getNumOut() const;

	// modifiers
	void	swap(index);
	void	swap(index, index);

	// produce string representation
	string 	toString() const;
private:
	int numIn;		///< number of elements in in-list
	int numOut;		///< number of elements in out-list

	index inHead;		///< first value in the in-list
	index inTail;		///< last value in the in-list
	index outHead;		///< first value in the out-list
	index outTail;		///< last value in the out-list

	index *succ;		///< succ[i] defines next value after i
	index *pred;		///< pred[i] defines value preceding i

	void	makeSpace();
	void	freeSpace();
	void	init();
	void	copyContents(const ListPair&);
};

/** Determine if an index belongs to the "in-list".
 *  @param i is a valid index
 *  @param return true if i is a member of the "in-list", else false.
 */
inline bool ListPair::isIn(index i) const {
	return (valid(i) && (succ[i] > 0 || i == inTail));
}

/** Determine if an index belongs to the "out-list".
 *  @param i is an index in the range of values supported by the object
 *  @param return true if i is a member of the "out-list", else false.
 */
inline bool ListPair::isOut(index i) const {
	return (valid(i) && (succ[i] < 0 || i == outTail));
}

/** Get the number of elements in the "in-list".
 *  @return the number of elements in the in-list
 */
inline int ListPair::getNumIn() const { return numIn; }

/** Get the number of elements in the "in-list".
 *  @return the number of elements in the in-list
 */
inline int ListPair::getNumOut() const { return numOut; }

/** Get the first index in the in-list.
 *  @return the first value on the in-list or 0 if the list is empty.
 */
inline index ListPair::firstIn() const { return inHead; }

/** Get the first index in the out-list.
 *  @return the first value on the out-list or 0 if the list is empty.
 */
inline index ListPair::firstOut() const { return outHead; }

/** Get the last index in the in-list.
 *  @return the last value on the in-list or 0 if the list is empty.
 */
inline index ListPair::lastIn() const { return inTail; }

/** Get the first index in the out-list.
 *  @return the last value on the out-list or 0 if the list is empty.
 */
inline index ListPair::lastOut() const { return outTail; }

/** Get the next index in the inlist.
 *  @param i is the "current" value
 *  @return the next index on the in-list or 0 if no more values
 */
inline index ListPair::nextIn(index i) const {
	assert(isIn(i)); return succ[i];
}

/** Get the next value in the outlist.
 *  @param i is the "current" value
 *  @return the next value on the out-list or 0 if no more values
 */
inline index ListPair::nextOut(index i) const {
	assert(isOut(i)); return -succ[i];
}

/** Get the previous value in the inlist.
 *  @param i is the "current" value
 *  @return the previous value on the in-list or 0 if no more values
 */
inline index ListPair::prevIn(index i) const {
	assert(isIn(i)); return pred[i];
}

/** Get the previous value in the outlist.
 *  @param i is the "current" value
 *  @return the previous value on the out-list or 0 if no more values
 */
inline index ListPair::prevOut(index i) const {
	assert(isOut(i)); return -pred[i];
}

/** Move an item from one list to the other.
 *  Inserts swapped item to end of the other list
 *  @param i is the index of item to be swapped
 */
inline void ListPair::swap(index i) {
        if (isIn(i)) return swap(i,outTail);
        else return swap(i,inTail);
}

} // ends namespace

#endif

