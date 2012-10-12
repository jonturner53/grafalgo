/** @file UiClist.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "UiClist.h"

/** Constructor for UiClist. 
 *  @param N1 defines the set of integers 1..N on which this object is defined
 */
UiClist::UiClist(int N1) : N(N1) {
	assert(N >= 0);
	node = new lnode[N+1];
	reset();
}

/** Destructor for UiClist */
UiClist::~UiClist() { delete [] node; }

/** Remove an item from its list.
 *  This method turns the item into a singleton list.
 *  @param i is a list item
 */
void UiClist::remove(item i) {
	assert(0 <= i && i <= N);
	node[node[i].prev].next = node[i].next;
	node[node[i].next].prev = node[i].prev;
	node[i].next = node[i].prev = i;
}

/** Reset the data structure, moving all items into single node lists.
 */
void UiClist::reset() {
	for (item i = 0; i <= N; i++) { node[i].next = node[i].prev = i; }
}

/** Join two lists together.
 *  @param i is a list item
 *  @param j is a list item on some other list
 *  Note: the method will corrupt the data structure if
 *  i and j already belong to the same list; it's the caller's
 *  responsiblity to ensure this doesn't happen
 */
void UiClist::join(item i, item j) {
	assert(0 <= i && i <= N && 0 <= j && j <= N);
	if (i == 0 || j == 0) return;
	node[node[i].next].prev = node[j].prev;
	node[node[j].prev].next = node[i].next;
	node[i].next = j; node[j].prev = i;
}

/** Produce a string representation of the object.
 *  @param s is a string in which the result will be returned
 *  @return a reference to s
 */
string& UiClist::toString(string& s) const {
	stringstream ss;
	item i, j; string s1;
	int *mark = new int[N+1];
	int cnt = 0;
	for (i = 1; i <= N; i++) mark[i] = 0;
	for (i = 1; i <= N; i++) {
		if (mark[i]) continue; 
		mark[i] = 1;
		if (node[i].next == i) continue;
		if (++cnt > 1) s += ", ";
		ss << "(";
		ss << Util::node2string(i,N,s1);
		for (j = node[i].next; j != i; j = node[j].next) {
			mark[j] = 1;
			ss << " ";
			ss << Util::node2string(j,N,s1);
		}
		ss << ")";
	}
	delete [] mark;
	s = ss.str();
	return s;
}
