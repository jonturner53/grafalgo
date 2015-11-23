/** @file DkSsets.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DKSSETS_H
#define DKSSETS_H

#include "Ssets_rbt.h"

namespace grafalgo {

/** This class represents a collection of binary search trees in which
 *  nodes have two different keys. The first key is used to order the
 *  BST nodes in the usual way.
 *
 *  Note: implementation not yet complete
 */
class DkSsets : public Ssets_rbt {
public: 	DkSsets(int);
		~DkSsets();
	static	const int MAX2 = INT_MAX-1;  ///< max allowed key2 value

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const DkSsets&);

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
	void	change2(keytyp,index,bst); 
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
 *  @param i is the index of an isolated node (that is, a single node bst)
 */
void inline DkSsets::setkey(index i, keytyp k1, keytyp k2) {
	assert(0 <= i && i <= n() && k2 <= MAX2);
	assert(node[i].p == 0 && node[i].left == 0 && node[i].right == 0);
	node[i].kee = k1; dmin[i] = k2; dkey[i] = 0;
}

/** Get the first key of a node.
 *  @param i is the index of a node in a BST
 *  @return the value of the first key of i
 */
keytyp inline DkSsets::key1(index i) {
	assert(1 <= i && i <= n());
	return node[i].kee;
}

/** Get the item in a given bst that has the smallest key2 value.
 *  @param t is a canonical element of some bst (root of the BST)
 *  @return the smallest key2 value for any element in the bst
 */
keytyp inline DkSsets::min2(bst t) {
	assert(1 <= t && t <= n());
	return dmin[t];
}

/** Change the key2 values of all items in a bst.
 *  @param diff is a key value; the operation adds diff to all the
 *  key2 values of the specified bst
 *  @param t is the index for the root of the bst whose key2 values are
 *  to be changed
 */
void inline DkSsets::change2(keytyp diff, bst t) {
	assert(1 <= t && t <= n());
	dmin[t] += diff;
}

} // ends namespace

#endif
