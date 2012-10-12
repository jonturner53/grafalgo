/** @file Dheap.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DHEAP_H
#define DHEAP_H

#include "stdinc.h"
#include "Util.h"

typedef int keytyp;
typedef int item;

/** This class implements a heap data structure.
 *  The heap elements are identified by integers in 1..n where n
 *  is specified when an object is constructed.
 */
class Dheap {
public:		Dheap(int,int);
		~Dheap();

	// access methods
	item	findmin();
	keytyp	key(item);

	// predicates
	bool	member(item);
	bool	empty();	

	// modifiers
	void	insert(item,keytyp);
	void	remove(item);
	item 	deletemin();
	void	changekey(item,keytyp);	

	// stats methods
	void	clearStats();
	string& stats2string(string&) const;

	string& toString(string&) const;
private:
	int 	D;			///< base of heap
	int	N;			///< max number of items in heap
	int	n;			///< number of items in heap

	item	*h;			///< {h[1],...,h[n]} is set of items
	int	*pos;			///< pos[i] gives position of i in h
	keytyp	*kee;			///< kee[i] is key of item i

	// statistics counters
	int	changekeyCount;
	int	siftupCount;
	int	siftdownCount;

	item	minchild(item);		
	void	siftup(item,int);
	void	siftdown(item,int);
};

/** Find an item in the heap with the smallest key.
 *  @return the number of an item that has the smallest key
 */
inline int Dheap::findmin() { return n == 0 ? 0 : h[1]; }

/** Delete a minimum key item from the heap and return it.
 *  @return an item of minimum key from the heap, after deleting it
 *  from the heap
 */
inline int Dheap::deletemin() {
	if (n == 0) return 0;
	item i = h[1]; remove(h[1]);
	return i;
}

/** Get the key of item.
 *  @param i is an item in the heap
 *  @return the value of i's key
 */
inline keytyp Dheap::key(item i) { return kee[i]; }

/** Determine if an item is in the heap.
 *  @param i is an item numbetr
 *  @return true if i is in the heap, else false
 */
inline bool Dheap::member(item i) { return pos[i] != 0; }

/** Determine if the heap is empty.
 *  @return true if heap is empty, else false
 */
inline bool Dheap::empty() { return n == 0; };

#endif
