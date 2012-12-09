/** @file FheapSet.h
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
#include "ClistSet.h"

namespace grafalgo {

typedef int keytyp;
typedef int fheap;

/** The FheapSet class represents a collection of Fibonacci heaps.
 *  The heaps are defined over nodes numbered 1..n where n is specified
 *  when the object is constructed. Each node is in one heap at a time.
 */
class FheapSet : public Adt {
public:		FheapSet(int=26);
		~FheapSet();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const FheapSet&);

	keytyp	key(index) const;		
	fheap	findmin(fheap) const;	
	fheap	meld(fheap,fheap);
	fheap	decreasekey(index,keytyp,fheap);
	fheap	deletemin(fheap);	
	fheap	insert(index,fheap,keytyp);
	fheap	remove(index, fheap);	

	string& toString(string&) const;
	string& heap2string(fheap,string&) const;
private:
	static const int MAXRANK = 32;
	struct Fnode {			///< node object
	keytyp	kee;			///< key values
	int	rank;			///< rank values
	bool	mark;			///< marks
	fheap	p, c;			///< parent and child pointers
	};
 	Fnode	*node;			///< node[u] contains fields for node u
	ClistSet *sibs;			///< collection of sibling lists
	int	rvec[MAXRANK+1];	///< temporary vector of ranks
	List	*tmpq;			///< temporary queue used

	void	makeSpace(int);
	void	freeSpace();
};

/** Get the key of an item in a heap.
 *  @param i is the index of an item in some heap
 *  @return the key of i
 */
inline keytyp FheapSet::key(index i) const { return node[i].kee; };
	
/** Find the item with smallest key in a heap.
 *  @param h is the canonical element of some heap
 *  @return the the index of item in h that has the smallest key
 */
inline fheap FheapSet::findmin(fheap h) const { return h; };

} // ends namespace

#endif
