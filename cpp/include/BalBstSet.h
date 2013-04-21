/*  @file BalBstSet.h
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BALBSTSET_H
#define BALBSTSET_H

#include "BstSet.h"

namespace grafalgo {

/** Balanced binary search trees class.
 *  Represents a collection of balanced BSTs, defined on indexes 1..n.
 *  Each BST corresponds to a "sorted set" and each node corresponds
 *  to an "item", where each item can appear in only one set at a time
 *  (possibly a singleton set).
 *
 *  Inherits some methods from the SortedSets class.
 */
class BalBstSet : public BstSet {
public:
		BalBstSet(int=26);
		~BalBstSet();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const BalBstSet&);

	bool	insert(index,bst&);
	void	remove(index,bst&);
	bst	join(bst,index,bst);
protected:
	int	*rvec;			///< rvec[x] is the "rank" of node x

	void	swap(index,index);
	void	rebalance(index);
	string& node2string(index,string&) const;

	void	makeSpace(int);
	void	freeSpace();
};

} // ends namespace

#endif
