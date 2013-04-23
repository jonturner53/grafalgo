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

namespace grafalgo {

/** Class representing a collection of self-adjusting binary search trees.
 *  Each BST represents a set of items, where each item is represented
 *  by a tree node.
 */
class SaBstSet : public BstSet {
public: 	SaBstSet(int=26);
		~SaBstSet();
	bst	find(index);		
	index	access(keytyp,bst&);

	bool	insert(index,bst&);
	void	remove(index,bst&);
	BstPair	split(index,bst);

	index	first(bst) = delete;
	index	last(bst) = delete;
	index	suc(index) = delete;
	index	pred(index) = delete;
protected:
	index	splay(index);
	void	splaystep(index);
};

} // ends namespace

#endif
