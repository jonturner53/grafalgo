/** @file DkBstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "DkBstSet.h"

#define left(x) node[x].left
#define right(x) node[x].right
#define p(x) node[x].p
#define kee1(x) node[x].kee
#define dmin(x) dmin[x]
#define dkey(x) dkey[x]

namespace grafalgo {

/** Constructor for DkBstSet class.
 *  @param size defines the index range for the constructed object.
 */
DkBstSet::DkBstSet(int size) : BalBstSet(size) {
	makeSpace(size);
}

/** Destructor for DkBstSet class. */
DkBstSet::~DkBstSet() { freeSpace(); }

/** Allocate and initialize space for DkBstSet.
 *  @param size is number of index values to provide space for
 */
void DkBstSet::makeSpace(int size) {
	try {
		dmin = new keytyp[size+1]; dkey = new keytyp[size+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by DkBstSet. */
void DkBstSet::freeSpace() {
	delete [] dmin; delete [] dkey;
}

/** Reinitialize data structure, creating single node trees. */
void DkBstSet::clear() {
	SaBstSet::clear();
	for (int i = 0; i <= n(); i++) dmin(i) = dkey(i) = 0; 
}

/** Resize a DkBstSet object, discarding old value.
 *  @param size is the size of the resized object.
 */
void DkBstSet::resize(int size) {
	freeSpace();
	SaBstSet::resize(size);
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "DkBstSet::resize::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void DkBstSet::expand(int size) {
	if (size <= n()) return;
	DkBstSet old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}
/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void DkBstSet::copyFrom(const DkBstSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	SaBstSet::copyFrom(source);
	for (index x = 1; x <= n(); x++) {
		dmin(x) = source.dmin[x]; dkey(x) = source.dkey[x];
	}
}

/** Get the value of the second key of a node.
 *  @param i is a node in a search tree
 *  @return the value of the second key at i
 */
keytyp DkBstSet::key2(index i) {
	assert(1 <= i && i <= n());
	splay(i);
	return dmin(i) + dkey(i);
}

/** Perform a rotation.
 *  @param x is a node in a bst (node in a search tree); the operation does
 *  moves x up into its parent's place
 */
void DkBstSet::rotate(index x) {
	index y = p(x); if (y == 0) return;
	index a, b, c;
	if (x == left(y)) { a = left(x);  b = right(x); c = right(y); }
	else 		  { a = right(x); b = left(x);  c = left(y);  }
	BalBstSet::rotate(x);

	if (a != 0) dmin(a) += dmin(x); 
	if (b != 0) dmin(b) += dmin(x);

	dkey(x) += dmin(x);
	keytyp dmx = dmin(x);
	dmin(x) = dmin(y);

	dmin(y) = dkey(y);
	if (b != 0) dmin(y) = min(dmin(y),dmin(b)+dmx);
	if (c != 0) dmin(y) = min(dmin(y),dmin(c));
	dkey(y) = dkey(y) - dmin(y);

	dmin(b) -= dmin(y); dmin(c) -= dmin(y);
}

/** Get the node in a bst with a specified key value.
 *  @param k is a key value
 *  @param t is the root of some bst
 *  @return the node with the largest key1 value that is <=k;
 *  if there is no such node, return the node with the smallest key1
 */
index DkBstSet::access(keytyp k, bst t)  {
	assert (0 <= t && t <= n());
	if (t == 0) return 0;
	index v = 0;
	while (true) {
		if (k < kee1(t)) {
			if (left(t) == 0) break;
			t = left(t);
		} else {
			v = t;
			if (right(t) == 0) break;
			t = right(t);
		}
	}
	return (kee1(t) == k ? t : v);
}

/** Insert a node into a bst.
 *  @param i is a singleton node
 *  @param t is the root of some bst
 *  @return the new bst that results from adding i to t
 */

rework for balanced trees
or, could revert to self-adjusting and provide
implementation of suc with splay - also ugly

index DkBstSet::insert(index i, bst t) {
	assert (1 <= i && i <= n() && 1 <= t && t <= n() && i != t);
	assert (left(0) == 0 && right(0) == 0 && p(0) == 0);
	bst x = t; keytyp key2i = dmin(i);
	// save key2 value of i and correct dmin, dkey values
	// of i after splay brings it to the root
	while (true) {
		     if (kee1(i) < kee1(x) &&  left(x) != 0) x = left(x);
		else if (kee1(i) > kee1(x) && right(x) != 0) x = right(x);
		else break;
	}
	     if (kee1(i) < kee1(x))  left(x) = i;
	else if (kee1(i) > kee1(x)) right(x) = i;
	else Util::fatal("DkBstSet::insert: inserting node with duplicate key");
	p(i) = x;
	splay(i); // note: apparent key value of i is >= that of any node on
		  // path back to root; this ensures correct dmin, dkey values
		  // assigned to other nodes during rotations
	index l = left(i); index r = right(i);
	keytyp dmi = key2i;
	if (l != 0 && dmin(l) + dmin(i) < dmi) dmi = dmin(l) + dmin(i);
	if (r != 0 && dmin(r) + dmin(i) < dmi) dmi = dmin(r) + dmin(i);
	if (l != 0) dmin(l) += (dmin(i) - dmi);
	if (r != 0) dmin(r) += (dmin(i) - dmi);
	dmin(i) = dmi;
	dkey(i) = key2i - dmi;
	return i;
}

/** Remove a node from a bst.
 *  @param i is a node in some bst
 *  @param t is the root of the bst containing i
 *  @return the root of the new bst that results from removing
 *  i from t
 */
index DkBstSet::remove(index i, bst t) {
	assert(1 <= i && i <= n() && 1 <= t && t <= n());
	assert (left(0) == 0 && right(0) == 0 && p(0) == 0);

	// search for i in the tree to determine its key2 value
	index x = t; keytyp key2i = 0;
	while (x != i) {
		assert(x != 0);
		key2i += dmin(x);
		if (kee1(i) < kee1(x)) x = left(x);
		else x = right(x);
	}
	key2i += (dmin(i) + dkey(i));

	index j;
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

/** Join two bsts at a node.
 *  @param t1 is the root of some bst
 *  @param t2 is the root of some bst
 *  @param i is a singleton node with key larger than that of any node in t1,
 *  and smaller than that of any node in t2
 *  @return the new bst formed by combining t1, i and t2
 */
bst DkBstSet::join(bst t1, index i, bst t2) {
	SaBstSet::join(t1,i,t2);
	keytyp key2i = dmin(i) + dkey(i);
	if (t1 != 0) dmin(i) = min(dmin(i),dmin(t1));
	if (t2 != 0) dmin(i) = min(dmin(i),dmin(t2));
	dkey(i) = key2i - dmin(i);
	if (t1 != 0) dmin(t1) -= dmin(i);
	if (t2 != 0) dmin(t2) -= dmin(i);
	return i;
}

/** Divide a bst at a node.
 *  @param i is a node in some bst
 *  @param t is the root of the bst containing i
 *  @return the pair of bst [t1,t2] obtained by dividing s into three parts,
 *  t1,i and t2, where the keys of the nodes in t1 are smaller than the key
 *  of i and keys of nodes in t2 are larger than the key of i
 */
BstSet::BstPair DkBstSet::split(index i, bst t) {
	BstPair pair = SaBstSet::split(i,t);
	if (pair.t1 != 0) dmin(pair.t1) += dmin(i);
	if (pair.t2 != 0) dmin(pair.t2) += dmin(i);
	dmin(i) += dkey(i); dkey(i) = 0;
	return pair;
}

/** Construct a string representation of a single node.
 *  @param i is a node in some bst
 *  @param t is a string in which the result is returned
 *  @return a reference to t
 */
string& DkBstSet::node2string(index i, string& s) const {
	s = "";
	if (i == 0) return s;
	stringstream ss;
	ss << Adt::item2string(i,s);
	if (p(i) == 0) ss << "*";
	ss << ":" << kee1(i) << ":" << dmin(i) << ":" << dkey(i);
	s = ss.str();
	return s;
}

} // ends namespace
