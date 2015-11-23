/** @file Ssets_sat.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef SASSETS_H
#define SASSETS_H

#include "Ssets.h"

namespace grafalgo {

/** Class representing a collection of self-adjusting binary search trees.
 *  Each BST represents a set of items, where each item is represented
 *  by a tree node.
 */
class Ssets_sat : public Ssets {
public: 	Ssets_sat(int=26);
		~Ssets_sat();
	bst	find(index);		
	bst	findroot(index);		
	index	access(keytyp,bst&);

	bool	insert(index,bst&);
	void	remove(index,bst&);
	BstPair	split(index,bst);

	index	first(bst) = delete;
	index	last(bst) = delete;
	index	next(index) = delete;
	index	prev(index) = delete;
protected:
	index	splay(index);
	void	splaystep(index);
};

} // ends namespace

#endif
