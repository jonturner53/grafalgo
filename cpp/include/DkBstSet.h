/** @file DkBstSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DKBSTSET_H
#define DKBSTSET_H

#include "BalBstSet.h"

namespace grafalgo {

/** This class represents a collection of binary search trees in which
 *  nodes have two different keys. The first key is used to order the
 *  BST nodes in the usual way.
 */
class DkBstSet : public BalBstSet {
public: 	DkBstSet(int);
		~DkBstSet();
	static	const int MAX2 = Util::BIGINT32-1;  ///< max allowed key2 value

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const DkBstSet&);

	// access methods
	keytyp	key1(index);		   
	keytyp	key2(index);		  
	index	first(bst) const;	 
	index	next(index) const;	
	index	access(keytyp,bst);
	keytyp	min2(bst);		

	// modifiers
	void	setkey(index,keytyp,keytyp); 
	void	change2(keytyp,bst); 
	bst	insert(index,bst);
	bst	remove(index,bst);	  
	bst	join(bst,index,bst);	 
	BstPair	split(index,bst);	

private:
	keytyp	*dmin;			// delta min value for key 2
	keytyp	*dkey;			// delta key value for key 2
	void	virtual rotate(index);

	virtual string& node2string(index, string&) const;

	void	makeSpace(int);
	void	freeSpace();
};

/** Set key values of a node
 *  @param i is an isolated node (that is, it's a single node BST)
 */
void inline DkBstSet::setkey(index i, keytyp k1, keytyp k2) {
	assert(0 <= i && i <= n() && k2 <= MAX2);
	assert(node[i].p == 0 && node[i].left == 0 && node[i].right == 0);
	node[i].kee = k1; dmin[i] = k2; dkey[i] = 0;
}

/** Get the first key of a node.
 *  @param i is a node in a BST
 *  @return the value of the first key of i
 */
keytyp inline DkBstSet::key1(index i) {
	assert(1 <= i && i <= n());
	return node[i].kee;
}

/** Get the item in a given bst that has the smallest key2 value.
 *  @param s is a canonical element of some bst (root of the BST)
 *  @return the smallest key2 value for any element in the bst
 */
keytyp inline DkBstSet::min2(bst s) {
	assert(1 <= s && s <= n());
	return dmin[s];
}

/** Change the key2 values of all items in a bst.
 *  @param diff is a key value
 *  @param s is a canonical element of some bst (root of the BST);
 *  the opertion adds diff to all the key2 values in s
 */
void inline DkBstSet::change2(keytyp diff, bst s) {
	assert(1 <= s && s <= n());
	dmin[s] += diff;
}

} // ends namespace

#endif
