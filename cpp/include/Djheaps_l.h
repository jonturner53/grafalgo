/** @file Djheaps_l.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DJHEAPS_L_H
#define DJHEAPS_L_H

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
class Djheaps_l : public Adt {
public:		Djheaps_l(int=100);
		~Djheaps_l();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Djheaps_l&);

	keytyp	key(index) const;		
	void	setkey(index,keytyp);	

	lheap	findmin(lheap) const;
	lheap	meld(lheap,lheap);
	lheap	insert(index,lheap);
	index	deletemin(lheap);	
	lheap	heapify(List&);	

	string 	toString() const;
	string 	heap2string(lheap) const;

protected:
	struct hnode {
	keytyp	kee;		///< kee[i] = key of item i
	int	rank;		///< rank[i] = rank of item i
	int	left;		///< left[i] = left child of i
	int	right;		///< right[i] = right child of i
	} *node;

	string 	heap2string(lheap, bool) const;
	void	makeSpace();
	void	freeSpace();
};

/** Get the key of an item.
 *  @param i is an item in a heap
 *  @return the key of i
 */
inline keytyp Djheaps_l::key(index i) const { return node[i].kee; };
	
/** Set the key of an item.
 *  @param i is an item in a heap
 *  @param k is a new key value for i
 */
inline void Djheaps_l::setkey(index i,keytyp k) { node[i].kee = k; };

/** Get the item with the smallest key in a heap.
 *  @param h is the canonical element of some heap
 *  @return the index of the item in h with the smallest key
 */
inline lheap Djheaps_l::findmin(lheap h) const { return h; };

/** Create a string representation of a single heap.
 *  @param h is the canonical element of some heap
 *  @param s is a reference to a string in which result is returned
 *  @return s
 */
inline string Djheaps_l::heap2string(lheap h) const {
	return heap2string(h,true);
}

} // ends namespace

#endif
