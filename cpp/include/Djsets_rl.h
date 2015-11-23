/** @file Djsets_rl.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DJSETS_RL_H
#define DJSETS_RL_H

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
class Djsets_rl : public Adt {
public:		Djsets_rl(int=26);
		~Djsets_rl();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Djsets_rl&);

	index	first(index) const;
	index	last(index) const;
	index	next(index,index) const;
	index	prev(index,index) const;
	void	advance(index&,index&) const;
	void	retreat(index&,index&) const;

	index	pop(index);	
	index	join(index,index);
	index	reverse(index);	

	string&	toString(string&) const;
	string 	toString() const;
	string&	toString(index, string&) const;
	string	toString(index) const;
private:
	struct ListNode {
	int	p1;			// index of predecessor or successor
	int	p2;			// index of the other
	};
	ListNode *node;
	bool	*canon;			///< canon[x] is true if x is the
					///< canonical item on its list

	void	makeSpace();
	void	freeSpace();
};

/** Get the index of the first item on a list.
 *  @param x is the index of the canonical item of a list
 *  @return the first index on the list containing x
 */
inline index Djsets_rl::first(index x) const {
	assert(valid(x)); return node[x].p1;
}

/** Get the index of the last item on a list.
 *  @param x is the index of the canonical item of a list
 *  @return the last index on the list containing x
 */
inline index Djsets_rl::last(index x) const { assert(valid(x)); return x; }

/** Get the index of the next item on a list.
 *  @param x is the index of some item of a list
 *  @param prev is the index of the item that comes before x on its list
 *  @return the last index on the list containing x
 */
inline index Djsets_rl::next(index x, index prev) const {
	assert(valid(x) && valid(prev) &&
	       (prev == node[x].p1 || prev == node[x].p2));
	return (prev == node[x].p2 ? node[x].p1 : node[x].p2);
}

/** Get the index of the previous item on a list.
 *  @param x is the index of some item of a list
 *  @param next is the index of the item that comes after x on its list
 *  @return the index of the previous item on the list containing x
 */
inline index Djsets_rl::prev(index x, index next) const {
	assert(valid(x) && valid(next) &&
	       (next == node[x].p1 || next == node[x].p2));
	return (next == node[x].p2 ? node[x].p1 : node[x].p2);
}

/** Advance the indices of a pair of list items.
 *  @param x is a reference to the index of some item on a list;
 *  on return, x is the index of the next item on the list
 *  @param y is a reference to the index of the predecessor of x;
 *  on return, y is the original value of x
 */
inline void Djsets_rl::advance(index& x, index& y) const {
	assert(valid(x) && valid(y) && (y == node[x].p1 || y == node[x].p2));
	index xx = x; x = next(x,y); y = xx;
}

/** Retreat (advance in reverse) the indices of a pair of list items.
 *  @param x is a reference to the index of some item on a list;
 *  on return, x is the index of the previous item on the list
 *  @param y is a reference to the index of the successor of x;
 *  on return, y is the original value of x
 */
inline void Djsets_rl::retreat(index& x, index& y) const {
	assert(valid(x) && valid(y) && (y == node[x].p1 || y == node[x].p2));
	index xx = x; x = prev(x,y); y = xx;
}

} // ends namespace

#endif
