/** \file Dheaps.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DHEAPS_H
#define DHEAPS_H

#include <list>
#include "stdinc.h"
#include "Adt.h"

namespace grafalgo {

/** This class implements a collection of heaps.
 *  Items to be stored in the heap are identified by indexes.
 *  Heaps are also identified by a distinct range of index values.
 *  Each item may be stored in at most one heap.
 *  The key type is a template parameter. Types used for keys
 *  must define assignment and comparison operators, and
 *  must be "printable" using stringstream (standard numeric types
 *  all work, as do most grafalgo data structures).
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
 *  node has a child "pointer" that identifes the node
 *  containing its children in the tree that forms the heap.
 *  Each node also has a parent "pointer" that points to the
 *  position of the parent item in the parent node
 *  
 *  Each node also has a predecessor "pointer" that points to
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
template<class K> class Dheaps : public Adt {
public:		Dheaps(int=50,int=4,int=8);
		~Dheaps();

	// common methods
	void	init();
	void	resize(int,int);
	void	resize(int size) { resize(size,size); }
	void	expand(int,int);
	void	expand(int size) { expand(size,max(size,maxHeap)); }
	void	copyFrom(const Dheaps&);

	// access methods
	index	findMin(int) const;
	const K& getKey(index) const;
	int	heapSize(int) const;

	// predicates 
	bool	empty(int) const;	

	// modifiers 
	bool	insert(index, const K&, int);
	index 	deleteMin(int);
	void	changeKeyMin(const K&, int);
	void	clear();

	string  toString(int) const;
	string  toString() const;
private:
	int	maxHeap;		///< max number of heaps
	int	d;			///< base of heap
	int	numNodes;		///< total number of nodes

	index	*heaps;			///< holds all items
	K	*key;			///< key[i] is key of item i

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

	void	makeSpace();
	void	freeSpace();
};

/** Constructor for Dheaps.
 *  @param size is the maximum index of any item
 *  @param maxHeap1 is the maximum heap number
 */
template<class K>
Dheaps<K>::Dheaps(int size, int maxh, int dd) :
		   Adt(size), maxHeap(maxh), d(dd) { makeSpace(); init(); }

/** Destructor for Dheaps. */
template<class K>
Dheaps<K>::~Dheaps() { freeSpace(); }

/** Allocate and initialize space for Dheaps.
 *  @param size is number of index values to provide space for
 */
template<class K>
void Dheaps<K>::makeSpace() {
	numNodes = (n()/d) + maxHeap;
	heaps = new index[numNodes*d]; // each d-word block is a "node"
	child = new int[numNodes*d];    // each item in heaps has child
					// node
	parent = new int[numNodes];   	// note, one per node
	pred = new int[numNodes];     	// ditto

	key = new K[n()+1];

	root = new index[maxHeap+1];	// values are indices in
					// heaps array
	bot = new index[maxHeap+1];	// ditto
	hSize = new int[maxHeap+1];
}

/** Free dynamic storage used by Dheaps. */
template<class K>
void Dheaps<K>::freeSpace() { 
	delete [] heaps; delete [] child; delete [] parent;
	delete [] pred; delete [] key; delete [] root;
	delete [] bot; delete [] hSize;
}

/** Copy into Dheaps .
 *  @param src is another Dheaps object to be copied to this object.
 */
template<class K>
void Dheaps<K>::copyFrom(const Dheaps& src) {
	Util::fatal("Dheaps::copyFrom not implemented.");
}

/** Resize a Dheaps object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 *  @param maxh is the maximum number of heaps in the new object
 */
template<class K>
void Dheaps<K>::resize(int size, int maxh) {
	freeSpace(); Adt::resize(size); maxHeap = maxh; makeSpace(); init();
}

/** Expand the space available for this Heap_d.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
template<class K>
void Dheaps<K>::expand(int size, int maxh) {
	if (size <= n() && maxh <= maxHeap) return;
	Dheaps old(n(),maxHeap,d); old.copyFrom(*this);
	resize(size,maxh); this->copyFrom(old);
}

/** Initialize all the heaps. */
template<class K>
void Dheaps<K>::init() {
	for (index h = 1; h <= maxHeap; h++) hSize[h] = 0;
	for (int p = 0; p < numNodes*d; p++) heaps[p] = 0;

	// build free list using "parent pointer" of each "node"
	for (int i = 0; i < numNodes-1; i++)
		parent[i] = (i+1)*d;
	parent[numNodes-1] = -1; // use -1 to mark end of list
	free = 0;
}

/** Remove all elements from all heaps. */
template<class K>
void Dheaps<K>::clear() {
	for (index h = 1; h <= maxHeap; h++) 
		while (hSize[h] > 0) deleteMin(h);
}

/** Add an item to a heap.
 *  @param i is the number of the item to be added
 *  @param k is the key for the item being inserted
 *  @param h is the number of the heap in which i is to be inserted
 *  @return true on success, false on failure
 */
template<class K>
bool Dheaps<K>::insert(index i, const K& k, index h) {
	key[i] = k;
	if (i == 0) return false;
	int n = hSize[h]; int r = (n-1)%d;
	if (n != 0 && r != d-1) {
		// no new node required
		int p = bot[h] + r + 1;
		child[p] = -1;
		(hSize[h])++;
		siftup(i,p);
		return true;
	}
	// allocate new node
	if (free < 0) return false;
	int p = free; free = parent[free/d];
	heaps[p] = i; child[p] = -1;
	(hSize[h])++;
	//for (int j = 1; j < d; j++) heaps[p+j] = 0;
	if (n == 0) {
		root[h] = bot[h] = p;
		pred[p/d] = parent[p/d] = -1;
		return true;
	}
	pred[p/d] = bot[h]; bot[h] = p;

	// now, find the parent node, and set child and parent pointers
	int q = pred[p/d] + (d-1);
	while (parent[q/d] >= 0  && q%d == d-1)
		q = parent[q/d];
	q = ((q%d != d-1) ? q+1 : q - (d-1));
	while (child[q] != -1) q = child[q];
	child[q] = p; parent[p/d] = q;

	siftup(i,p);
	return true;
}

/** Delete and return item with smallest key.
 *  @param h is an index identifying a heap.
 *  @return the index of the item with the smallest key in h after
 *  removing the index from h.
 */
template<class K>
int Dheaps<K>::deleteMin(index h) {
        int hn = hSize[h];
        if (hn == 0) return 0;
        int i, p;
        if (hn == 1) {
                p = root[h]; i = heaps[p]; heaps[p] = 0;
                parent[p/d] = free; free = p;
                hSize[h] = 0;
                return i;
        }

        p = nodeMinPos(root[h]); i = heaps[p];
        if (hn <= d) { // single node with at least 2 items
                heaps[p] = heaps[root[h]+(--hn)];
		heaps[root[h]+hn] = 0;
		hSize[h] = hn;
                return i;
        }

        // so, must be at least two nodes
        int q = bot[h]; int r = (hn-1)%d;
        int j = heaps[q+r]; heaps[q+r] = 0;
        (hSize[h])--;
        if (r == 0) { // return last node to free list
		if (parent[q/d] >= 0) child[parent[q/d]] = -1;
		bot[h] = pred[q/d];
                parent[q/d] = free; free = q;
        }

        // sift the last item down from the top
        siftdown(j, p);
        return i;
}

/** Shift an item up the heap to restore heap order.
 *  @param i is the index of item to be shifted up the heap
 *  @param p is the position from which i is to be shifted up
 */
template<class K>
void Dheaps<K>::siftup(index i, int p) {
	int pp = parent[p/d];
	while (pp >= 0 && key[heaps[pp]] > key[i]) {
		heaps[p] = heaps[pp]; p = pp; pp = parent[pp/d];
	}
	heaps[p] = i;
}

/** Shift an item down the heap to restore heap order.
 *  @param i is the index of item to be shifted down the heap
 *  @param p is the position from which i is to be shifted down
 */
template<class K>
void Dheaps<K>::siftdown(index i, int p) {
	int cp = nodeMinPos(child[p]);
	while (cp >= 0 && key[heaps[cp]] < key[i]) {
		heaps[p] = heaps[cp]; p = cp;
		cp = nodeMinPos(child[cp]);
	}
	heaps[p] = i;
}

/** Change the key of the min item in a heap.
 *  @param k is the new key value to be assigned
 *  @param h is the index of the heap whose min key value is to
 *  be adjusted
 */
template<class K>
void Dheaps<K>::changeKeyMin(const K& k, index h) {
	int p = nodeMinPos(root[h]);
	index i = heaps[p]; key[i] = k;
	siftdown(i,p);
}

/** Create a human-readable representation of the Dheaps object.
 *  @return the string representing the object
 */ 
template<class K>
string Dheaps<K>::toString() const {
	string s;
	for (index h = 1; h <= maxHeap; h++) {
		if (!empty(h)) s += toString(h) + "\n";
	}
	return s;
}

/** Create a human-readable representation of a single heap.
 *  @return the string representing the heap
 */ 
template<class K>
string Dheaps<K>::toString(index h) const {
	if (hSize[h] == 0) return "[]";

	list<int> nodeList;
	for (int p = bot[h]; p != -1; p = pred[p/d])
		nodeList.push_front(p);
	int cnt = 0; int numPerRow = 1;
	stringstream ss;
	for (int p : nodeList) {
		int q = p;
		ss << "[";
		while (q < p+d && heaps[q] != 0) {
			if (q > p) ss << " ";
			index i = heaps[q++];
			ss << i << ":" << key[i];
		}
		ss << "] ";
		if (++cnt == numPerRow) {
			ss << "\n"; cnt = 0; numPerRow *= d;
		}
	}
	if (cnt != 0) ss << "\n";
	return ss.str();
}

/** Find the position of the item with the smallest key in a node.
 *  @param p is the position of the first item in some node
 *  @return the position of the item with the smallest key in p's node;
 *  if there is no valid item at position p, return -1
 */ 
template<class K>
inline int Dheaps<K>::nodeMinPos(int p) const {
	if (p == -1 || heaps[p] == 0) return -1;
	int minPos = p;
	for (int q = p+1; q < p+d && heaps[q] != 0; q++)
		if (key[heaps[q]] < key[heaps[minPos]])
			minPos = q;
	return minPos;
}

/** Return item at top of heap
 *  @param h is the index of some heap
 *  @return the item at the top of h or 0 if h is empty
 */
template<class K>
inline int Dheaps<K>::findMin(index h) const {
	if (hSize[h] == 0) return 0;
	int p = nodeMinPos(root[h]);
	return (p < 0 ? 0 : heaps[p]);
}

/** Return the key of an item in the heap.
 *  @param i is the index of an item
 *  @return the key for item i
 */
template<class K>
inline const K& Dheaps<K>::getKey(index i) const { return key[i]; }

/** Determine if a heap is empty.
 *  @param h is the index of a heap
 *  @return true if h is empty
 */
template<class K>
inline bool Dheaps<K>::empty(index h) const { return hSize[h] == 0; };

/** Return the size of a heap.
 *  @param h is the index of a heap
 *  @return the number of items in h
 */
template<class K>
inline int Dheaps<K>::heapSize(index h) const { return hSize[h]; };

} // ends namespace

#endif
