/** @file SaBstSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef SABSTSET_H
#define SABSTSET_H

#include "BstSet.h"

/** Class representing a collection of self-adjusting binary search trees.
 *  Each BST represents a set of items, where each item is represented
 *  by a tree node.
 */
class SaBstSet : public BstSet {
public: 	SaBstSet(int=100);
		~SaBstSet();
	bst	find(item);		
	item	access(keytyp,bst&);

	bool	insert(item,bst&);
	void	remove(item,bst&);
	setPair	split(item,bst);
protected:
	item	splay(item);
	void	splaystep(item);
};

#endif
