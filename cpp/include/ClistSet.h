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

/** This class represents a collection of lists defined over an
 *  underlying index set. The lists are doubly linked, enabling fast
 *  traversal in either direction, and fast remove operations.
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
	int	next(index) const;
	int	prev(index) const;

	// modifiers
	void	join(index,index);
	void	remove(index);

	string&	toString(string&) const;
	string	toString() const;
private:
	struct lnode {
	int	succ;			// index of successor
	int	pred;			// index of predecessor
	} *node;

	void	makeSpace();
	void	freeSpace();
};

/** Get the successor of a list item.
 *  @param i is an index
 *  @return the index that follows i in its list
 */
inline index ClistSet::next(index i) const {
	assert(valid(i)); return node[i].succ;
}

/** Get the predecessor of a list item.
 *  @param i is an index
 *  @return the index that precedes i in its list
 */
inline index ClistSet::prev(index i) const {
	assert(valid(i)); return node[i].pred;
}

} // ends namespace

#endif
