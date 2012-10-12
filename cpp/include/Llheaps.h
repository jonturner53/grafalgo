/** \file Llheaps.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LLHEAPS_H
#define LLHEAPS_H

#include "Lheaps.h"
#include "UiList.h"

typedef bool (*delftyp)(item);
typedef int lheap;

/** Lazy Collection of leftist heaps
 *  This version uses implicit deletion. That is, the user provides a
 *  pointer to a function that accepts a single item argument and returns
 *  true if that item has been removed from a heap. Deleted items should not
 *  be re-inserted into another heap.
 */
class Llheaps : public Lheaps {
public:		Llheaps(int=26,delftyp=NULL);
		~Llheaps();

	item	findmin(lheap);		
	lheap	lmeld(lheap,lheap);
	lheap	insert(item,lheap);

	lheap   makeheap(UiList&);

	string& toString(string&) const;
	string& heap2string(item,string&) const;
private:
	int	dummy;			///< head of free dummy node list
	delftyp	delf;			///< pointer to deleted function
	UiList	*tmpL;			///< pointer to temporary list
	void	purge(lheap,UiList&);
	lheap	heapify(UiList&);	
};
#endif
