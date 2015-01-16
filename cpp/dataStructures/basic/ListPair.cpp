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
	succ = src.succ; pred = src.pred;
	src.succ = src.pred = nullptr;
}

/** Destructor for ListPair. */
ListPair::~ListPair() { freeSpace(); }

/** Allocate space for list.
 *  Amount of space allocated is determined by value of n().
 */
void ListPair::makeSpace() { succ = new index[n()+1]; pred = new index[n()+1]; }

/** Initialize this ListPair.  */
void ListPair::init() {
	inHead = inTail = 0;
	outHead = 1; outTail = n();
	for (index i = 1; i < n(); i++) {
		succ[i] = -(i+1); pred[i+1] = -i;
	}
	succ[n()] = pred[1] = 0;
	numIn = 0; numOut = n();
	succ[0] = pred[0] = 0;
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
	std::copy(src.succ, src.succ+src.n()+1, succ);
	std::copy(src.pred, src.pred+src.n()+1, pred);
	succ[0] = pred[0] = 0;
	if (src.n() == n()) return;
	// add extra index values to end of outList
	for (index x = src.n() + 1; x <= n(); x++) {
		succ[x] = -x+1; pred[x] = -(x-1);
	}
	pred[src.n()+1] = -outTail; succ[n()] = 0;
	if (outHead == 0) outHead = src.n()+1;
	else succ[outTail] = -src.n();
	outTail = n(); numOut += (n() - src.n());
}

/** Free dynamic storage used by list. */
void ListPair::freeSpace() { delete [] succ; delete [] pred; }

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
	index *old_succ = succ; index *old_pred = pred; int old_n = n();
	Adt::expand(size); makeSpace();
	std::copy(old_succ, old_succ+old_n+1, succ);
	std::copy(old_pred, old_pred+old_n+1, pred);

	// add new elements to end of outList
	for (index x = old_n + 1; x <= n(); x++) {
		succ[x] = -(x+1); pred[x] = -(x-1);
	}
	pred[old_n+1] = -outTail; succ[n()] = 0;
	if (outHead == 0) outHead = old_n+1;
	else succ[outTail] = -(old_n+1);
	outTail = n(); numOut += (n() - old_n);
	delete [] old_succ; delete [] old_pred;
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
	succ = src.succ; pred = src.pred;
	src.succ = src.pred = nullptr;
	return *this;
}

/** Equality relation.
 *  @param other is a reference to a ListPair to be compared to this
 *  @return true if the in-lists are identical; the out-lists may differ
 */
bool ListPair::operator==(const ListPair& other) {
	if (this == &other) return true;
	if (firstIn() !=  other.firstIn()) return false;
	for (index x = firstIn(); x != 0; x = nextIn(x))
		if (other.nextIn(x) != nextIn(x)) return false;
	return true;
}

/** Remove all elements from inSet. */
void ListPair::clear() { while (firstIn() != 0) swap(firstIn()); }

/** Swap index from one list to the other.
 *  @param i is index of item in one list
 *  @param j is an index of an item in the other list; i is inserted
 *  into the other list right after item j; if j == 0, i is
 *  inserted at the beginning of the list.
 */
void ListPair::swap(index i, index j) {
	assert(valid(i) && (j == 0 || valid(j)));
	assert((isIn(i) && (j == 0 || isOut(j))) ||
	       (isOut(i) && (j == 0 || isIn(j))));
	if (isIn(i)) {
		// first remove i from in-list
		if (i == inTail) inTail = pred[i];
		else pred[succ[i]] = pred[i];
		if (i == inHead) inHead = succ[i];
		else succ[pred[i]] = succ[i];

		// now add i to out-list
		if (numOut == 0) {
			succ[i] = pred[i] = 0; outHead = outTail = i;
		} else if (j == 0) {
			succ[i] = -outHead; pred[i] = 0;
			pred[outHead] = -i; outHead = i;
		} else if (j == outTail) {
			succ[j] = -i; pred[i] = -j; succ[i] = 0; outTail = i;
		} else {
			succ[i] = succ[j]; pred[i] = -j; 
			pred[-succ[j]] = -i; succ[j] = -i;
		}
		numIn--; numOut++;
	} else {
		// first remove i from out-list
		if (i == outTail) outTail = -pred[i];
		else pred[-succ[i]] = pred[i];
		if (i == outHead) outHead = -succ[i];
		else succ[-pred[i]] = succ[i];

		// now add i to in-list
		if (numIn == 0) {
			succ[i] = pred[i] = 0; inHead = inTail = i;
		} else if (j == 0) {
			succ[i] = inHead; pred[i] = 0;
			pred[inHead] = i; inHead = i;
		} else if (j == inTail) {
			succ[j] = i; pred[i] = j; succ[i] = 0; inTail = i;
		} else {
			succ[i] = succ[j]; pred[i] = j; 
			pred[succ[j]] = i; succ[j] = i;
		}
		numIn++; numOut--;
	}
	return;
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
