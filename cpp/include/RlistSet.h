/** @file RlistSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef RLISTSET_H
#define RLISTSET_H

#include "Adt.h"

namespace grafalgo {

/** Class representing a collection of reversible lists.
 *  The list items are index values, with each index appearing in.
 *  a single list.
 *
 *  The implementation uses doubly-linked circular lists in which
 *  the role of the two pointers can change in order to enable
 *  constant time reversal. For the last element on the list,
 *  the role of the two pointers is fixed, but for all others,
 *  it can be reversed.
 */
class RlistSet : public Adt {
public:		RlistSet(int=26);
		~RlistSet();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const RlistSet&);

	index	first(index) const;
	index	last(index) const;
	index	suc(index,index) const;
	index	pred(index,index) const;
	void	advance(index&,index&) const;
	void	retreat(index&,index&) const;

	index	pop(index);	
	index	join(index,index);
	index	reverse(index);	

	string&	toString(string&) const;
	string&	toString(index, string&) const;
private:
	struct ListNode {
	int	p1;			// index of predecessor or successor
	int	p2;			// index of the other
	};
	ListNode *node;
	bool	*canon;			///< canon[x] is true if x is the
					///< canonical item on its list

	void	makeSpace(int);
	void	freeSpace();
};

/** Get the index of the first item on a list.
 *  @param x is the index of the canonical item of a list
 *  @return the first index on the list containing x
 */
inline index RlistSet::first(index x) const { return node[x].p1; }

/** Get the index of the last item on a list.
 *  @param x is the index of the canonical item of a list
 *  @return the last index on the list containing x
 */
inline index RlistSet::last(index x) const { return x; }

/** Get the index of the next item on a list.
 *  @param x is the index of some item of a list
 *  @param prev is the index of the item that comes before x on its list
 *  @return the last index on the list containing x
 */
inline index RlistSet::suc(index x, index prev) const {
	return (prev == node[x].p2 ? node[x].p1 : node[x].p2);
}

/** Get the index of the previous item on a list.
 *  @param x is the index of some item of a list
 *  @param next is the index of the item that comes after x on its list
 *  @return the index of the previous item on the list containing x
 */
inline index RlistSet::pred(index x, index next) const {
	return (next == node[x].p2 ? node[x].p1 : node[x].p2);
}

/** Advance the indices of a pair of list items.
 *  @param x is a reference to the index of some item on a list;
 *  on return, x is the index of the next item on the list
 *  @param y is a reference to the index of the predecessor of x;
 *  on return, y is the original value of x
 */
inline void RlistSet::advance(index& x, index& y) const {
	index xx = x; x = suc(x,y); y = xx;
}

/** Retreat (advance in reverse) the indices of a pair of list items.
 *  @param x is a reference to the index of some item on a list;
 *  on return, x is the index of the previous item on the list
 *  @param y is a reference to the index of the successor of x;
 *  on return, y is the original value of x
 */
inline void RlistSet::retreat(index& x, index& y) const {
	index xx = x; x = pred(x,y); y = xx;
}

} // ends namespace

#endif
