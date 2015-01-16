/** @file Partition.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Partition.h"

#define p(x) node[x].p
#define rank(x) node[x].rank

namespace grafalgo {

/** Initialize partition so that every element is in separate set.
 *  @param n defines the index range on which the partition is defined
 */
Partition::Partition(int n) : Adt(n) { makeSpace(); clear(); }

/** Destructor for Partition. */
Partition::~Partition() { freeSpace(); }

/** Allocate and initialize space for list.  */
void Partition::makeSpace() { node = new pnode[n()+1]; }

/** Free dynamic storage used by list. */
void Partition::freeSpace() { delete [] node; }

/** Resize a Partition object.
 *  The old value is discarded.
 *  @param n is the size of the resized object.
 */
void Partition::resize(int n) { freeSpace(); Adt::resize(n); makeSpace(); }

/** Expand the space available for this Partition.
 *  Rebuilds old value in new space.
 *  @param n is the size of the resized object.
 */
void Partition::expand(int n) {
	if (n <= this->n()) return;
	Partition old(this->n());
	old.copyFrom(*this);
	resize(n);
	this->copyFrom(old);
}

/** Inititialize data structure. */
void Partition::clear() {
	for (index x = 0; x <= n(); x++) { p(x) = x; rank(x) = 0; }
}

/** Copy another Partition object to this one.
 *  @param source is another Partition object
 */
void Partition::copyFrom(const Partition& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = 1; x <= source.n(); x++) {
		p(x) = source.node[x].p; rank(x) = source.node[x].rank;
	}
}

/** Find and return the canonical element of a set.
 *  @param x is an index in some set
 *  @return the canonical element of the set containing x
 */
index Partition::find(index x) {
	assert(valid(x));
	index root;
	for (root = x; p(root) != root; root = p(root)) ;
	while (x != root) { int px = p(x); p(x) = root; x = px; }
	return p(x);
}

/** Combine two sets.
 *  @param x is the canonical element of some set.
 *  @param y is the canonical element of another (distinct) set
 *  @return the canonical element of the set obtained by combining
 *  the given sets
 */
index Partition::link(index x, index y) {
	assert(valid(x) && valid(y) && p(x) == x && p(y) == y && x != y);
	if (rank(x) > rank(y)) {
		index t = x; x = y; y = t;
	} else if (rank(x) == rank(y))
		rank(y)++;
	return p(x) = y;
}

/** Get the canonical element of a set without restructuring the set.
 *  @param x is an index in some set
 *  @return the canonical element of the set containing x
 */
int Partition::findroot(int x) const {
	assert(valid(x));
	if (x == p(x)) return(x);
	else return findroot(p(x));
}

/** Create a string representation of the partition.
 *  @param s is a reference to a string in which the partition is returned.
 *  @return a reference to s
 */
string Partition::toString() const {
	string s = "{";
	int *size = new int[n()+1];
	int *root = new int[n()+1];
	for (int i = 1; i <= n(); i++) { root[i] = findroot(i); size[i] = 0; }
	for (int i = 1; i <= n(); i++) size[root[i]]++;
	// for root nodes x, size[x] is number of nodes in tree
	bool isFirst = true;
	for (int i = 1; i <= n(); i++) {
		if (size[i] > 1) { // i is a root of non-trivial block
			int j;
			for (j = 1; root[j] != i; j++) {}
			if (isFirst) isFirst = false;
			else s += " ";
			s += "[" + Adt::index2string(j);
			if (j == i) s += "*";
			for (j++; j <= n(); j++) {
				if (root[j] == i) {
					s += " " + Adt::index2string(j);
					if (j == i) s += "*";
				}
			}
			s += "]";
		}
	}
	s += "}";
	delete [] size; delete [] root;
	return s;
}

} // ends namespace
