/** @file UiRlist.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef RLIST_H
#define RLIST_H

#include "stdinc.h"
#include "Util.h"

typedef int item;

/** Class representing a collection of reversible lists.
 *  The list items are unique integers in 1..N for some positive integer N.
 *  Each item is on a single list.
 */
class UiRlist {
public:		UiRlist(int=26);
		~UiRlist();
	item	first(item) const;	// return first item on list
	item	pop(item);		// remove first item from a list
	item	join(item,item);	// join two lists
	item	reverse(item);		// reverse a list
	string&	toString(item, string&) const;

	// stubbed, not implemented
		UiRlist(const UiRlist&);	
	UiRlist& operator=(const UiRlist&);
private:
	int	N;			// lists defined on ints in {1,...,N}
	struct ListNode {
	int	next;			// index of successor
	int	prev;			// index of predecessor
	};
	ListNode *node;
};

/** Get the first item on a list.
 *  @param t is the last item on some list
 *  @return the first item on the list containing t
 */
inline item UiRlist::first(item t) const { return node[t].next; }

/** Stub for copy constructor */
inline UiRlist::UiRlist(const UiRlist& h) {
	fatal("UiRlist: no copy constructor available");
}

/** Stub for assignment operator */
inline UiRlist& UiRlist::operator=(const UiRlist& L) {
	fatal("UiRlist: no assignment operator available");
	return *this;
}

#endif
