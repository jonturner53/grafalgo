/** @file UiClist.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef CLIST_H
#define CLIST_H

#include "stdinc.h"
#include "Util.h"

typedef int item;

/** This class represents a collection of lists defined on a set
 *  of unique integers 1..n. Each integer appears in exactly one set
 *  at all times. The lists are doubly linked, enabling fast traversal
 *  in either direction.
 */
class UiClist {
public:		UiClist(int);
		~UiClist();

	// list traversal methods
	int	suc(item) const;
	int	pred(item) const;

	// modifiers
	void	join(item,item);
	void	remove(item);
	void	reset();

	string&	toString(string&) const;
private:
	int	N;			// list defined on ints in {1,...,N}
	struct lnode {
	int	next;			// index of successor
	int	prev;			// index of predecessor
	} *node;
};

/** Get the successor of a list item.
 *  @param i is a list item
 *  @return the item that follows i in its list
 */
inline item UiClist::suc(item i) const {
	assert(0 <= i && i <= N); return node[i].next;
}

/** Get the predecessor of a list item.
 *  @param i is a list item
 *  @return the item that precedes i in its list
 */
inline item UiClist::pred(item i) const {
	assert(0 <= i && i <= N); return node[i].prev;
}

#endif
