/** @file DheapSet.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "DheapSet.h"

namespace grafalgo {

/** Constructor for DheapSet.
 *  @param size is the maximum index of any item
 *  @param maxHeap1 is the maximum heap number
 */
DheapSet::DheapSet(int size, int maxh, int dd) :
		   Adt(size), maxHeap(maxh), d(dd) {
	makeSpace(size,maxh,dd);
}

DheapSet::~DheapSet() { freeSpace(); }

/** Allocate and initialize space for Dheap.
 *  @param size is number of index values to provide space for
 */
void DheapSet::makeSpace(int size, int maxh, int dd) {
	numNodes = (size/dd) + maxh;
	try {
		heaps = new index[numNodes*dd]; // each d-word block is a "node"
		child = new int[numNodes*dd];    // each item in heaps has child
						// node
		parent = new int[numNodes];   	// note, one per node
		pred = new int[numNodes];     	// ditto
	
		key = new keytyp[size+1];

		root = new index[maxh+1];	// values are indices in
						// heaps array
		bot = new index[maxh+1];	// ditto
		hSize = new int[maxh+1];
	} catch (std::bad_alloc e) {
		string s = "makeSpace:: insufficient space for "
				+ to_string(size) + " index values";
		throw OutOfSpaceException(s);
	}

	nn = size; maxHeap = maxh; d = dd; clear();
}

/** Free dynamic storage used by Dheap. */
void DheapSet::freeSpace() { 
	delete [] heaps; delete [] child; delete [] parent;
	delete [] pred; delete [] key; delete [] root;
	delete [] bot; delete [] hSize;
}

/** Copy into DheapSet from source. */
void DheapSet::copyFrom(const DheapSet& source) {
	Util::fatal("DheapSet::copyFrom not implemented.");
}

/** Resize a DheapSet object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void DheapSet::resize(int size, int maxh, int dd) {
	freeSpace();
	try { makeSpace(size,maxh,dd); } catch(OutOfSpaceException e) {
		string s = "DheapSet::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Dheap.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void DheapSet::expand(int size, int maxh, int dd) {
	if (size <= n()) return;
	DheapSet old(n(),maxHeap,d); old.copyFrom(*this);
	resize(size,maxh,dd); this->copyFrom(old);
}

/** Remove all elements from heap. */
void DheapSet::clear() {
	for (int h = 1; h <= maxHeap; h++) hSize[h] = 0;
	for (int p = 0; p < numNodes*d; p++) heaps[p] = 0;

	// build free list using "parent pointer" of each "node"
	for (int i = 0; i < numNodes-1; i++)
		parent[i] = (i+1)*d;
	parent[numNodes-1] = -1; // use -1 to mark end of list
	free = 0;
}

/** Add an item to a heap.
 *  @param i is the number of the item to be added
 *  @param k is the key for the item being inserted
 *  @param h is the number of the heap in which i is to be inserted
 *  @return true on success, false on failure
 */
bool DheapSet::insert(index i, keytyp k, int h) {
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

// Delete and return item with smallest key.
int DheapSet::deleteMin(int h) {
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

// Shift i up from position p to restore heap order.
void DheapSet::siftup(index i, int p) {
	int pp = parent[p/d];
	while (pp >= 0 && key[heaps[pp]] > key[i]) {
		heaps[p] = heaps[pp]; p = pp; pp = parent[pp/d];
	}
	heaps[p] = i;
}

// Shift i down from position p to restore heap order.
void DheapSet::siftdown(index i, int p) {
	int cp = nodeMinPos(child[p]);
	while (cp >= 0 && key[heaps[cp]] < key[i]) {
		heaps[p] = heaps[cp]; p = cp;
		cp = nodeMinPos(child[cp]);
	}
	heaps[p] = i;
}

// Change the key of the min item in a heap.
void DheapSet::changeKeyMin(keytyp k, int h) {
	int p = nodeMinPos(root[h]);
	index i = heaps[p]; key[i] = k;
	siftdown(i,p);
}

string DheapSet::toString() const {
	string s;
	for (int h = 1; h <= maxHeap; h++) {
		if (!empty(h)) s += toString(h) + "\n";
	}
	return s;
}

string DheapSet::toString(int h) const {
	string s;
	if (hSize[h] == 0) { s = "[]"; return s; }

	list<int> nodeList;
	for (int p = bot[h]; p != -1; p = pred[p/d])
		nodeList.push_front(p);
	int cnt = 0; int numPerRow = 1;
	for (auto lp = nodeList.begin(); lp != nodeList.end(); lp++) {
		int p = *lp;
		int q = p;
		s += "[";
		while (q < p+d && heaps[q] != 0) {
			if (q > p) s += " ";
			index i = heaps[q++];
			s += to_string(i) + ":" + to_string(key[i]);
		}
		s += "] ";
		if (++cnt == numPerRow) {
			s += "\n"; cnt = 0; numPerRow *= d;
		}
	}
	if (cnt != 0) s += "\n";
	return s;
}

} // ends namespace
