/** @file UiSetPair.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "UiSetPair.h"

/** Constructor for UiSetPair class.
 *  @param n1 defines the set of integers 1..n1 on which the sets are defined
 */
UiSetPair::UiSetPair(int n1) : nn(n1) {
	assert(nn >= 0); 
	nxt = new int[nn+1]; prv = new int[nn+1];
	reset();
}

/** Destructor for UiSetPair class */
UiSetPair::~UiSetPair() { delete [] nxt; delete [] prv; }

/** Reset the pair.
 *  Puts all elements in the the "out-set".
 */
void UiSetPair::reset() {
	inHead = inTail = 0;
	for (int i = 1; i < nn; i++) {
		nxt[i] = -(i+1); prv[i+1] = -i;
	}
	nxt[nn] = prv[1] = 0;
	outHead = 1; outTail = nn;
	numIn = 0; numOut = nn;

	nxt[0] = prv[0] = 0;
}

/** Move an item from one list to the other.
 *  Inserts swapped item at end of the other list
 *  @param i is the item to be swapped
 */
void UiSetPair::swap(int i) {
	if (i < 1 || i > nn) return;
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
string& UiSetPair::toString(string& s) const {
	s = "[ ";
	for (int i = firstIn(); i != 0; i = nextIn(i)) {
		string s1;
		s = s + Util::node2string(i,n(),s1) + " ";
	}
	s += "] [ ";
	for (int i = firstOut(); i != 0; i = nextOut(i)) {
		string s1;
		s = s + Util::node2string(i,n(),s1) + " ";
	}
	s += "]";
	return s;
}
