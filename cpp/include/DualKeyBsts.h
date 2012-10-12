/** @file DualKeyBsts.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DKST_H
#define DKST_H

#include "SelfAdjBsts.h"

/** This class represents a collection of binary search trees in which
 *  nodes have two different keys. The first key is used to order the
 *  BST nodes in the usual way.
 */
class DualKeyBsts : public SelfAdjBsts {
public: 	DualKeyBsts(int);
		~DualKeyBsts();
	static	const int MAX2 = BIGINT-1;  ///< maximum allowed key2 value

	// access methods
	keytyp	key1(item);		   
	keytyp	key2(item);		  
	item	first(sset) const;	 
	item	next(item) const;	
	item	access(keytyp,sset);
	keytyp	min2(sset);		

	// modifiers
	void	setkey(item,keytyp,keytyp); 
	void	change2(keytyp,sset); 
	sset	insert(item,sset);
	sset	remove(item,sset);	  
	sset	join(sset,item,sset);	 
	setPair	split(item,sset);	

	// string representations
	virtual string& item2string(item, string&) const;
private:
	keytyp	*dmin;			// delta min value for key 2
	keytyp	*dkey;			// delta key value for key 2
	void	virtual rotate(item);
};

/** Set key values of a node
 *  @param i is an isolated node (that is, it's a single node BST)
 */
void inline DualKeyBsts::setkey(item i,keytyp k1,keytyp k2) {
	assert(0 <= i && i <= n && k2 <= MAX2);
	assert(node[i].p == 0 && node[i].left == 0 && node[i].right == 0);
	node[i].kee = k1; dmin[i] = k2; dkey[i] = 0;
}

/** Get the first key of a node.
 *  @param i is a node in a BST
 *  @return the value of the first key of i
 */
keytyp inline DualKeyBsts::key1(item i) {
	assert(1 <= i && i <= n);
	return node[i].kee;
}

/** Get the item in a given set (BST) that has the smallest key2 value.
 *  @param s is a canonical element of some set (root of the BST)
 *  @return the smallest key2 value for any element in the set
 */
keytyp inline DualKeyBsts::min2(sset s) {
	assert(1 <= s && s <= n);
	return dmin[s];
}

/** Change the key2 values of all items in a set.
 *  @param diff is a key value
 *  @param s is a canonical element of some set (root of the BST);
 *  the opertion adds diff to all the key2 values in s
 */
void inline DualKeyBsts::change2(keytyp diff, sset s) {
	assert(1 <= s && s <= n);
	dmin[s] += diff;
}

#endif
