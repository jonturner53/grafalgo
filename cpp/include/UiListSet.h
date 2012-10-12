/** @file UiListSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef UILISTSET_H
#define UILISTSET_H

#include "stdinc.h"
#include "Util.h"

typedef int item;
typedef int alist;

/** Header file for data structure representing a collection of lists
 *  defined over integers 1,2,... Each item can be stored in at most one list.
 *  Lists are also numbered 1,2,...
 */
class UiListSet {
public:		UiListSet(int=26,int=5);
		~UiListSet();

	// access items
	item	next(item) const;	
	item	first(alist) const;
	item	last(alist) const;	

	// predicates
	bool	member(item) const;
	bool	empty(alist) const;

	// modifiers
	void	addLast(item, alist);
	void	addFirst(item,alist);
	item	removeFirst(alist);

	// input/output
	string& toString(string&) const;
	string& list2string(alist, string&) const;
private:
	int	nI;			// listset defined on ints in {1..nI}
	int	nL;			// lists 1..nL
	struct listhdr {
		alist head, tail;
	};
	listhdr	*lh;			// array of list headers
	item	*nxt;			// next[i] is successor of i
};

/** Get the first item in a list.
 *  @param lst is a list in the collection
 *  @return the first item on lst, or 0 if the list is empty
 */
inline item UiListSet::first(alist lst) const { return lh[lst].head; }

/** Get the last item in a list.
 *  @param lst is a list in the collection
 *  @return the last item on lst, or 0 if the list is empty
 */
inline item UiListSet::last(alist lst) const { return lh[lst].tail; }

/** Determine if a list is empty.
 *  @param lst is a list in the collection
 *  @return true if the list is empty, else false
 */
inline bool UiListSet::empty(alist lst) const { return lh[lst].head == 0; }

/** Determine if an item is on some list.
 *  @param i is an item
 *  @return true if the some list contains i, else false
 */
inline bool UiListSet::member(item i) const { return nxt[i] != -1; }

/** Get the successor of an item.
 *  @param i is an item on some list
 *  @return the successor of i
 */
inline item UiListSet::next(item i) const { return nxt[i]; }

#endif
