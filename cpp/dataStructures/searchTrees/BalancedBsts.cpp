/** @file BalancedBsts.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "BalancedBsts.h"

#define left(x) node[x].left
#define right(x) node[x].right
#define p(x) node[x].p
#define kee(x) node[x].kee
#define rank(x) rvec[x]

/** Constructor for the BalancedBsts class. 
 *  @param N is the number of vertices in this object
 */
BalancedBsts::BalancedBsts(int N) : SortedSets(N) {
	rvec = new int[n+1];
	rank(0) = 0;
	for (item i = 1; i <= n; i++) rank(i) = 1;
}

/** Destructor for BalancedBsts class. */
BalancedBsts::~BalancedBsts() { delete [] rvec; }

/** Swap the positions of two nodes in the same tree.
 *  @param i is a node in a search tree
 *  @param j is another node in the same tree, which is not the parent of i;
 *  this is a helper method for the remove method; it exchanges the
 *  positions of the nodes in the tree
 */
void BalancedBsts::swap(item i, item j) {
	SortedSets::swap(i,j);
	int r = rvec[i]; rvec[i] = rvec[j]; rvec[j] = r;
}

/** Insert a singleton item into a set (bst) in the collection.
 *  @param i is an item (node) to be inserted; it must be a singleton
 *  @param s is a reference to the canonical element of the set that i
 *  is to be added to; if the operation changes the canonical element
 *  then s will be changed
 *  @return true on success, false on failure
 */
bool BalancedBsts::insert(item i, sset& s) {
	assert(rank(0) == 0);
	SortedSets::insert(i,s);
	if (s == i) return true;
	// rank(i) = 1;
	// go up the tree correcting rank violations using promotion
	item x = i; item gpx = p(p(x));
	while (gpx != 0 && rank(x) == rank(gpx) &&
	       rank(left(gpx)) == rank(right(gpx))) {
		rank(gpx)++; x = gpx; gpx = p(p(x));
	}
	if (gpx == 0 || rank(x) != rank(gpx)) return true;
	// finish off with a rotation or two
	if (x == left(left(gpx)) || x == right(right(gpx))) rotate(p(x));
	else { rotate(x); rotate(x); }
	if (p(s) != 0) s = p(s);
	return true;
}

/** Remove an item from a set.
 *  @param i is the item to be removed
 *  @param s is a reference to the canonical element of the set
 *  containing i; if the operation changes the canonical element,
 *  s will be changed to reflect that
 */
void BalancedBsts::remove(item i, sset& s) {
	assert(rank(0) == 0);
	item r, x, px, y, z;
	r = (s != i ? s : (right(s) != 0 ? right(s) : left(s)));
	// r is a node that will remain close to the root after
	// all changes are made

	// remove i from the tree
        item j;
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
	if (px == 0) { s = find(r); return; } // arises if i is only node in s
	     if (rank(left(px))  < rank(px)-1) x = left(px);
	else if (rank(right(px)) < rank(px)-1) x = right(px);
	else { s = find(r); return; }
	// if we reach here x is a child of px and rank(x) < rank(px)-1
	// note: x may be 0
	// now move up the tree checking for and fixing
	// rank violations between x and its parent
	y = sibling(x,px);
	// note: rank(x) >= 0, so rank(px) >= 2 and rank(y) >= 1
	while (px != 0 && rank(x) < rank(px)-1 && 
		(y == 0 || rank(y) < rank(px) &&
		rank(left(y)) < rank(y) && rank(right(y)) < rank(y))) {
		rank(px)--; // creates no violations with y or y's children
		x = px; px = p(x); y = sibling(x,px);
	}
	if (px == 0) { s = find(r); return; }
	// note: x can still be null
	if (rank(x) >= rank(px)-1) { s = find(r); return; }
	// now, do a few rotations to finish up
	if (rank(y) == rank(px)) {
		rotate(y); y = sibling(x,px);
		if (left(y) == 0 && right(y) == 0) {
			rank(px)--; s = find(r); return;
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
	s = find(r); if (rank(0) != 0) cerr << "f\n"; return;
}

/** Join two sets at an item.
 *  @param s1 is the canonical element of some set
 *  @param s2 is the canonical element of some set
 *  @param i is a singleton i whose key is larger than that of the keys
 *  in s1 and smaller than that of the keys in s2
 *  @return the new set that results from merging s1, i and s2
 */
sset BalancedBsts::join(sset s1, item i, sset s2) {
	fatal("BalancedBsts::join not implemented");
}

/** Divide a set on an item (not implemented at this time).
 *  @param i is an item in some set
 *  @param s is the canonical element of the set containing i
 *  @return the pair of sets that results from splitting s into three
 *  parts;; the items with keys smaller than i, i itself, and the
 *  items with keys larger than i
 */
setPair BalancedBsts::split(item i, sset s) {
	fatal("split::join not implemented");
}

/** Create a string representing an item.
 *  @param i is an item in some set
 *  @param s is a string in which the result is to be returned
 *  @return a reference to s
 */
string& BalancedBsts::item2string(item i, string& s) const {
	string s1;
	s = "";
	if (i == 0) return s;
	s += Util::node2string(i,n,s1) + ":";
	s += Util::num2string(key(i),s1) + ":";
	s += Util::num2string(rank(i),s1);
	if (p(i) == 0) s += "*";
	return s;
}
