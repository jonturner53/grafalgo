/** @file BstSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BSTSET_H
#define BSTSET_H

#include "Adt.h"
#include "Util.h"

namespace grafalgo {

typedef int bst;		// tree in collection
typedef uint64_t keytyp;

/** Data structure that represents a collection of "sorted sets".
 *  Items in the same set have distinct keys. Sets are represented
 *  by binary search trees, with items represented by tree nodes.
 *  Items (nodes) are identified by integers 1..n where n is specified
 *  when an object is constructed.
 */
class BstSet : public Adt {
public:
		BstSet(int=26);
		virtual ~BstSet();

	// pair of bsts, returned by split
	struct BstPair {
		bst t1, t2;
		BstPair(bst tt1, bst tt2) : t1(tt1), t2(tt2) {}
	};

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const BstSet&);

	keytyp	key(index) const;	
	bst	find(index) const;
	index	first(bst) const;	
	index	last(bst) const;	
	index	suc(index) const;	
	index	pred(index) const;	
	index	access(keytyp,bst&) const;

	void	setkey(index,keytyp);
	bool	insert(index,bst&);	
	void	remove(index,bst&);
	virtual bst join(bst,index,bst);	
	virtual BstSet::BstPair split(index,bst);	

	string& bst2string(bst, string&) const;
	string& toString(string&) const;
protected:
	struct BstNode {
	index left, right, p;	///< left child, right, parent
	keytyp 	kee;		///< key value
	};
	BstNode *node;

	void virtual swap(index,index);
	void virtual rotate(index);	
	void rotate2(index);	
	index 	sibling(index, index);
	index	remove(index);	

	virtual	string& node2string(index, string&) const;

	void	makeSpace(int);
	void	freeSpace();
};

/** Get the key of an item.
 *  @param i is the index of an item in a bst
 *  @return the key of i
 */
inline keytyp BstSet::key(index i) const { return node[i].kee; }

/** Set the key of an item.
 *  @param i is a singleton item
 *  @param k is the new key value to be assigned to i
 */
inline void BstSet::setkey(index i, keytyp k) {
	assert(node[i].left == 0 && node[i].right == 0 && node[i].p == 0);
	node[i].kee = k;
}

/** Get the sibling of a tree node.
 *  @param x is an item in a set (node in a BST)
 *  @param px is the parent of x in its tree
 *  @return the "other child" of px, or 0 if there is none
 */
index inline BstSet:: sibling(index x, index px) {
	return (x == node[px].left ? node[px].right : node[px].left);
}

} // ends namespace

#endif
