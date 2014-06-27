/** @file DiffHeap.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DIFFHEAP_H
#define DIFFHEAP_H

#include "Adt.h"

namespace grafalgo {

typedef int keytyp;

/** This class implements a heap data structure.
 *  The heap elements are identified by index values in 1..n where n
 *  is specified when an object is constructed. This version uses a
 *  differential representation of the keys. This allows it to
 *  implement a constant time addtokeys() operation.
 */
class DiffHeap : public Adt {
public:		DiffHeap(int,int);
		~DiffHeap();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const DiffHeap&);

	// access methods
	index	findmin() const;
	keytyp	key(index) const;

	// predicates
	bool	member(index) const;
	bool	empty() const;	

	// modifiers
	void	insert(index,keytyp);
	void	remove(index);
	index 	deletemin();
	void	changekey(index,keytyp);	
	void	addtokeys(keytyp);

	// stats methods
	void	clearStats();
	string& stats2string(string&) const;

	string& toString(string&) const;
private:
	int	hn;			///< number of items in the heap

	index	*h;			///< {h[1],...,h[hn]} is set of items
	int	*pos;			///< pos[i] gives position of i in h
	keytyp	*dkey;			///< dkey[i] is delta-key of item i

	index	minchild(index);		
	void	siftup(index,int);
	void	siftdown(index,int);

	void	makeSpace(int);
	void	freeSpace();
};

/** Find an item in the heap with the smallest key.
 *  @return the index of an item that has the smallest key
 */
inline int DiffHeap::findmin() const { return hn == 0 ? 0 : h[1]; }

/** Delete a minimum key item from the heap and return it.
 *  @return the index an item of minimum key from the heap, after deleting it
 *  from the heap
 */
inline int DiffHeap::deletemin() {
	if (hn == 0) return 0;
	index i = h[1]; remove(h[1]);
	return i;
}

/** Determine if an item is in the heap.
 *  @param i is the index of an item in the heap
 *  @return true if i is in the heap, else false
 */
inline bool DiffHeap::member(index i) const { return pos[i] != 0; }

/** Determine if the heap is empty.
 *  @return true if heap is empty, else false
 */
inline bool DiffHeap::empty() const { return hn == 0; };

} // ends namespace

#endif
