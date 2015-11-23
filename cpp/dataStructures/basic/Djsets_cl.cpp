/** @file Djsets_cl.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Djsets_cl.h"

namespace grafalgo {

/** Constructor for Djsets_cl. 
 *  @param n defines the set of integers 1..n on which this object is defined
 */
Djsets_cl::Djsets_cl(int n) : Adt(n) { makeSpace(); clear(); }

/** Default constructor for Djsets_cl. 
 */
Djsets_cl::Djsets_cl() : Adt(10) { makeSpace(); clear(); }

/** Destructor for Djsets_cl */
Djsets_cl::~Djsets_cl() { freeSpace(); }

/** Allocate and initialize space for Djsets_cl.
 *  @param size is number of index values to provide space for
 */
void Djsets_cl::makeSpace() { node = new lnode[n()+1]; }

/** Free dynamic storage used by Djsets_cl. */
void Djsets_cl::freeSpace() { delete [] node; }

/** Resize a Djsets_cl object.
 *  The old value is discarded.
 *  @param n is the size of the resized object.
 */
void Djsets_cl::resize(int n) {
	freeSpace(); Adt::resize(n); makeSpace(); clear();
}

/** Expand the space available for this Djsets_cl.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Djsets_cl::expand(int size) {
	if (size <= n()) return;
	Djsets_cl old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Clear the data structure, moving all index values into single node lists.
 */
void Djsets_cl::clear() {
	for (index i = 0; i <= n(); i++) {
		node[i].succ = node[i].pred = i;
	}
}

/** Copy into Djsets_cl from source. */
void Djsets_cl::copyFrom(const Djsets_cl& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = 1; x <= source.n(); x++) {
		node[x].succ = source.next(x);
		node[x].pred = source.prev(x);
	}
}

/** Remove an index from its list.
 *  This method turns the index into a singleton list.
 *  @param i is an index
 */
void Djsets_cl::remove(index i) {
	assert(valid(i));
	node[node[i].pred].succ = node[i].succ;
	node[node[i].succ].pred = node[i].pred;
	node[i].succ = node[i].pred = i;
}


/** Join two lists together.
 *  @param i is an index on some list
 *  @param j is an index on some other list
 *  Note: the method will corrupt the data structure if
 *  i and j already belong to the same list; it's the caller's
 *  responsiblity to ensure this doesn't happen
 */
void Djsets_cl::join(index i, index j) {
	if (i == 0 || j == 0) return;
if (!valid(i) || !valid(j)) cerr << "join(" << i << "," << j << ") n=" << n() << "\n";
	assert(valid(i) && valid(j));
	node[node[i].succ].pred = node[j].pred;
	node[node[j].pred].succ = node[i].succ;
	node[i].succ = j; node[j].pred = i;
}

/** Produce a string representation of the object.
 *  @return the string
 */
string Djsets_cl::toString() const {
	index i, j; string s;
	bool mark[n()+1];
	s = "{";
	int cnt = 0;
	for (i = 1; i <= n(); i++) mark[i] = false;
	for (i = 1; i <= n(); i++) {
		if (mark[i]) continue; 
		mark[i] = true;
		if (node[i].succ == i) continue;
		if (++cnt > 1) s += ", ";
		s += "[";
		s += Adt::index2string(i);
		for (j = node[i].succ; j != i; j = node[j].succ) {
			mark[j] = true;
			s += " ";
			s += Adt::index2string(j);
		}
		s += "]";
	}
	s += "}";
	return s;
}

} // ends namespace
