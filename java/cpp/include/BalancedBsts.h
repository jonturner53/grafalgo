/*  @file BalancedBsts.h
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BALANCEDBSTS_H
#define BALANCEDBSTS_H

#include "SortedSets.h"

/** Balanced binary search trees class.
 *  Represents a collection of balanced BSTs, defined on nodes 1..n
 *  where n is specified when an object is constructed. Each BST corresponds
 *  to a "sorted set" and each node corresponds to an "item", where each
 *  item can appear in only one set at a time (possibly a singleton set).
 *
 *  Inherits some methods from the SortedSets class.
 */
class BalancedBsts : public SortedSets {
public:
		BalancedBsts(int);
		~BalancedBsts();
	bool	insert(item,sset&);
	void	remove(item,sset&);
	sset	join(sset,item,sset);
	setPair	split(item,sset);
protected:
	int	*rvec;			///< rvec[x] is the "rank" of node x

	void	virtual swap(item,item);
	virtual string& item2string(item,string&) const;
};

#endif
