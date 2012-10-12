/** @file SortedSets.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef SORTEDSETS_H
#define SORTEDSETS_H

#include "stdinc.h"
#include "Util.h"

typedef int sset;		// tree in collection
typedef int item;		// item in set
typedef uint64_t keytyp;
struct setPair { sset s1,s2; };	// pair of sset, returned by split

/** Data structure that represents a collection of "sorted sets".
 *  Items in the same set have distinct keys. Sets are represented
 *  by binary search trees, with items represented by tree nodes.
 *  Items (nodes) are identified by integers 1..n where n is specified
 *  when an object is constructed.
 */
class SortedSets {
public:
		SortedSets(int);
		~SortedSets();

	keytyp	key(item) const;	
	void	setkey(item,keytyp);
	sset	find(item) const;
	item	access(keytyp,sset&) const;

	bool	insert(item,sset&);	
	void	remove(item,sset&);
	sset	join(sset,item,sset);	
	setPair	split(item,sset);	

	virtual string& item2string(item, string&) const;
	string& set2string(sset, string&) const;
	string& toString(string&) const;
protected:
	int	n;			// items are integers in {1,...,n}
	struct SsetNode {
	item	left, right, p;		// left child, right child, parent
	keytyp 	kee;			// key values
	};
	SsetNode *node;
	void virtual swap(item,item);
	void virtual rotate(item);	
	item 	sibling(item, item);
	item	remove(item);	
};

/** Get the key of an item.
 *  @param i is an item in a set
 *  @return the key of i
 */
inline keytyp SortedSets::key(item i) const { return node[i].kee; }

/** Set the key of an item.
 *  @param i is a singleton item
 *  @param k is the new key value to be assigned to i
 */
inline void SortedSets::setkey(item i, keytyp k) {
	assert(node[i].left == 0 && node[i].right == 0 && node[i].p == 0);
	node[i].kee = k;
}

/** Get the sibling of a tree node.
 *  @param x is an item in a set (node in a BST)
 *  @param px is the parent of x in its tree
 *  @return the "other child" of px, or 0 if there is none
 */
item inline SortedSets:: sibling(item x, item px) {
	return (x == node[px].left ? node[px].right : node[px].left);
}

#endif
