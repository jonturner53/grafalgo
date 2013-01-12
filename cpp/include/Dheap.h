/** @file Dheap.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DHEAP_H
#define DHEAP_H

//#include "stdinc.h"
#include "Adt.h"

namespace grafalgo {

typedef int keytyp;

/** This class implements a heap data structure.
 *  The heap elements are identified by integers in 1..n where n
 *  is specified when an object is constructed.
 */
class Dheap : public Adt {
public:		Dheap(int,int);
		~Dheap();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Dheap&);

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

	string& toString(string&) const;
private:
	int 	d;			///< base of heap
	int	hn;			///< number of items in the heap

	index	*h;			///< {h[1],...,h[hn]} is set of items
	int	*pos;			///< pos[i] gives position of i in h
	keytyp	*kee;			///< kee[i] is key of item i

	index	minchild(index);		
	void	siftup(index,int);
	void	siftdown(index,int);

	void	makeSpace(int);
	void	freeSpace();
};

/** Find an item in the heap with the smallest key.
 *  @return the index of an item that has the smallest key
 */
inline int Dheap::findmin() const { return hn == 0 ? 0 : h[1]; }

/** Delete a minimum key item from the heap and return it.
 *  @return the index an item of minimum key from the heap, after deleting it
 *  from the heap
 */
inline int Dheap::deletemin() {
	if (hn == 0) return 0;
	index i = h[1]; remove(h[1]);
	return i;
}

/** Get the key of item.
 *  @param i is the index of an item in the heap
 *  @return the value of i's key
 */
inline keytyp Dheap::key(index i) const { return kee[i]; }

/** Determine if an item is in the heap.
 *  @param i is the index of an item in the heap
 *  @return true if i is in the heap, else false
 */
inline bool Dheap::member(index i) const { return pos[i] != 0; }

/** Determine if the heap is empty.
 *  @return true if heap is empty, else false
 */
inline bool Dheap::empty() const { return hn == 0; };

} // ends namespace

#endif
