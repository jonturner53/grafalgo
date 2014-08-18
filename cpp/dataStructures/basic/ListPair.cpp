/** @file ListPair.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ListPair.h"

namespace grafalgo {

/** Constructor for list pair.
 *  @param nn1 specifies the maximum index
 */
ListPair::ListPair(int nn1) : Adt(nn1) {
	makeSpace(); init();
}

/** Copy constructor.
 *  @param src is a ListPair whose contents are copied to this ListPair.
 */
ListPair::ListPair(const ListPair& src) : Adt(src.n()) {
	makeSpace(); copyContents(src);
}

/** Move constructor.
 *  @param src is a ListPair whose contents may be re-used
 */
ListPair::ListPair(ListPair&& src) : Adt(src.n()) {
	inHead = src.inHead; inTail = src.inTail;
	outHead = src.outHead; outTail = src.outTail;
	numIn = src.numIn; numOut = src.numOut;
	nxt = src.nxt; prv = src.prv;
	src.nxt = src.prv = nullptr;
}

/** Destructor for ListPair. */
ListPair::~ListPair() { freeSpace(); }

/** Allocate and initialize space for list.
 *  Amount of space allocated is determined by value of n().
 */
void ListPair::makeSpace() {
	try {
		nxt = new index[n()+1]; prv = new index[n()+1];
	} catch (std::bad_alloc e) {
		string s = "ListPair: insufficient space for "
		   	   + to_string(n()) + " list elements";
		throw OutOfSpaceException(s);
	}
}

/** Initialize this ListPair.  */
void ListPair::init() {
	inHead = inTail = 0;
	outHead = 1; outTail = n();
	for (index i = 1; i < n(); i++) {
		nxt[i] = -(i+1); prv[i+1] = -i;
	}
	nxt[n()] = prv[1] = 0;
	numIn = 0; numOut = n();
	nxt[0] = prv[0] = 0;
}

/** Copy the contents of another ListPair to this one.
 *  Specifically, the inList is copied. The outList of the result
 *  may include elements not present in the source ListPair.
 *  @param src is the ListPair whose contents is to be copied.
 *  Note that the size of the source ListPair must be no larger
 *  than the size of this ListPair.
 */
void ListPair::copyContents(const ListPair& src) {
	inHead = src.inHead; inTail = src.inTail;
	outHead = src.outHead; outTail = src.outTail;
	numIn = src.numIn; numOut = src.numOut;
	std::copy(src.nxt, src.nxt+src.n()+1, nxt);
	std::copy(src.prv, src.prv+src.n()+1, prv);
	nxt[0] = prv[0] = 0;
	if (src.n() == n()) return;
	// add extra index values to end of outList
	for (index x = src.n() + 1; x <= n(); x++) {
		nxt[x] = -x+1; prv[x] = -(x-1);
	}
	prv[src.n()+1] = -outTail; nxt[n()] = 0;
	if (outHead == 0) outHead = src.n()+1;
	else nxt[outTail] = -src.n();
	outTail = n(); numOut += (n() - src.n());
}

/** Free dynamic storage used by list. */
void ListPair::freeSpace() { delete [] nxt; delete [] prv; }

/** Resize a ListPair object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
void ListPair::resize(int size) {
	freeSpace(); Adt::resize(size); makeSpace(); init();
}

/** Expand the space available for this ListPair.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void ListPair::expand(int size) {
	if (size <= n()) return;
	index *old_nxt = nxt; index *old_prv = prv; int old_n = n();
	Adt::expand(size); makeSpace();
	std::copy(old_nxt, old_nxt+old_n+1, nxt);
	std::copy(old_prv, old_prv+old_n+1, prv);

	// add new elements to end of outList
	for (index x = old_n + 1; x <= n(); x++) {
		nxt[x] = -x+1; prv[x] = -(x-1);
	}
	prv[old_n+1] = -outTail; nxt[n()] = 0;
	if (outHead == 0) outHead = old_n+1;
	else nxt[outTail] = -old_n+1;
	outTail = n(); numOut += (n() - old_n);
	delete [] old_nxt; delete [] old_prv;
}

/** Assignment operator (copy).
 *  @param other is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
ListPair& ListPair::operator=(const ListPair& src) {
	if (this == &src) return *this;
	if (src.n() > n()) resize(src.n());
	copyContents(src);
	return *this;
}

/** Assignment operator (move).
 *  @param other is a reference to a list to be compared to this
 *  @return true if the two lists are equal
 */
ListPair& ListPair::operator=(ListPair&& src) {
	if (this == &src) return *this;
	freeSpace(); Adt::resize(src.n());
	inHead = src.inHead; inTail = src.inTail;
	outHead = src.outHead; outTail = src.outTail;
	numIn = src.numIn; numOut = src.numOut;
	nxt = src.nxt; prv = src.prv;
	src.nxt = src.prv = nullptr;
	return *this;
}

/** Equality relation.
 *  @param other is a reference to a ListPair to be compared to this
 *  @return true if the in-lists are identical; the out-lists may differ
 */
bool ListPair::operator==(const ListPair& other) {
	if (this == &other) return true;
	if (numIn != other.numIn) return false;
	index x = firstIn(); index y = other.firstIn();
	while (x != 0) {
		if (x != y) return false;
		x = nextIn(x); y = other.nextIn(y);
	}
	return true;
}

/** Remove all elements from inSet. */
void ListPair::clear() { while (firstIn() != 0) swap(firstIn()); }

/** Swap index from one list to the other.
 *  @param i is index of item in one list
 *  @param j is an index of an item in the other list; i is inserted
 *  into the other list right after item j; if j == 0, i is
 *  inserted at the beginning of the list.
 *  @return true if the swap succeeded, else false
 */
bool ListPair::swap(index i, index j) {
	if (i < 1 || i > n() || j < 0 || j > n()) return false;
	if (isIn(i) && (j == 0 || isOut(j))) { // swap i out
		// first remove i from in-list
		if (i == inTail) inTail = prv[i];
		else prv[nxt[i]] = prv[i];
		if (i == inHead) inHead = nxt[i];
		else nxt[prv[i]] = nxt[i];

		// now add i to out-list
		if (numOut == 0) {
			nxt[i] = prv[i] = 0; outHead = outTail = i;
		} else if (j == 0) {
			nxt[i] = -outHead; prv[i] = 0;
			prv[outHead] = -i; outHead = i;
		} else if (j == outTail) {
			nxt[j] = -i; prv[i] = -j; nxt[i] = 0; outTail = i;
		} else {
			nxt[i] = nxt[j]; prv[i] = -j; 
			prv[-nxt[j]] = -i; nxt[j] = -i;
		}
		numIn--; numOut++;
		return true;
	} else if (isOut(i) && (j == 0 || isIn(j))) { // swap i in
		// first remove i from out-list
		if (i == outTail) outTail = -prv[i];
		else prv[-nxt[i]] = prv[i];
		if (i == outHead) outHead = -nxt[i];
		else nxt[-prv[i]] = nxt[i];

		// now add i to in-list
		if (numIn == 0) {
			nxt[i] = prv[i] = 0; inHead = inTail = i;
		} else if (j == 0) {
			nxt[i] = inHead; prv[i] = 0;
			prv[inHead] = i; inHead = i;
		} else if (j == inTail) {
			nxt[j] = i; prv[i] = j; nxt[i] = 0; inTail = i;
		} else {
			nxt[i] = nxt[j]; prv[i] = j; 
			prv[nxt[j]] = i; nxt[j] = i;
		}
		numIn++; numOut--;
		return true;
	}
	return false;
}

/** Create a string representation of a given string.
 *  @return the string
 */
string ListPair::toString() const {
	string s = "{";
	for (index i = firstIn(); i != 0; i = nextIn(i)) {
		s += Adt::index2string(i);
		if (i != lastIn()) s += " ";
	}
	s += "} {";
	for (index i = firstOut(); i != 0; i = nextOut(i)) {
		s += Adt::index2string(i);
		if (i != lastOut()) s += " ";
	}
	s += "}";
	return s;
}

} // ends namespace
