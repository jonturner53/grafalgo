/** @file Llheaps.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Llheaps.h"

#define kee(x) node[x].kee
#define rank(x) node[x].rank
#define left(x) node[x].left
#define right(x) node[x].right

#define deleted(x)((x > n) || (delf != 0 && (*delf)(x)))

/** Constructor for the Llheaps class.
 *  @param N is the number of items in the constructed object
 *  @param delftyp is pointer to a "deleted function"
 *  which takes a single item as its argment and returns true
 *  if that item should be considered deleted from the heap
 *  in which it is present
 */
Llheaps::Llheaps(int N, delftyp f) : Lheaps(2*N) {
	int i;
	n = N; // note lheaps constructor provides space for 2N nodes
	delf = f;
	// build list of dummy nodes linked using left pointers
	for (i = n+1; i <= 2*n ; i++) left(i) = i+1;
	dummy = n+1; left(2*n) = 0;
	rank(0) = 0; left(0) = right(0) = 0;
	tmpL = new UiList(n);
}

/** Destructor for the Llheaps class. */
Llheaps::~Llheaps() { delete tmpL; }

/** Perform a lazy meld on two heaps.
 *  The lazy meld simply inserts a dummy node at the root of a new heap
 *  @param h1 is the canonical element of a heap (the root node of its tree)
 *  @param h2 is the canonical element of a heap
 *  @return the canonical element of the heap obtained by combining h1 and h2
 */
lheap Llheaps::lmeld(lheap h1, lheap h2) {
	assert(0 <= h1 && h1 <= 2*n && 0 <= h2 && h2 <= 2*n && dummy != 0);
	int i = dummy; dummy = left(dummy);
	left(i) = h1; right(i) = h2;
	return i;
}

/** Insert an item into a heap.
 *  @param i is a singleton item
 *  @param h is the caonical element of some heap
 *  @return the canonical element of the heap obtained by inserting i into h
 */
lheap Llheaps::insert(item i, lheap h) {
	assert(0 <= i && i <= n && 0 <= h && h <= 2*n);
	assert(left(i) == 0 && right(i) == 0 && rank(i) ==1);
	tmpL->clear(); purge(h,*tmpL); h = heapify(*tmpL);
	return meld(i,h);
}

/** Find the item with the smallest key in a heap.
 *  @param h is the canonical element of some heap
 *  @return the item in h that has the smallest key
 */
item Llheaps::findmin(lheap h) {
	assert(0 <= h && h <= 2*n);
	tmpL->clear(); purge(h,*tmpL); return heapify(*tmpL);
}

/** Combine a list of heaps into a single heap.
 *  @param hlst is a list of heaps (more precisely, their canonical elements)
 *  @return the new heap obtained by combining all the heaps
 *  in the list into one heap
 */
lheap Llheaps::heapify(UiList& hlst) {
	if (hlst.empty()) return 0;
	while (hlst.get(2) != 0) {
		lheap h = meld(hlst.get(1), hlst.get(2));
		hlst.removeFirst(); hlst.removeFirst(); hlst.addLast(h);
	}
	return hlst.first();
}

/** Remove "deleted nodes" from the top of a heap and construct a
 *  list of "sub-heaps" whose root nodes have not been deleted.
 *  This is a private helper function.
 *  @param h is the root of a "heap tree"
 *  @hlst is a list in which the result of the operation is returned;
 *  if h is a non-deleted node, it is removed and its children are
 *  purged.
 */
void Llheaps::purge(lheap h, UiList& hlst) {
	if (h == 0) return;
	if (!deleted(h)) {
		hlst.addLast(h);
	} else {
		purge(left(h),hlst); purge(right(h),hlst);
		if (h > n) {
			left(h) = dummy; dummy = h; right(h) = 0;
		} else {
			left(h) = right(h) = 0; rank(h) = 1;
		}
	}
}

/** Buidl a heap from the items on a list.
 *  @param hlst is a list of singleton items (that is, single item heaps)
 *  @return the heap obtained by combining all the items into a single heap
 */
lheap Llheaps::makeheap(UiList& hlst) {
	assert(hlst.n() <= tmpL->n());
	tmpL->clear();
	for (int i = hlst.first(); i != 0; i = hlst.next(i))
		tmpL->addLast(i);
	return heapify(*tmpL);
}

/** Create a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Llheaps::toString(string& s) const {
        int i; bool *mark = new bool[n+1];
        for (i = 1; i <= n; i++) mark[i] = true;
        for (i = 1; i <= n; i++)
                mark[left(i)] = mark[right(i)] = false;
        for (i = 1; i <= n; i++)
                if (mark[i]) { string s1; s += heap2string(i,s1) + " "; }
        delete [] mark;
        return s;
}

/** Create a string representation of a heap.
 *  @param h is the canonical element of some heap
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Llheaps::heap2string(lheap h, string& s) const {
        if (h == 0) { s = ""; return s; }
        stringstream ss;
	ss << "(";
	if (deleted(h)) ss << "- ";
        else {
		ss << Util::node2string(h,n,s) << "/" << kee(h) << " ";
	}
        ss << heap2string(left(h),s);
	ss << heap2string(right(h),s) << ")";
	s = ss.str();
	return s;
}
