/** \file Mheaps_ll.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LMHEAPS_L_H
#define LMHEAPS_L_H

#include "Mheaps_l.h"
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
class Mheaps_ll : public Mheaps_l {
public:		Mheaps_ll(int=26,delftyp=NULL);
		~Mheaps_ll();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Mheaps_ll&);

	index	findmin(lheap);		
	lheap	lmeld(lheap,lheap);
	lheap	insert(index,lheap);

	lheap   makeheap(List&);

	string  toString() const;
	string  heap2string(index) const;

private:
	int	dummy;			///< head of free dummy node list
	delftyp	delf;			///< pointer to deleted function
	List	*tmplst;		///< pointer to temporary list
	void	purge(lheap,List&);

	string  heap2string(index,bool) const;
	void	makeSpace();
	void	freeSpace();
};

/** Create a string representation of a single heap.
 *  @param h is the canonical element of some heap
 *  @param s is a reference to a string in which result is returned
 *  @return a reference to s
 */
inline string Mheaps_ll::heap2string(lheap h) const {
	return heap2string(h,true);
}

} // ends namespace

#endif
