/** @file FheapSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "FheapSet.h"

namespace grafalgo {

#define sib(x) sibs->suc(x)
#define kee(x) node[x].kee
#define rank(x) node[x].rank
#define mark(x) node[x].mark
#define p(x) node[x].p
#define c(x) node[x].c

/** Constructor for FheapSet class.
 *  @param size is the number of items in the constructed object
 */
FheapSet::FheapSet(int size) : Adt(size) { makeSpace(size); mrCount = 0; }

/** Destructor for FheapSet class. */
FheapSet::~FheapSet() { freeSpace(); }

/** Allocate and initialize space for FheapSet.
 *  @param size is number of index values to provide space for
 */
void FheapSet::makeSpace(int size) {
	try {
		node = new Fnode[size+1];
		sibs = new ClistSet(size);
		tmpq = new List(size);
	} catch (std::bad_alloc e) {
		string s = "makeSpace:: insufficient space for "
			+ to_string(size) + " index values";
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by FheapSet. */
void FheapSet::freeSpace() { delete [] node; delete sibs; delete tmpq; }

/** Copy into FheapSet from source. */
void FheapSet::copyFrom(const FheapSet& source) {
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

/** Resize a FheapSet object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void FheapSet::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "FheapSet::resize::" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this FheapSet.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void FheapSet::expand(int size) {
	if (size <= n()) return;
	FheapSet old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Convert all heaps to singletons. */
void FheapSet::clear() {
	sibs->clear();
	for (index x = 0; x <= n(); x++) {
		c(x) = p(x) = rank(x) = kee(x) = 0; mark(x) = false;
	}
	//for (index x = 0; x <= FheapSet::MAXRANK; x++) rvec[x] = 0;
}

/** Build a heap from a list of nodes.
 *  @param lst is a list of heaps.
 */
fheap FheapSet::makeheap(const List& lst) {
	fheap h = lst.first();
	if (h == 0) return 0;
	fheap minh = h;
	for (fheap h1 = lst.next(h); h1 != 0; h1 = lst.next(h1)) {
		if (kee(h1) < kee(minh)) minh = h1;
		sibs->join(h,h1);
	}
	return minh;
}

/** Combine two heaps.
 *  @param h1 is the canonical element of a heap
 *  @param h2 is the canonical element of a heap
 *  @param return the canonical element of the heap obtained
 *  by combining h1 and h2
 */
fheap FheapSet::meld(fheap h1, fheap h2) {
	assert(0 <= h1 && h1 <= n() && 0 <= h2 && h2 <= n());
//cerr << "meld(" << h1 << "," << h2 << ")\n";
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
fheap FheapSet::insert(index i, fheap h, keytyp x) {
	assert(0 <= i && i <= n() && 0 <= h && h <= n());
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
fheap FheapSet::decreasekey(index i, keytyp delta, fheap h) {
	assert(0 <= i && i <= n() && 0 <= h && h <= n() && delta >= 0);
//cerr << "decreaskey(" << i << "," << delta << "," << h << ")\n";
	fheap pi = p(i);
	kee(i) -= delta;
	if (pi == 0) return (kee(i) < kee(h) ? i : h);
	if (kee(i) >= kee(pi)) return h;
	do {
		c(pi) = (rank(pi) == 1 ? 0: sib(i));
		rank(pi)--;
		sibs->remove(i);
		p(i) = 0; mark(i) = false;
		h = meld(i,h);
		i = pi; pi = p(i);
	} while (mark(i)); // note: if i is marked, it's not a root
	if (pi != 0) mark(i) = true;

	return h;
}

/** Merge the tree roots in heap, to eliminate repeated ranks.
 *  @param r is a tree root in a heap; all tree roots are assumed
 *  to be non-deleted nodes
 *  @return the resulting root with the smallest key
 */
fheap FheapSet::mergeRoots(fheap r) {
	// Build queue of roots and find root with smallest key
	mrCount++;
	index minRoot = r;
	tmpq->addLast(r); p(r) = 0;
	for (fheap sr = sib(r); sr != r; sr = sib(sr)) {
		if (kee(sr) < kee(minRoot)) minRoot = sr;
		tmpq->addLast(sr); p(sr) = 0; mark(sr) = false;
	}
	// scan roots, merging trees of equal rank
	int maxRank = -1; // maxRank = maximum rank seen so far
	while (!tmpq->empty()) {
		mrCount++;
		index r1 = tmpq->first(); tmpq->removeFirst();
		if (rank(r1) > FheapSet::MAXRANK)
			Util::fatal("mergeRoots: rank too large");
		index r2 = rvec[rank(r1)];
		if (maxRank < rank(r1)) {
			for (maxRank++; maxRank < rank(r1); maxRank++)
				rvec[maxRank] = 0;
			rvec[rank(r1)] = r1;
		} else if (r2 == 0) {
			rvec[rank(r1)] = r1;
		} else if (kee(r1) < kee(r2)) {
			sibs->remove(r2);
			sibs->join(c(r1),r2); c(r1) = r2;
			rvec[rank(r1)] = 0;
			rank(r1)++; p(r2) = r1;
			tmpq->addLast(r1);
		} else {
			sibs->remove(r1);
			sibs->join(c(r2),r1); c(r2) = r1;
			rvec[rank(r1)] = 0;
			rank(r2)++; p(r1) = r2; 
			tmpq->addLast(r2);
			if (r1 == minRoot) minRoot = r2;
		}
	}
	//for (int k = 0; k <= maxRank; k++) rvec[k] = 0;
	return minRoot;
}

/** Remove the item with smallest key from a heap.
 *  @param h is the canonical element of some heap
 *  @return the canonical element of the heap that results from
 *  removing the item with the smallest key
 */
fheap FheapSet::deletemin(fheap h) {
if (!(1 <= h && h <= n())) {
//cerr << "deletemin(" << h << ")\n";
}
	assert(1 <= h && h <= n());

	// Merge h's children into root list and remove it
	index x = c(h);
	if (x != 0) sibs->join(h,x);
	c(h) = 0; rank(h) = 0;
	x = sib(h);
	if (x == h) {
//cerr << "returning 0 because heap now empty\n";
		return 0;
	}
	sibs->remove(h);

	return mergeRoots(x);
}

/** Remove an item from a heap.
 *  @param i is the index of an item in some heap
 *  @param h is the canonical element of the heap containing i
 *  @return the heap that results from removing i from h
 */
fheap FheapSet::remove(index i, fheap h) {
	assert(1 <= i && i <= n() && 1 <= h && h <= n());
	keytyp k = kee(i);
	h = decreasekey(i,(kee(i)-kee(h))+1,h);
	h = deletemin(h);
	kee(i) = k;
	return h;
}

/** Create a string representation of this object.
 *  @return the string
 */
string FheapSet::toString() const {
	string s = "";
	bool *pmark = new bool[n()+1];
	for (fheap h = 1; h <= n(); h++) pmark[h] = false;
	for (fheap h = 1; h <= n(); h++) {
		if (p(h) == 0 && !pmark[h]) {
			// h is a root in a new heap
			if (c(h) == 0 && sib(h) == h) continue;
			// find minkey item, mark all tree roots in this heap
			pmark[h] = true;
			fheap minroot = h;
			for (fheap sh = sib(h); sh != h; sh = sib(sh)) {
				if (key(sh) < key(minroot)) minroot = sh; 
				pmark[sh] = true;
			}
			s += heap2string(minroot) + "\n";
		}
	}
	delete [] pmark;
	return s;
}

/** Create a string representation of a heap.
 *  @param h is the canonical element of some heap
 *  @return a reference to s
 */
string FheapSet::heap2string(fheap h) const {
	string s = "";
	if (h == 0 || (p(h) == 0 && c(h) == 0 && sib(h) == h)) return s;
	s += "[" + index2string(h);
	if (mark(h)) s += "!";
	else s += ":";
	s += to_string(kee(h)) + "," + to_string(rank(h));
	s += heap2string(c(h));
	for (fheap sh = sib(h); sh != h; sh = sib(sh)) {
		s += " " + index2string(sh);
		if (mark(sh)) s += "!";
		else s += ":";
		s += to_string(key(sh)) + "," + to_string(rank(sh));
		s += heap2string(c(sh));
	}
	s += "]";
	return s;
}

} // ends namespace
