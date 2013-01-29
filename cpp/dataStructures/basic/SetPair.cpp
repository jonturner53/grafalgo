/** @file SetPair.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "SetPair.h"

namespace grafalgo {

/** Constructor for SetPair class.
 *  @param n1 defines the set of index values 1..n1 on which the sets 
 *  are defined
 */
SetPair::SetPair(int n1) : Adt(n1) { makeSpace(n()); }

/** Destructor for SetPair class */
SetPair::~SetPair() { freeSpace(); }

/** Allocate and initialize space for SetPair.
 *  @param size is number of index values to provide space for
 */
void SetPair::makeSpace(int size) {
	try {
		nxt = new index[size+1]; prv = new index[size+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "SetPair::makeSpace: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}

	nn = size;
	inHead = inTail = 0;
	for (index i = 1; i < size; i++) {
		nxt[i] = -(i+1); prv[i+1] = -i;
	}
	nxt[size] = prv[1] = 0;
	outHead = 1; outTail = n();
	numIn = 0; numOut = size;

	nxt[0] = prv[0] = 0;
}

/** Free dynamic storage used by list. */
void SetPair::freeSpace() { delete [] nxt; delete [] prv; }

/** Resize a SetPair object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void SetPair::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "SetPair::resize:" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this SetPair.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void SetPair::expand(int size) {
	if (size <= n()) return;
	SetPair old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Copy into this SetPair from source. */
void SetPair::copyFrom(const SetPair& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = source.firstIn(); x != 0; x = source.nextIn(x))
		swap(x);
}

/** Remove all elements from inSet. */
void SetPair::clear() { while (firstIn() != 0) swap(firstIn()); }

/** Move an index from one list to the other.
 *  Inserts swapped index at end of the other list
 *  @param i is the index to be swapped
 */
void SetPair::swap(index i) {
	if (i < 1 || i > n()) return;
	if (isIn(i)) {
		if (nxt[i] == 0) inTail = prv[i];
		else prv[nxt[i]] = prv[i];

		if (prv[i] == 0) inHead = nxt[i];
		else nxt[prv[i]] = nxt[i];

		nxt[i] = 0;
		if (outTail == 0) {
			outHead = i; prv[i] = 0;
		} else {
			nxt[outTail] = -i; prv[i] = -outTail;
		}
		outTail = i;
		numIn--; numOut++;
	} else {
		if (nxt[i] == 0) outTail = -prv[i];
		else prv[-nxt[i]] = prv[i];

		if (prv[i] == 0) outHead = -nxt[i];
		else nxt[-prv[i]] = nxt[i];

		nxt[i] = 0;
		if (inTail == 0) {
			inHead = i; prv[i] = 0;
		} else {
			nxt[inTail] = i; prv[i] = inTail;
		}
		inTail = i;
		numIn++; numOut--;
	}
}

/** Create a string representation of a given string.
 *  @param s is string used to return value
 *  @return a reference to s
 */
string& SetPair::toString(string& s) const {
	s = "{";
	for (index i = firstIn(); i != 0; i = nextIn(i)) {
		string s1; s += Adt::item2string(i,s1);
		if (i != lastIn()) s += " ";
	}
	s += "} {";
	for (index i = firstOut(); i != 0; i = nextOut(i)) {
		string s1; s += Adt::item2string(i,s1);
		if (i != lastOut()) s += " ";
	}
	s += "}";
	return s;
}

} // ends namespace
