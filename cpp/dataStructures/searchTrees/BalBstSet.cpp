/** @file BalBstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "BalBstSet.h"

#define left(x) node[x].left
#define right(x) node[x].right
#define p(x) node[x].p
#define kee(x) node[x].kee
#define rank(x) rvec[x]

namespace grafalgo {

/** Constructor for BalBstSet class.
 *  @param size defines the index range for the constructed object.
 */
BalBstSet::BalBstSet(int size) : BstSet(size) {
	makeSpace(size);
}

/** Destructor for BalBstSet class. */
BalBstSet::~BalBstSet() { freeSpace(); }

/** Allocate and initialize space for BalBstSet.
 *  @param size is number of index values to provide space for
 */
void BalBstSet::makeSpace(int size) {
	try {
		rvec = new int[size+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by BalBstSet. */
void BalBstSet::freeSpace() {
	delete [] rvec;
}

/** Reinitialize data structure, creating single node trees. */
void BalBstSet::clear() {
	BstSet::clear();
	for (index i = 0; i <= n(); i++) {
		rank(i) = 1;
	}
	rank(0) = 0;
}

/** Resize a BalBstSet object, discarding old value.
 *  @param size is the size of the resized object.
 */
void BalBstSet::resize(int size) {
	freeSpace();
	BstSet::resize(size);
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "BalBstSet::resize::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void BalBstSet::expand(int size) {
	if (size <= n()) return;
	BalBstSet old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}
/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void BalBstSet::copyFrom(const BalBstSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	BstSet::copyFrom(source);
	for (index x = 1; x <= n(); x++) {
		rvec[x] = source.rvec[x];
	}
}

/** Swap the positions of two nodes in the same tree.
 *  @param i is a node in a search tree
 *  @param j is another node in the same tree, which is not the parent of i;
 *  this is a helper method for the remove method; it exchanges the
 *  positions of the nodes in the tree
 */
void BalBstSet::swap(index i, index j) {
	BstSet::swap(i,j);
	int r = rvec[i]; rvec[i] = rvec[j]; rvec[j] = r;
}

/** Insert a singleton tree into a bst (bst) in the collection.
 *  @param i is an item (node) to be inserted; it must be a singleton
 *  @param t is a reference to the root of the bst that i
 *  is to be added to; if the operation changes the root
 *  then t will be changed
 *  @return true on success, false on failure
 */
bool BalBstSet::insert(index i, bst& t) {
	assert(rank(0) == 0);
	BstSet::insert(i,t);
	if (t == i) return true;
	// rank(i) = 1;
	// go up the tree correcting rank violations using promotion
	index x = i; index gpx = p(p(x));
	while (gpx != 0 && rank(x) == rank(gpx) &&
	       rank(left(gpx)) == rank(right(gpx))) {
		rank(gpx)++; x = gpx; gpx = p(p(x));
	}
	if (gpx == 0 || rank(x) != rank(gpx)) return true;
	// finish off with a rotation or two
	if (x == left(left(gpx)) || x == right(right(gpx))) rotate(p(x));
	else { rotate(x); rotate(x); }
	if (p(t) != 0) t = p(t);
	return true;
}

/** Remove an item from a bst.
 *  @param i is the item to be removed
 *  @param t is a reference to the root of the bst
 *  containing i; if the operation changes the root,
 *  s will be changed to reflect that
 */
void BalBstSet::remove(index i, bst& t) {
	assert(rank(0) == 0);
	index r, x, px, y, z;
	r = (t != i ? t : (right(t) != 0 ? right(t) : left(t)));
	// r is a node that will remain close to the root after
	// all changes are made

	// remove i from the tree
        index j;
        if (left(i) != 0 && right(i) != 0) {
                for (j = left(i); right(j) != 0; j = right(j)) {}
                swap(i,j);
        }
        // now, i has at most one child
        j = (left(i) != 0 ? left(i) : right(i));
        // j is now the index of the only child that could be non-null
        if (j != 0) p(j) = p(i);
        if (p(i) != 0) {
                     if (i ==  left(p(i)))  left(p(i)) = j;
                else if (i == right(p(i))) right(p(i)) = j;
                j = p(i);
        }
        p(i) = left(i) = right(i) = 0;

	// now rebalance as needed, by checking for and fixing
	// violations on the rank invariant
        px = j; rank(i) = 1;
	// px is now i's former parent just before i was removed
	// or the child of i, if i had no parent
	if (px == 0) { t = find(r); return; } // arises if i is only node in s
	     if (rank(left(px))  < rank(px)-1) x = left(px);
	else if (rank(right(px)) < rank(px)-1) x = right(px);
	else { t = find(r); return; }
	// if we reach here x is a child of px and rank(x) < rank(px)-1
	// note: x may be 0
	// now move up the tree checking for and fixing
	// rank violations between x and its parent
	y = sibling(x,px);
	// note: rank(x) >= 0, so rank(px) >= 2 and rank(y) >= 1
	while (px != 0 && rank(x) < rank(px)-1 && 
		(y == 0 || (rank(y) < rank(px) &&
		rank(left(y)) < rank(y) && rank(right(y)) < rank(y)))) {
		rank(px)--; // creates no violations with y or y's children
		x = px; px = p(x); y = sibling(x,px);
	}
	if (px == 0) { t = find(r); return; }
	// note: x can still be null
	if (rank(x) >= rank(px)-1) { t = find(r); return; }
	// now, do a few rotations to finish up
	if (rank(y) == rank(px)) {
		rotate(y); y = sibling(x,px);
		if (left(y) == 0 && right(y) == 0) {
			rank(px)--; t = find(r); return;
		}
	}
	z = (x == right(px) ? left(y) : right(y)); // z is furthest nephew of x
	if (rank(z) == rank(y)) {
		rotate(y);
		if (y != 0) rank(y) = rank(px);
		rank(px)--;
	} else {
		z = sibling(z,y);
		// now z is closest nephew of x
		rotate(z); rotate(z);
		if (z != 0) rank(z) = rank(px);
		rank(px)--;
	}
	t = find(r); if (rank(0) != 0) cerr << "f\n"; return;
}

/** Join two bsts at an item.
 *  @param t1 is the root of some bst
 *  @param t2 is the root of some bst
 *  @param i is a singleton i whose key is larger than that of the keys
 *  in t1 and smaller than that of the keys in t2
 *  @return the new bst that results from merging t1, i and t2
 */
bst BalBstSet::join(bst t1, index i, bst t2) {
	Util::fatal("BalBstSet: join not implemented");
	return i;
}

/** Divide a bst on an item (not implemented at this time).
 *  @param i is an item in some bst
 *  @param t is the root of the bst containing i
 *  @return the pair of bst that results from splitting t into three
 *  parts; the part with keys smaller than i, i itself, and the
 *  part with keys larger than i
 */
BstSet::BstPair BalBstSet::split(index i, bst t) {
	Util::fatal("BalBstSet: split not implemented");
	return BstPair(0,0);
}

/** Create a string representing an item.
 *  @param i is an item in some bst
 *  @param s is a string in which the result is to be returned
 *  @return a reference to s
 */
string& BalBstSet::node2string(index i, string& s) const {
	s = "";
	if (i == 0) return s;
	stringstream ss;
	ss << Adt::item2string(i,s) << ":" << key(i) + ":" << rank(i);
	if (p(i) == 0) s += "*";
	s = ss.str();
	return s;
}

} // ends namespace
