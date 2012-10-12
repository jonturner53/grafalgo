/** @file Lheaps.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LHEAPS_H
#define LHEAPS_H

#include "stdinc.h"
#include "Util.h"
#include "UiList.h"

typedef int keytyp;
typedef int lheap;
typedef int item;

/** Data structure that represents a collection of leftist heaps.
 *  Heaps are defined on items (nodes) numbered 1..n, where n is
 *  specified at the time an object is constructed.
 *  Leftist heaps can be efficiently "melded"
 */
class Lheaps {
public:		Lheaps(int=100);
		~Lheaps();

	keytyp	key(item) const;		
	void	setkey(item,keytyp);	

	lheap	findmin(lheap) const;
	lheap	meld(lheap,lheap);
	lheap	insert(item,lheap);
	item	deletemin(lheap);	

	string&	toString(string&) const;
	string&	heap2string(lheap, string&) const;
protected:
	int	n;		///< items define on {1,...,n}
	struct hnode {
	keytyp	kee;		///< kee[i] = key of fitem i
	int	rank;		///< rank[i] = rank of item i
	int	left;		///< left[i] = left child of i
	int	right;		///< right[i] = right child of i
	} *node;

};

/** Get the key of an item.
 *  @param i is an item in a heap
 *  @return the key of i
 */
inline keytyp Lheaps::key(item i) const { return node[i].kee; };
	
/** Set the key of an item.
 *  @param i is an item in a heap
 *  @param k is a new key value for i
 */
inline void Lheaps::setkey(item i,keytyp k) { node[i].kee = k; };

/** Get the item with the smallest key in a heap.
 *  @param h is the canonical element of some heap
 *  @return the number of the item in h with the smallest key
 */
// Find and return the smallest item in s.
inline lheap Lheaps::findmin(lheap h) const { return h; };

#endif
