/** @file Fheaps.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef FHEAPS_H
#define FHEAPS_H

#include "stdinc.h"
#include "Util.h"
#include "UiList.h"
#include "UiClist.h"

typedef int keytyp;
typedef int fheap;
typedef int item;
const int MAXRANK = 32;

/** The Fheaps class represents a collection of Fibonacci heaps.
 *  The heaps are defined over nodes numbered 1..n where n is specified
 *  when the object is constructed. Each node is in one heap at a time.
 */
class Fheaps {
public:		Fheaps(int=26);
		~Fheaps();
	keytyp	key(item) const;		
	fheap	findmin(fheap) const;	
	fheap	meld(fheap,fheap);
	fheap	decreasekey(item,keytyp,fheap);
	fheap	deletemin(fheap);	
	fheap	insert(item,fheap,keytyp);
	fheap	remove(item, fheap);	
	string& toString(string&) const;
	string& heap2string(fheap,string&) const;
private:
	int	n;			///< heaps defined on nodes 1..n
	struct fnode {			///< node object
	keytyp	kee;			///< key values
	int	rank;			///< rank values
	bool	mark;			///< marks
	fheap	p, c;			///< parent and child pointers
	};
 	fnode	*node;			///< node[u] contains fields for node u
	UiClist	*sibs;			///< collection of sibling lists
	int	rvec[MAXRANK+1];	///< temporary vector of ranks
	UiList	*tmpq;			///< temporary queue used
};

/** Get the key of an item in a heap.
 *  @param i is an item in some heap
 *  @return the key of i
 */
inline keytyp Fheaps::key(item i) const { return node[i].kee; };
	
/** Find the item with smallest key in a heap.
 *  @param h is the canonical element of some heap
 *  @return the item in h that has the smallest key
 */
inline fheap Fheaps::findmin(fheap h) const { return h; };

#endif
