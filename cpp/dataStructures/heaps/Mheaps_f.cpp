/** @file Mheaps_f.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Mheaps_f.h"

namespace grafalgo {

#define sib(x) sibs->next(x)
#define kee(x) node[x].kee
#define rank(x) node[x].rank
#define mark(x) node[x].mark
#define p(x) node[x].p
#define c(x) node[x].c

/** Constructor for Mheaps_f class.
 *  @param n is the number of items in the constructed object
 */
Mheaps_f::Mheaps_f(int n) : Adt(n) { makeSpace(); clear(); }

/** Destructor for Mheaps_f class. */
Mheaps_f::~Mheaps_f() { freeSpace(); }

/** Allocate space for Mheaps_f. */
void Mheaps_f::makeSpace() {
	node = new Fnode[n()+1]; sibs = new Dlists(n()); tmpq = new List(n());
}

/** Free dynamic storage used by Mheaps_f. */
void Mheaps_f::freeSpace() { delete [] node; delete sibs; delete tmpq; }

/** Copy into Mheaps_f from source. */
void Mheaps_f::copyFrom(const Mheaps_f& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	(*sibs).copyFrom(*source.sibs);
	for (index x = 1; x <= source.n(); x++) {
		c(x) = source.node[x].c;
		p(x) = source.node[x].p;
		rank(x) = source.node[x].rank;
		kee(x) = source.node[x].kee;
		mark(x) = source.node[x].mark;
	}
}

/** Resize a Mheaps_f object.
 *  The old value is discarded.
 *  @param n is the size of the resized object.
 */
void Mheaps_f::resize(int n) {
	freeSpace(); Adt::resize(n); makeSpace(); clear();
}

/** Expand the space available for this Mheaps_f.
 *  Rebuilds old value in new space.
 *  @param n is the size of the resized object.
 */
void Mheaps_f::expand(int n) {
	if (n <= this->n()) return;
	Mheaps_f old(this->n()); old.copyFrom(*this);
	resize(n); this->copyFrom(old);
}

/** Convert all heaps to singletons. */
void Mheaps_f::clear() {
	sibs->clear();
	for (index x = 0; x <= n(); x++) {
		c(x) = p(x) = rank(x) = kee(x) = 0; mark(x) = false;
	}
}

/** Build a heap from a list of nodes.
 *  @param lst is a list of heaps.
 */
fheap Mheaps_f::makeheap(const List& lst) {
	fheap h = lst.first();
	if (h == 0) return 0;
	fheap minh = h;
	for (fheap h1 = lst.next(h); h1 != 0; h1 = lst.next(h1)) {
		if (kee(h1) < kee(minh)) minh = h1;
		sibs->join(h1,h); // h1 is id of list
	}
	return minh;
}

/** Combine two heaps.
 *  @param h1 is the canonical element of a heap, or 0
 *  @param h2 is the canonical element of a heap, or 0
 *  @param return the canonical element of the heap obtained
 *  by combining h1 and h2
 */
fheap Mheaps_f::meld(fheap h1, fheap h2) {
	assert((h1 == 0 || (valid(h1) && p(h1) == 0)) &&
	       (h2 == 0 || (valid(h2) && p(h2) == 0)));
	if (h1 == 0) return h2;
	if (h2 == 0) return h1;
	fheap h;
	if (kee(h1) <= kee(h2)) h = sibs->join(h1,h2);
	else			h = sibs->join(h2,h1);
	return h;
}

/** Insert a singleton item into a heap.
 *  @param i is a singleton item
 *  @param h is the canonical element of a heap
 *  @param x is key value under which i is to be inserted
 *  @return the canonical element of the heap that results from inserting
 *  i into h
 */
fheap Mheaps_f::insert(index i, fheap h, keytyp x) {
	assert(valid(i) && valid(h) && p(h) == 0);
	setKey(i,x);
	return meld(i,h);
}

/** Decrease the key of some item.
 *  @param i is the index of an item in some heap
 *  @param delta is an increment to be subtracted from the key of i
 *  @param h is the heap containing i
 *  @return the canonical element of the heap that results from reducing
 *  i's key by delta
 */
fheap Mheaps_f::decreasekey(index i, keytyp delta, fheap h) {
	assert(valid(i) && valid(h) && p(h) == 0);
	fheap pi = p(i);
	kee(i) -= delta;
	if (pi == 0) {
		if (kee(h) <= kee(i)) return h;
		sibs->rename(h,i); return i;
	}
	if (kee(i) >= kee(pi)) return h;
	do {
		rank(pi)--;
		c(pi) = sibs->remove(i,c(pi));
		p(i) = 0; mark(i) = false;
		h = meld(i,h);
		i = pi; pi = p(i);
	} while (mark(i)); // note: if i is marked, it's not a root
	if (pi != 0) mark(i) = true;

	return h;
}

/** Merge the tree roots in heap, to eliminate repeated ranks.
 *  @param r is a tree root in a heap; all tree roots are assumed
 *  to be non-deleted nodes; also r is the id of the root list in sibs
 *  @return the resulting root with the smallest key
 */
fheap Mheaps_f::mergeRoots(fheap r) {
	assert(valid(r) && p(r) == 0);
	// Build queue of roots and find root with smallest key
	index minRoot = r;
	for (fheap sr = sibs->first(r); sr != 0; sr = sibs->next(sr)) {
		if (kee(sr) < kee(minRoot)) minRoot = sr;
		tmpq->addLast(sr); p(sr) = 0; mark(sr) = false;
	}
	sibs->rename(r,minRoot);
	r = minRoot; // r is now id of root list and has min key
	// scan roots, merging trees of equal rank
	int maxRank = -1; // maxRank = maximum rank seen so far
	while (!tmpq->empty()) {
		index r1 = tmpq->first(); tmpq->removeFirst();
		if (rank(r1) > Mheaps_f::MAXRANK)
			Util::fatal("mergeRoots: rank too large");
		index r2 = rvec[rank(r1)];
		if (maxRank < rank(r1)) {
			for (maxRank++; maxRank < rank(r1); maxRank++)
				rvec[maxRank] = 0;
			rvec[rank(r1)] = r1;
		} else if (r2 == 0) {
			rvec[rank(r1)] = r1;
		} else if (kee(r1) < kee(r2) || (kee(r1)==kee(r2) && r1 == r)) {
			r = sibs->remove(r2,r);
			c(r1) = sibs->join(c(r1),r2);
			rvec[rank(r1)] = 0;
			rank(r1)++; p(r2) = r1;
			tmpq->addLast(r1);
		} else {
			r = sibs->remove(r1,r);
			c(r2) = sibs->join(c(r2),r1);
			rvec[rank(r1)] = 0;
			rank(r2)++; p(r1) = r2; 
			tmpq->addLast(r2);
		}
	}
	//for (int k = 0; k <= maxRank; k++) rvec[k] = 0;
	return r;
}

/** Remove the item with smallest key from a heap.
 *  @param h is the canonical element of some heap
 *  @return the canonical element of the heap that results from
 *  removing the item with the smallest key
 */
fheap Mheaps_f::deletemin(fheap h) {
	assert(valid(h) && p(h) == 0);

	// Merge h's children into root list and remove it
	// First, make parent pointers of new root nodes 0
	if (c(h) != 0) {
		for (index x = sibs->first(c(h)); x != 0; x = sibs->next(x))
			p(x) = 0;
		sibs->join(h,c(h)); c(h) = 0;
	}
	rank(h) = 0;
	if (sibs->singleton(h)) return 0;
	return mergeRoots(sibs->remove(h,h));
}

/** Remove an item from a heap.
 *  @param i is the index of an item in some heap
 *  @param h is the canonical element of the heap containing i
 *  @return the heap that results from removing i from h
 */
fheap Mheaps_f::remove(index i, fheap h) {
	assert(valid(i) && valid(h) && p(h) == 0);
	keytyp k = kee(i);
	h = decreasekey(i,(kee(i)-kee(h))+1,h);
	h = deletemin(h);
	kee(i) = k;
	return h;
}

/** Create a string representation of this object.
 *  @return the string
 */
string Mheaps_f::toString() const {
	string s = "";
	bool *pmark = new bool[n()+1];
	for (index r = 1; r <= n(); r++) pmark[r] = false;
	for (index r = 1; r <= n(); r++) {
		if (p(r) == 0 && !pmark[r]) {
			fheap h = sibs->findList(r);  // h is minkey root
			for (index r1 = sibs->first(h); r1 != 0;
				   r1 = sibs->next(r1)) {
				pmark[r1] = true;
			}
			if (c(h) != 0 || !sibs->singleton(h))
				s += heap2string(h) + "\n";
		}
	}
	delete [] pmark;
	return s;
}

/** Create a string representation of a heap.
 *  @param x is the id of some list in sibs
 *  @return a reference to s
 */
string Mheaps_f::heap2string(index x) const {
	string s = "";
	if (x == 0 || (p(x) == 0 && c(x) == 0 && sibs->singleton(x)))
		return s; // skip heaps with <2 items
	s += "[";
	for (index r = sibs->first(x); r != 0; r = sibs->next(r)) {
		if (r != sibs->first(x)) s += " ";
		s += index2string(r);
		s += (mark(r) ? "!" : ":");
		s += to_string(key(r)) + "," + to_string(rank(r));
		s += heap2string(c(r));
	}
	s += "]";
	return s;
}

} // ends namespace
