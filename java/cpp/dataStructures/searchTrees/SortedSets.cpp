/** @file SortedSets.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "SortedSets.h"

#define left(x) node[x].left
#define right(x) node[x].right
#define p(x) node[x].p
#define kee(x) node[x].kee

/** Constructor for SortedSets class.
 *  @param N is the number of nodes in the constructed object
 */
SortedSets::SortedSets(int N) : n(N) {
	node = new SsetNode[n+1];
	for (item i = 0; i <= n; i++) {
		left(i) = right(i) = p(i) = kee(i) = 0;
	}
}

/** Destructor for SortedSets class. */
SortedSets::~SortedSets() { delete [] node; }

/** Perform a rotation in a search tree.
 *  @param x is a node in some search tree; this method does a rotation
 *  at the parent of x, moving x up into it's parent's position
 */
void SortedSets::rotate(item x) {
	item y = p(x);
	if (y == 0) return;
	p(x) = p(y);
	     if (y == left(p(y)))  left(p(x)) = x;
	else if (y == right(p(y))) right(p(x)) = x;
	if (x == left(y)) {
		left(y) = right(x);
		if (left(y) != 0) p(left(y)) = y;
		right(x) = y;
	} else {
		right(y) = left(x);
		if (right(y) != 0) p(right(y)) = y;
		left(x) = y;
	}
	p(y) = x;
}

/** Get the canonical element of a set.
 *  @param i is an item in some set
 *  @return the canonical element of the set containing i; this method
 *  does not restructure the underlying search tree
 */
sset SortedSets::find(item i) const {
	assert (0 <= i && i <= n);
	while (p(i) != 0) i = p(i);
	return i;
}

/** Get the item with a specified key value.
 *  @param k is a key value
 *  @param s is a reference to the canonical element of some set;
 *  if the operation modifies the canonical element, then s will change
 *  @return the item in s that has key value k, or 0 if there is no such item
 */
item SortedSets::access(keytyp k, sset& s) const {
	assert (0 <= s && s <= n);
	item x = s;
	while (x != 0 && k != kee(x)) {
		if (k < kee(x)) x = left(x);
		else x = right(x);
	}
	return x;
}

/** Insert item into a set.
 *  @param i is a singleton item
 *  @param s is a reference to the canonical element of some set; if
 *  the insertion operation changes the canonical element, s will be changed
 *  @return true on success, false on failure
 */
bool SortedSets::insert(item i, sset& s) {
	assert (1 <= i && i <= n && 0 <= s && s <= n);
	assert (left(0) == 0 && right(0) == 0 && p(0) == 0);
	if (s == 0) { s = i; return true; }
	item x = s;
	while (1) {
		     if (kee(i) < kee(x) &&  left(x) != 0) x = left(x);
		else if (kee(i) > kee(x) && right(x) != 0) x = right(x);
		else break;
	}
	     if (kee(i) < kee(x))  left(x) = i;
	else if (kee(i) > kee(x)) right(x) = i;
	else return false;
	p(i) = x;
	return true;
}

/** Swap the positions of two nodes in the same tree.
 *  @param i is a node in a search tree
 *  @param j is another node in the same tree, which is not the parent of i;
 *  this is a helper method for the remove method; it exchanges the
 *  positions of the nodes in the tree
 */
void SortedSets::swap(item i, item j) {
	assert(1 <= i && i <= n && 1 <= j && j <= n && j != p(i));

	// save pointer fields for items i and j
	item li,ri,pi,lj,rj,pj;
	li = left(i); ri = right(i); pi = p(i);
	lj = left(j); rj = right(j); pj = p(j);

	// fixup fields in i's neighbors
	if (li != 0) p(li) = j;
	if (ri != 0) p(ri) = j;
	if (pi != 0) {
		if (i == left(pi)) left(pi) = j;
		else right(pi) = j;
	}
	// fixup fields in j's neighbors
	if (lj != 0) p(lj) = i;
	if (rj != 0) p(rj) = i;
	if (pj != 0) {
		if (j == left(pj)) left(pj) = i;
		else right(pj) = i;
	}

	// update fields in items i and j
	left(i) = lj; right(i) = rj; p(i) = pj;
	left(j) = li; right(j) = ri; p(j) = pi;

	// final fixup for the case that i was originally the parent of j
	     if (j == li) { left(j) = i; p(i) = j; }
	else if (j == ri) { right(j) = i; p(i) = j; }
}

/** Remove an item from a set.
 *  @param i is an item in some set
 *  @param s is a reference to the canonical element of some set; if
 *  the operation changes the canonical element, s will be changed
 */
void SortedSets::remove(item i, sset& s) {
	assert(1 <= i && i <= n && 1 <= s && s <= n);
	item c = (left(s) != 0 ? left(s) : right(s));
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
        }
        p(i) = left(i) = right(i) = 0;
	if (i == s) s = (p(c) == 0 ? c : p(c));
	return;
}

/** Form new set by combining two sets at an item.
 *  @param s1 is the canonical element of some set
 *  @param s2 is the canonical element of some set
 *  @param i is a singleton item with key value larger than those of the
 *  items in s1 and smaller than those of the items in s2
 *  @return new set formed by merging s1, i and s2
 */
sset SortedSets::join(sset s1, item i, sset s2) {
	assert(0 <= s1 && s1 <= n && 1 <= i && i <= n && 0 <= s2 && s2 <= n);
	left(i) = s1; right(i) = s2;
	if (s1 != 0) p(s1) = i;
	if (s2 != 0) p(s2) = i;
	return i;
}

/** Divide a set at an item
 *  @param i is an item in some set
 *  @param s is the canonical element of the set containing i
 *  @return the pair of sets [s1,s2] that results from splitting s into three
 *  parts; s1 (containing ityems with keys smaller than that of i), i itself,
 *  and s2 (contining items with keys larger than that of i)
 */
setPair SortedSets::split(item i, sset s) {
	assert(1 <= i && i <= n && 1 <= s && s <= n);
	sset y = i; setPair pair;
	pair.s1 = left(i); pair.s2 = right(i);
	for (sset x = p(y); x != 0; x = p(y)) {
		     if (y ==  left(x)) pair.s2 = join(pair.s2,x,right(x));
		else if (y == right(x)) pair.s1 = join(left(x),x,pair.s1);
		y = x;
	}
	left(i) = right(i) = p(i) = 0;
	p(pair.s1) = p(pair.s2) = 0;
	return pair;
}


/** Create a string representation of an item in a set.
 *  @param i is an item in some set
 *  @param s is a string in which the result will be returned
 *  @return a reference to s
 */
string& SortedSets::item2string(item i, string& s) const {
	stringstream ss;
	s = "";
	if (i == 0) return s;
	ss << Util::node2string(i,n,s) + ":" << key(i);
	if (p(i) == 0) ss << "*";
	s = ss.str();
	return s;
}

/** Create a string representation of a set.
 *  @param s is the canonical element of some set
 *  @param str is a string in which the result will be returned
 *  @return a reference to str
 */
string& SortedSets::set2string(sset s, string& str) const {
	string s1; str = "";
	if (s == 0) return str;
	if (left(s) != 0) str += "(" + set2string(left(s),s1) + ") ";
	str += item2string(s,s1);
	if (right(s) != 0) str += " (" + set2string(right(s),s1) + ")";
	return str;
}

/** Create a string representation of this object.
 *  @param s is a string in which the result will be returned
 *  @return a reference to s
 */
string& SortedSets::toString(string& s) const {
	string s1;
	s = "";
	// list singletons on a line
	bool someSingleton = false;
	for (sset i = 1; i <= n; i++) {
		if (p(i) == 0 && left(i) == 0 && right(i) == 0) {
			s += item2string(i,s1) + " ";
			someSingleton = true;
		}
	}
	if (someSingleton) s += "\n";
	// then remaining trees, one per line
	for (sset i = 1; i <= n; i++) {
		if (p(i) == 0 && (left(i) != 0 || right(i) != 0)) {
			s += set2string(i,s1) + "\n";
		}
	}
	return s;
}
