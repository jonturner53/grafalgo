/** \file LlheapSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LLHEAPSET_H
#define LLHEAPSET_H

#include "LheapSet.h"
#include "List.h"

namespace grafalgo {

typedef bool (*delftyp)(index);
typedef int lheap;

/** Lazy Collection of leftist heaps
 *  This version uses implicit deletion. That is, the user provides a
 *  pointer to a function that accepts a single item argument and returns
 *  true if that item has been removed from a heap. Deleted items should not
 *  be re-inserted into another heap.
 */
class LlheapSet : public LheapSet {
public:		LlheapSet(int=26,delftyp=NULL);
		~LlheapSet();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const LlheapSet&);

	index	findmin(lheap);		
	lheap	lmeld(lheap,lheap);
	lheap	insert(index,lheap);

	lheap   makeheap(List&);

	string& toString(string&) const;
	string& heap2string(index,string&) const;
private:
	int	dummy;			///< head of free dummy node list
	delftyp	delf;			///< pointer to deleted function
	List	*tmplst;		///< pointer to temporary list
	void	purge(lheap,List&);
	lheap	heapify(List&);	

	void	makeSpace(int);
	void	freeSpace();
};

} // ends namespace

#endif
