/** @file Djheaps_f.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef FHEAPS_H
#define FHEAPS_H

#include "stdinc.h"
#include "Adt.h"
#include "Util.h"
#include "List.h"
#include "Djsets_cl.h"

namespace grafalgo {

typedef int keytyp;
typedef index fheap;

/** The Djheaps_f class represents a collection of Fibonacci heaps.
 *  The heaps are defined over nodes numbered 1..n where n is specified
 *  when the object is constructed. Each node is in one heap at a time.
 */
class Djheaps_f : public Adt {
public:		Djheaps_f(int=26);
		~Djheaps_f();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Djheaps_f&);

	keytyp	key(index) const;		
	void	setKey(index,keytyp);
	fheap	findmin(fheap) const;	
	fheap	meld(fheap,fheap);
	fheap	decreasekey(index,keytyp,fheap);
	fheap	deletemin(fheap);	
	fheap	insert(index,fheap);
	fheap	insert(index,fheap,keytyp);
	fheap	remove(index,fheap);	
	fheap	makeheap(const List&);

	string  toString() const;
	virtual string heap2string(fheap) const;

protected:
	static const int MAXRANK = 32;
	struct Fnode {			///< node object
	keytyp	kee;			///< key values
	int	rank;			///< rank values
	bool	mark;			///< marks
	fheap	p, c;			///< parent and child pointers
	};
 	Fnode	*node;			///< node[u] contains fields for node u
	Djsets_cl *sibs;			///< collection of sibling lists
	int	rvec[MAXRANK+1];	///< temporary vector of ranks
	List	*tmpq;			///< temporary queue

	// internal helper methods
	void	makeSpace();
	void	freeSpace();
	fheap	mergeRoots(fheap);
};

/** Get the key of an item in a heap.
 *  @param i is the index of an item in some heap
 *  @return the key of i
 */
inline keytyp Djheaps_f::key(index i) const { return node[i].kee; }

/** Set the key of a singleton item.
 *  @param i is the index of a singleton item.
 *  @return the key of i
 */
inline void Djheaps_f::setKey(index i, keytyp k) {
	assert(sibs->next(i) == i && node[i].p == 0 && node[i].c == 0);
	node[i].kee = k;
}

/** Insert an item into a heap.
 *  @param i is the index of a singleton item.
 *  @return the key of i
 */
inline fheap Djheaps_f::insert(index i, fheap h) { return meld(i,h); }
	
/** Find the item with smallest key in a heap.
 *  @param h is the canonical element of some heap
 *  @return the the index of item in h that has the smallest key
 */
inline fheap Djheaps_f::findmin(fheap h) const { return h; }

} // ends namespace

#endif
