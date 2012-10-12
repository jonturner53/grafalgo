/** @file SelfAdjBsts.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef SELFADJBST_H
#define SELFADJBST_H

#include "SortedSets.h"

/** Class representing a collection of self-adjusting binary search trees.
 *  Each BST represents a set of items, where each item is represented
 *  by a tree node.
 */
class SelfAdjBsts : public SortedSets {
public: 	SelfAdjBsts(int=100);
		~SelfAdjBsts();
	sset	find(item);		
	item	access(keytyp,sset&);

	bool	insert(item,sset&);
	void	remove(item,sset&);
	setPair	split(item,sset);
protected:
	item	splay(item);
	void	splaystep(item);
};

#endif
