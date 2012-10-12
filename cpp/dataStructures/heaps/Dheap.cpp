/** @file Dheap.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dheap.h"

#define p(x) (((x)+(D-2))/D)
#define left(x) (D*((x)-1)+2)
#define right(x) (D*(x)+1)

/** Constructor for Dheap class.
 *  @param N1 is the number of items in the contructed object
 *  @param D1 is the degree of the underlying heap-ordered tree
 */
Dheap::Dheap(int N1, int D1) : D(D1), N(N1) {
	n = 0;
	h = new item[N+1]; pos = new int[N+1]; kee = new keytyp[N+1];
	for (int i = 1; i <= N; i++) pos[i] = 0;
	h[0] = pos[0] = 0; kee[0] = 0;
}

/** Destructor for Dheap class. */
Dheap::~Dheap() { delete [] h; delete [] pos; delete [] kee; }

/** Add item to the heap.
 *  @param i is an item that is not in the heap
 *  @param k is the key value under which i is to be inserted
 */
void Dheap::insert(item i, keytyp k) {
	kee[i] = k; n++; siftup(i,n);
}

/** Remove an item from the heap.
 *  @param i is an item in the heap
 */
void Dheap::remove(item i) {
	int j = h[n--];
	if (i != j) {
		if (kee[j] <= kee[i]) siftup(j,pos[i]);
		else siftdown(j,pos[i]);
	}
	pos[i] = 0;
}

/** Perform siftup operation to restore heap order.
 *  This is a private helper function.
 *  @param i is an item to be positioned in the heap
 *  @param x is a tentative position for i in the heap
 */
void Dheap::siftup(item i, int x) {
	int px = p(x);
	while (x > 1 && kee[i] < kee[h[px]]) {
		h[x] = h[px]; pos[h[x]] = x;
		x = px; px = p(x);
		siftupCount++;
	}
	h[x] = i; pos[i] = x;
}

/** Perform siftdown operation to restore heap order.
 *  This is a private helper function.
 *  @param i is an item to be positioned in the heap
 *  @param x is a tentative position for i in the heap
 */
void Dheap::siftdown(item i, int x) {
	int cx = minchild(x);
	while (cx != 0 && kee[h[cx]] < kee[i]) {
		h[x] = h[cx]; pos[h[x]] = x;
		x = cx; cx = minchild(x);
		siftdownCount += D;
	}
	h[x] = i; pos[i] = x;
}

/** Find the position of the child withthe smallest key.
 *  This is a private helper function, used by siftdown.
 *  @param x is a position of an item in the heap
 *  @return the position of the child of the item at x, that has
 *  the smallest key
 */
int Dheap::minchild(int x) {
	int y; int minc = left(x);
	if (minc > n) return 0;
	for (y = minc + 1; y <= right(x) && y <= n; y++) {
		if (kee[h[y]] < kee[h[minc]]) minc = y;
	}
	return minc;
}

/** Change the key of an item in the heap.
 *  @param i is an item in the heap
 *  @param k is a new key value for item i
 */
void Dheap::changekey(item i, keytyp k) {
	changekeyCount++;
	keytyp ki = kee[i]; kee[i] = k;
	if (k == ki) return;
	if (k < ki) siftup(i,pos[i]);
	else siftdown(i,pos[i]);
}

/** Construct a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Dheap::toString(string& s) const {
	s = "";
	for (int i = 1; i <= n; i++) {
		string s1;
		s += "(" + Util::node2string(h[i],N,s1);
		s += "," + Util::node2string(kee[h[i]],N,s1) + ") ";
		if ((i%10) == 0) s += "\n";
	}
	if ((n%10) != 0) s += "\n";
	return s;
}

/** Clear the statistics counters */
void Dheap::clearStats() {
	siftupCount = siftdownCount = changekeyCount = 0;
}

/** Return a string representation of the statistics counters.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Dheap::stats2string(string& s) const {
	stringstream ss;
	ss << "changekeyCount = " << changekeyCount << "  ";
	ss << "siftupCount = " << siftupCount << "  ";
	ss << "siftdownCount = " << siftdownCount;
	s = ss.str();
	return s;
}
