/** @file Lheaps.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Lheaps.h"

#define kee(x) node[x].kee
#define rank(x) node[x].rank
#define left(x) node[x].left
#define right(x) node[x].right

/** Constructor for Lheaps class
 *  @param N is the number of items in the constructed object
 */
Lheaps::Lheaps(int N) : n(N) {
	node = new hnode[n+1];
	for (int i = 1; i <= n ; i++) {
		left(i) = right(i) = 0;
		rank(i) = 1; kee(i) = 0;
	}
	rank(0) = 0; left(0) = right(0) = 0;
}

/** Destructor for Lheaps class. */
Lheaps::~Lheaps() { delete [] node; }

/** Combine two heaps.
 *  @param h1 is the canonical element of a heap
 *  @param h2 is the canonical element of a heap
 *  @param return the canonical element of the heap obtained
 *  by combining h1 and h2
 */
lheap Lheaps::meld(lheap h1, lheap h2) {
	assert(0 <= h1 && h1 <= n && 0 <= h2 && h2 <= n);
	     if (h1 == 0) return h2;
	else if (h2 == 0) return h1;
	if (kee(h1) > kee(h2)) {
		lheap t = h1; h1 = h2; h2 = t;
	}
	right(h1) = meld(right(h1),h2);
	if (rank(left(h1)) < rank(right(h1))) {
		lheap t = left(h1); left(h1) = right(h1); right(h1) = t;
	}
	rank(h1) = rank(right(h1)) + 1;
	return h1;
}

/** Insert a singleton item into a heap.
 *  @param i is a singleton item
 *  @param h is the canonical element of a heap
 *  @param x is key value under which i is to be inserted
 *  @return the canonical element of the heap that results from inserting
 *  i into h
 */
lheap Lheaps::insert(item i, lheap h) {
	assert(0 <= i && i <= n && 0 <= h && h <= n);
	assert(left(i) == 0 && right(i) == 0 && rank(i) ==1);
	return meld(i,h);
}

/** Remove the item with smallest key from a heap.
 *  @param h is the canonical element of some heap
 *  @return the item in h with the smallest key, after removing
 *  it from the heap
 */
item Lheaps::deletemin(lheap h) {
	(void) meld(left(h),right(h));
	left(h) = right(h) = 0; rank(h) = 1;
	return h;
}

/** Construct a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Lheaps::toString(string& s) const {
	int i; bool *mark = new bool[n+1];
	for (i = 1; i <= n; i++) mark[i] = true;
	for (i = 1; i <= n; i++)
		mark[left(i)] = mark[right(i)] = false;
	for (i = 1; i <= n; i++)
		if (mark[i]) { string s1; s += heap2string(i,s1); }
	delete [] mark;
	return s;
}

/** Construct a string representation of a heap.
 *  @param h is the canonical element of some heap
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Lheaps::heap2string(lheap h, string& s) const {
	stringstream ss;
	if (h == 0) { s = ""; return s; }
	ss << "(" << Util::node2string(h,n,s) << "/" << kee(h) << " ";
	ss << heap2string(left(h),s);
	ss << heap2string(right(h),s) << ")";
	s = ss.str();
	return s;
}
