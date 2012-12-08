/** @file LheapSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LHEAPSET_H
#define LHEAPSET_H

#include "Adt.h"
#include "Util.h"
#include "List.h"

namespace grafalgo {

typedef int keytyp;
typedef int lheap;

/** Data structure that represents a collection of leftist heaps.
 *  Heaps are defined on items (nodes) numbered 1..n, where n is
 *  specified at the time an object is constructed.
 *  Leftist heaps can be efficiently "melded"
 */
class LheapSet : public Adt {
public:		LheapSet(int=100);
		~LheapSet();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const LheapSet&);

	keytyp	key(index) const;		
	void	setkey(index,keytyp);	

	lheap	findmin(lheap) const;
	lheap	meld(lheap,lheap);
	lheap	insert(index,lheap);
	index	deletemin(lheap);	

	string&	toString(string&) const;
	string&	heap2string(lheap, string&) const;
protected:
	struct hnode {
	keytyp	kee;		///< kee[i] = key of item i
	int	rank;		///< rank[i] = rank of item i
	int	left;		///< left[i] = left child of i
	int	right;		///< right[i] = right child of i
	} *node;

	void	makeSpace(int);
	void	freeSpace();
};

/** Get the key of an item.
 *  @param i is an item in a heap
 *  @return the key of i
 */
inline keytyp LheapSet::key(index i) const { return node[i].kee; };
	
/** Set the key of an item.
 *  @param i is an item in a heap
 *  @param k is a new key value for i
 */
inline void LheapSet::setkey(index i,keytyp k) { node[i].kee = k; };

/** Get the item with the smallest key in a heap.
 *  @param h is the canonical element of some heap
 *  @return the index of the item in h with the smallest key
 */
inline lheap LheapSet::findmin(lheap h) const { return h; };

} // ends namespace

#endif
