/** @file Ssets.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef SSETS_H
#define SSETS_H

#include "Adt.h"
#include "Util.h"

namespace grafalgo {

typedef int bst;		// tree in collection
typedef uint64_t keytyp;

/** Data structure that represents a collection of binary search trees.
 *  Each search tree represents a "sorted set" and these sets partition
 *  the underlying index set. Each tree node corresponds to an item in
 *  some set and is identified by an index value. Items in the same set
 *  have distinct key values.
 */
class Ssets : public Adt {
public:
		Ssets(int=26);
		virtual ~Ssets();

	// pair of bsts, returned by split
	struct BstPair {
		bst t1, t2;
		BstPair(bst tt1, bst tt2) : t1(tt1), t2(tt2) {}
	};

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Ssets&);

	keytyp	key(index) const;	
	bst	find(index) const;
	index	first(bst) const;	
	index	last(bst) const;	
	index	next(index) const;	
	index	prev(index) const;	
	index	access(keytyp,bst&) const;

	void	setkey(index,keytyp);
	bool	insert(index,bst&);	
	void	remove(index,bst&);
	virtual bst join(bst,index,bst);	
	virtual Ssets::BstPair split(index,bst);	

	string	bst2string(bst) const;
	string	toString() const;
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

	virtual	string node2string(index) const;

	void	makeSpace();
	void	freeSpace();
};

/** Get the key of an item.
 *  @param i is the index of an item in a bst
 *  @return the key of i
 */
inline keytyp Ssets::key(index i) const { return node[i].kee; }

/** Set the key of an item.
 *  @param i is a singleton item
 *  @param k is the new key value to be assigned to i
 */
inline void Ssets::setkey(index i, keytyp k) {
	assert(node[i].left == 0 && node[i].right == 0 && node[i].p == 0);
	node[i].kee = k;
}

/** Get the sibling of a tree node.
 *  @param x is an item in a set (node in a BST)
 *  @param px is the parent of x in its tree
 *  @return the "other child" of px, or 0 if there is none
 */
index inline Ssets:: sibling(index x, index px) {
	return (x == node[px].left ? node[px].right : node[px].left);
}

} // ends namespace

#endif
