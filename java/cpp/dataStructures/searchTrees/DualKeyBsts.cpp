/** @file DualKeyBsts.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "DualKeyBsts.h"

#define left(x) node[x].left
#define right(x) node[x].right
#define p(x) node[x].p
#define kee1(x) node[x].kee
#define dmin(x) dmin[x]
#define dkey(x) dkey[x]

/** Constructor for DualKeyBsts class.
 *  @param N is the number of vertices in the constructed object
 */
DualKeyBsts::DualKeyBsts(int N) : SelfAdjBsts(N) { 
	dmin = new keytyp[N+1]; dkey = new keytyp[N+1];
	for (int i = 0; i <= N; i++) dmin(i) = dkey(i) = 0; 
} 

/** Destructor for DualKeyBsts class. */
DualKeyBsts::~DualKeyBsts() { delete [] dmin; delete [] dkey; }

/** Get the value of the second key of an item.
 *  @param i is an item in a search tree
 *  @return the value of the second key at i
 */
keytyp DualKeyBsts::key2(item i) {
	assert(1 <= i && i <= n);
	splay(i);
	return dmin(i) + dkey(i);
}

/** Return the "first" item in a set.
 *  This operation does not restructure the underlying search tree.
 *  @param s is the canonical element of some set
 *  @return the item with smallest key1 value in s
 */
item DualKeyBsts::first(sset s) const {
	while (left(s) != 0) s = left(s);
	return s;
}

/** Return the successor of an item in a set.
 *  This operation does not restructure the underlying search tree.
 *  @param i is an item in some set
 *  @return the item with largest key1 value in the set
 */
item DualKeyBsts::next(item i) const {
	if (right(i) != 0) {
		for (i = right(i); left(i) != 0; i = left(i)) {}
	} else {
		item c = i; i = p(i); 
		while (i != 0 && right(i) == c) { c = i; i = p(i); }
	}
	return i;
}

/** Perform a rotation.
 *  @param x is an item in a set (node in a search tree); the operation does
 *  a rotation at the parent of x, moving x up into its parent's place
 */
// moving x up to take its parent's place.
void DualKeyBsts::rotate(item x) {
	item y = p(x); if (y == 0) return;
	item a, b, c;
	if (x == left(y)) { a = left(x);  b = right(x); c = right(y); }
	else 		  { a = right(x); b = left(x);  c = left(y);  }
	SelfAdjBsts::rotate(x);

	dmin(a) += dmin(x); dmin(b) += dmin(x);

	dkey(x) = dkey(x) + dmin(x);
	keytyp dmx = dmin(x);
	dmin(x) = dmin(y);

	dmin(y) = dkey(y);
	if (b != 0) dmin(y) = min(dmin(y),dmin(b)+dmx);
	if (c != 0) dmin(y) = min(dmin(y),dmin(c));
	dkey(y) = dkey(y) - dmin(y);

	dmin(b) -= dmin(y); dmin(c) -= dmin(y);
}

/** Get the item in a set with a specified key value.
 *  @param k is a key value
 *  @param s is the canonical element of some set
 *  @return the item in the set that has k as its key1 value, or 0 if there
 *  is no such element
 */
item DualKeyBsts::access(keytyp k, sset s)  {
	assert (0 <= s && s <= n);
	item v = 0;
	while (true) {
		if (k < kee1(s)) {
			if (left(s) == 0) break;
			s = left(s);
		} else {
			v = s;
			if (right(s) == 0) break;
			s = right(s);
		}
	}
	splay(s);
	return (kee1(s) == k ? s : v);
}

/** Insert an item into a set.
 *  @param i is a singleton item
 *  @param s is the canonical element of some set
 *  @return the new set that results from adding i to s
 */
item DualKeyBsts::insert(item i, sset s) {
	assert (1 <= i && i <= n && 1 <= s && s <= n && i != s);
	assert (left(0) == 0 && right(0) == 0 && p(0) == 0);
	sset x = s; keytyp key2i = dmin(i);
	// save key2 value of i and correct dmin, dkey values
	// of i after splay brings it to the root
	while (true) {
		     if (kee1(i) < kee1(x) &&  left(x) != 0) x = left(x);
		else if (kee1(i) > kee1(x) && right(x) != 0) x = right(x);
		else break;
	}
	     if (kee1(i) < kee1(x))  left(x) = i;
	else if (kee1(i) > kee1(x)) right(x) = i;
	else fatal("DualKeyBsts::insert: inserting item with duplicate key");
	p(i) = x;
	splay(i); // note: apparent key value of i is >= that of any node on
		  // path back to root; this ensures correct dmin, dkey values
		  // assigned to other nodes during rotations
	item l = left(i); item r = right(i);
	keytyp dmi = key2i;
	if (l != 0 && dmin(l) + dmin(i) < dmi) dmi = dmin(l) + dmin(i);
	if (r != 0 && dmin(r) + dmin(i) < dmi) dmi = dmin(r) + dmin(i);
	if (l != 0) dmin(l) += (dmin(i) - dmi);
	if (r != 0) dmin(r) += (dmin(i) - dmi);
	dmin(i) = dmi;
	dkey(i) = key2i - dmi;
	return i;
}

/** Remove an item from a set.
 *  @param i is an item in some set
 *  @param s is the canonical element of the set containing i
 *  @return the canonical element of the new set that results from removing
 *  i from s
 */
item DualKeyBsts::remove(item i, sset s) {
	assert(1 <= i && i <= n && 1 <= s && s <= n);
	assert (left(0) == 0 && right(0) == 0 && p(0) == 0);

	// search for i in the tree to determine its key2 value
	item x = s; keytyp key2i = 0;
	while (x != i) {
		assert(x != 0);
		key2i += dmin(x);
		if (kee1(i) < kee1(x)) x = left(x);
		else x = right(x);
	}
	key2i += (dmin(i) + dkey(i));

	item j;
	if (left(i) == 0 || right(i) == 0) {
		// move the non-null child (if any) into i's position
		j = (left(i) == 0 ? right(i) : left(i));
		if (j != 0) { dmin(j) += dmin(i); p(j) = p(i); }
		if (p(i) != 0) {
			     if (i ==  left(p(i)))  left(p(i)) = j;
			else if (i == right(p(i))) right(p(i)) = j;
		}
	} else {
		// find first node to the left of i
		for (j = left(i); right(j) != 0; j = right(j)) {}
		// move j up into i's position in tree
		int pi = p(i);
		while (p(j) != i && p(j) != pi) splaystep(j);
		if (p(j) == i) rotate(j);
		// now i is the right child of j and has no left child
		right(j) = right(i); p(right(j)) = j;
		dmin(right(j)) += dmin(i);
	}
	p(i) = left(i) = right(i) = 0;
	dmin(i) = key2i; dkey(i) = 0;
	return splay(j);
}

/** Join two sets at an item.
 *  @param s1 is the canonical element of some set
 *  @param s2 is the canonical element of some set
 *  @param i is a singleton item with key larger than that of any item in s1,
 *  and smaller than that of any item in s2
 *  @return the new set formed by combining s1, i and s2
 */
sset DualKeyBsts::join(sset s1, item i, sset s2) {
	SelfAdjBsts::join(s1,i,s2);
	keytyp key2i = dmin(i) + dkey(i);
	if (s1 != 0) dmin(i) = min(dmin(i),dmin(s1));
	if (s2 != 0) dmin(i) = min(dmin(i),dmin(s2));
	dkey(i) = key2i - dmin(i);
	if (s1 != 0) dmin(s1) -= dmin(i);
	if (s2 != 0) dmin(s2) -= dmin(i);
	return i;
}

/** Divide a set at an item.
 *  @param i is an item in some set
 *  @param s is the canonical element of the set containing i
 *  @return the pair of sets [s1,s2] obtained by dividing s into three parts,
 *  s1,i and s2, where the keys of the items in s1 are smaller than the key
 *  of i and keys of items in s2 are larger than the key of i
 */
setPair DualKeyBsts::split(item i, sset s) {
	setPair pair = SelfAdjBsts::split(i,s);
	if (pair.s1 != 0) dmin(pair.s1) += dmin(i);
	if (pair.s2 != 0) dmin(pair.s2) += dmin(i);
	dmin(i) += dkey(i); dkey(i) = 0;
	return pair;
}

/** Construct a string representation of a single item.
 *  @param i is an item in some set
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& DualKeyBsts::item2string(item i, string& s) const {
	string s1;
	s = "";
	if (i == 0) return s;
	s += Util::node2string(i,n,s1) + ":";
	s += Util::num2string(kee1(i),s1) + ":";
	s += Util::num2string(dmin(i),s1) + ":";
	s += Util::num2string(dkey(i),s1);
	return s;
}
