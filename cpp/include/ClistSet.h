/** @file ClistSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef CLISTSET_H
#define CLISTSET_H

#include "stdinc.h"
#include "Adt.h"

namespace grafalgo {

/** This class represents a collection of lists defined on a set
 *  of unique integers 1..n. Each integer appears in exactly one set
 *  at all times. The lists are doubly linked, enabling fast traversal
 *  in either direction.
 */
class ClistSet : public Adt {
public:		ClistSet(int);
		~ClistSet();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const ClistSet&);

	// list traversal methods
	int	suc(index) const;
	int	pred(index) const;

	// modifiers
	void	join(index,index);
	void	remove(index);

	string&	toString(string&) const;
private:
	struct lnode {
	int	next;			// index of successor
	int	prev;			// index of predecessor
	} *node;

	void	makeSpace(int);
	void	freeSpace();
};

/** Get the successor of a list item.
 *  @param i is an index
 *  @return the index that follows i in its list
 */
inline index ClistSet::suc(index i) const {
	assert(0 <= i && i <= n()); return node[i].next;
}

/** Get the predecessor of a list item.
 *  @param i is an index
 *  @return the index that precedes i in its list
 */
inline index ClistSet::pred(index i) const {
	assert(0 <= i && i <= n()); return node[i].prev;
}

} // ends namespace

#endif
