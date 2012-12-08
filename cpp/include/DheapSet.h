/** \file DheapSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DHEAPSET_H
#define DHEAPSET_H

#include <list>
#include "stdinc.h"
#include "Adt.h"

namespace grafalgo {

typedef int keytyp;

/** This class implements a collection of heaps.
 *  Items to be stored in the heap are identified by indexes.
 *  Heaps are also identified by a distinct range of index values.
 *  Each item may be stored in at most one heap.
 *  Keys are 64 bit unsigned ints.
 *
 *  Heaps are implemented using a variant of the d-heap.
 *  We could not directly adopt the usual dheap implementation,
 *  since heaps must be able to grow and shrink independently of
 *  other heaps.
 *
 *  Implementation notes
 *  
 *  Heaps are constructed from logical nodes of size d.
 *  Each node contains up to d items, and each item in a
 *  node has a child pointer that identifes the node
 *  containing its children in the tree that forms the heap.
 *  Each node also has a parent pointer that points to the
 *  position of the parent item in the parent node
 *  
 *  Each node also a predecessor pointer that points to
 *  the preceding node in its heap in the breadth-first
 *  ordering of the nodes. This pointer is used when
 *  adding and removing nodes from a heap.
 *  
 *  The heaps array is organized into sub-arrays of size d.
 *  Each subarry contains the items in one node.
 *  The child array is organized similarly; that is, if an
 *  item is stored at position p in the heaps array, its
 *  child pointer is stored at position p in the child array.
 *  
 *  All "pointers" are actually integers that refer to positions
 *  in the heaps array. Most of these pointers refer to the first
 *  position in a node, and so are divisible by d. The one exception
 *  is the parent pointers. These may refer to any position within
 *  a node.
 *  
 *  Each heap has a root pointer that identifies the node at
 *  the root of its tree. It also has a bot pointer that identifies
 *  the last node in its tree (in breadth-first order).
 *  The number of nodes in each heap is stored in the hSize array.
 *  The hSize values are relied upon to deal with boundary
 *  cases like empty heaps. The values of the root and bot pointers
 *  of an empty heap are undefined.
 */
class DheapSet : public Adt {
public:		DheapSet(int,int,int=8);
		~DheapSet();

	// common methods
	void	clear();
	void	resize(int,int,int=8);
	void	resize(int size) { resize(size,size,8); }
	void	expand(int,int,int=8);
	void	expand(int size) { expand(size,max(size,maxHeap),d); }
	void	copyFrom(const DheapSet&);

	// access methods
	index	findMin(int) const;
	keytyp	getKey(index) const;
	int	heapSize(int) const;

	// predicates 
	bool	empty(int);	

	// modifiers 
	bool	insert(index, keytyp, int);
	index 	deleteMin(int);
	void	changeKeyMin(keytyp, int);

	string& toString(int, string&) const;
	string& toString(string&) const;
private:
	int	maxHeap;		///< max number of heaps
	int	d = 8;			///< base of heap
	int	numNodes;		///< total number of nodes

	index	*heaps;			///< holds all items
	keytyp	*key;			///< key[i] is key of item i

	int	*root;			///< root[h] is position of heap h root
	int	*bot;			///< bot[h] is position of "bottom" node
	int	*hSize;			///< hSize[h] is # of items in heap h
	
	int	*child;			///< child[p] points to first child of p
	int	*parent;		///< parent[p/d] points to parent of p
	int	*pred;			///< pred[p/d] is predecessor of p
	
	int	free;			///< start of free node list

	index	nodeMinPos(int) const;	///< position of smallest item in node
	void	siftup(index,int);	///< move item up to restore heap order
	void	siftdown(index,int);	///< move down to restore heap order

	void	makeSpace(int,int,int=8);
	void	freeSpace();
};

inline int DheapSet::nodeMinPos(int p) const {
	if (p == -1 || heaps[p] == 0) return -1;
	int minPos = p;
	for (int q = p+1; q < p+d && heaps[q] != 0; q++)
		if (key[heaps[q]] < key[heaps[minPos]])
			minPos = q;
	return minPos;
}

// Return item at top of heap
inline int DheapSet::findMin(int h) const {
	if (hSize[h] == 0) return 0;
	int p = nodeMinPos(root[h]);
	return (p < 0 ? 0 : heaps[p]);
}

// Return key of i.
inline keytyp DheapSet::getKey(index i) const { return key[i]; }

// Return true if heap is empty, else false.
inline bool DheapSet::empty(int h) { return hSize[h] == 0; };

// Return the size of a heap.
inline int DheapSet::heapSize(int h) const { return hSize[h]; };

} // ends namespace

#endif
