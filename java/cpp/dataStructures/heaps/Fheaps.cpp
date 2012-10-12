/** @file Fheaps.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Fheaps.h"

#define left(x) sibs->pred(x)
#define right(x) sibs->suc(x)
#define kee(x) node[x].kee
#define rank(x) node[x].rank
#define mark(x) node[x].mark
#define p(x) node[x].p
#define c(x) node[x].c

/** Constructor for Fheaps class.
 *  @param N is the number of items in the constructed object
 */
Fheaps::Fheaps(int N) : n(N) {
	node = new fnode[n+1];
	sibs = new UiClist(n);
	tmpq = new UiList(n);
	for (int i = 1; i <= n ; i++) {
		c(i) = p(i) = 0;
		rank(i) = 0; kee(i) = 0;
		mark(i) = false;
	}
	for (int i = 0; i <= MAXRANK; i++) rvec[i] = 0;
	kee(0) = rank(0) = mark(0) = 0;
	p(0) = c(0) = 0;
}

/** Destructor for Fheaps class. */
Fheaps::~Fheaps() {
	delete [] node; delete tmpq; delete sibs;
}

/** Combine two heaps.
 *  @param h1 is the canonical element of a heap
 *  @param h2 is the canonical element of a heap
 *  @param return the canonical element of the heap obtained
 *  by combining h1 and h2
 */
fheap Fheaps::meld(fheap h1, fheap h2) {
	assert(0 <= h1 && h1 <= n && 0 <= h2 && h2 <= n);
	if (h1 == 0) return h2;
	if (h2 == 0) return h1;
	sibs->join(h1,h2);
	return kee(h1) <= kee(h2) ? h1 : h2;
}

/** Insert a singleton item into a heap.
 *  @param i is a singleton item
 *  @param h is the canonical element of a heap
 *  @param x is key value under which i is to be inserted
 *  @return the canonical element of the heap that results from inserting
 *  i into h
 */
fheap Fheaps::insert(item i, fheap h, keytyp x) {
	assert(0 <= i && i <= n && 0 <= h && h <= n);
	assert(left(i) == i && right(i) == i && c(i) == 0 && p(i) == 0);
	kee(i) = x;
	return meld(i,h);
}

/** Decrease the key of some item.
 *  @param i is an item in some heap
 *  @param delta is an increment to be subtracted from the key of i
 *  @param h is the heap containing i
 *  @return the canonical element of the heap that results from reducing
 *  i's key by delta
 */
fheap Fheaps::decreasekey(item i, keytyp delta, fheap h) {
	assert(0 <= i && i <= n && 0 <= h && h <= n && delta >= 0);
	fheap pi = p(i);
	kee(i) -= delta;
	if (pi == 0) return kee(i) < kee(h) ? i : h;
	c(pi) = rank(pi) == 1 ? 0: left(i);
	rank(pi)--;
	sibs->remove(i);
	p(i) = 0;
	h = meld(i,h);
	if (p(pi) == 0) return h;
	if (!mark(pi))	mark(pi) = true;
	else		h = decreasekey(pi,0,h);
	return h;
}

/** Remove the item with smallest key from a heap.
 *  @param h is the canonical element of some heap
 *  @return the canonical element of the heap that results from
 *  removing the item with the smallest key
 */
fheap Fheaps::deletemin(fheap h) {
	assert(1 <= h && h <= n);
	item i,j; int k,mr;

	// Merge h's children into root list and remove it
	sibs->join(h,c(h)); c(h) = 0; rank(h) = 0;
	if (left(h) == h) return 0;
	i = left(h);
	sibs->remove(h);
	
	// Build queue of roots and find root with smallest key
	h = i; tmpq->addLast(i); p(i) = 0;
	for (j = right(i); j != i; j = right(j)) {
		if (kee(j) < kee(h)) h = j;
		tmpq->addLast(j); p(j) = 0;
	}
	mr = -1;
	while (!tmpq->empty()) {
		// sort roots by rank, merging trees of equal rang
		i = tmpq->first(); tmpq->removeFirst();
		if (rank(i) > MAXRANK) fatal("deletemin: rank too large");
		j = rvec[rank(i)];
		if (mr < rank(i)) {
			for (mr++; mr < rank(i); mr++) rvec[mr] = 0;
			rvec[rank(i)] = i;
		} else if (j == 0) {
			rvec[rank(i)] = i;
		} else if (kee(i) < kee(j)) {
			sibs->remove(j);
			sibs->join(c(i),j); c(i) = j;
			rvec[rank(i)] = 0;
			rank(i)++;
			p(j) = i; mark(j) = false;
			tmpq->addLast(i);
		} else {
			sibs->remove(i);
			sibs->join(c(j),i); c(j) = i;
			rvec[rank(i)] = 0;
			rank(j)++;
			p(i) = j; mark(i) = false;
			if (h == i) h = j;
			tmpq->addLast(j);
		}
	}
	for (k = 0; k <= mr; k++) rvec[k] = 0;
	return h;
}

/** Remove an item from a heap.
 *  @param i is an item in some heap
 *  @param h is the canonical element of the heap containing i
 *  @return the heap that results from removing i from h
 */
fheap Fheaps::remove(item i, fheap h) {
	assert(1 <= i && i <= n && 1 <= h && h <= n);
	keytyp k;
	k = kee(i);
	h = decreasekey(i,(kee(i)-kee(h))+1,h);
	h = deletemin(h);
	kee(i) = k;
	return h;
}

/** Create a string representation of this object.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Fheaps::toString(string& s) const {
	s = "";
	bool *pmark = new bool[n+1];
	for (int i = 1; i <= n; i++) pmark[i] = false;
	for (int i = 1; i <= n; i++) {
		if (p(i) == 0 && !pmark[i]) {
			s += heap2string(i,s) + "\n";
			pmark[i] = true;
			for (int j = sibs->suc(i); j != i; j = sibs->suc(j))
				pmark[j] = true;
		}
	}
	delete [] pmark;
	return s;
}

/** Create a string representation of a heap.
 *  @param h is the canonical element of some heap
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Fheaps::heap2string(fheap h, string& s) const {
	s = "";
	if (h == 0) return s;
	stringstream ss;
	ss << "[" << Util::node2string(h,n,s) << ":";
	ss << kee(h) << ":" << rank(h) << " " << heap2string(c(h),s);
	for (item i = right(h); i != h; i = right(i)) {
		ss << Util::node2string(i,n,s) + ":" << kee(i) << ":";
		ss << rank(h) << " " << heap2string(c(i),s);
	}
	ss << "]";
	s = ss.str();
	return s;
}
