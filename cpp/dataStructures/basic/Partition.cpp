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
 *  @param nn defines the index range on which the partition is defined
 */
Partition::Partition(int nn, int noOpt1) : Adt(nn) {
	makeSpace(n());
}

/** Destructor for Partition. */
Partition::~Partition() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
void Partition::makeSpace(int size) {
	try { node = new pnode[size+1]; } catch (std::bad_alloc e) {
		string s = "Partition::makeSpace: insufficient space for "
			   + to_string(size) + "elements";
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by list. */
void Partition::freeSpace() { delete [] node; }

/** Resize a Partition object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void Partition::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "Partition::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Partition.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Partition::expand(int size) {
	if (size <= n()) return;
	Partition old(this->n());
	old.copyFrom(*this);
	resize(size);
	this->copyFrom(old);
}

/** Inititialize data structure. */
void Partition::clear() {
	for (index x = 0; x <= n(); x++) { p(x) = x; rank(x) = 0; }
}

/** Copy into list from source. */
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
			s += "[" + Adt::item2string(j);
			if (j == i) s += "*";
			for (j++; j <= n(); j++) {
				if (root[j] == i) {
					s += " " + Adt::item2string(j);
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
