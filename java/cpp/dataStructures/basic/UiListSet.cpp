/** @file UiListSet.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "UiListSet.h"

/** Constructor for UiListSet.
 *  @param nI1 defines the set of integers 1..nI1 on which the
 *  lists are defined; each integer can be on at most one list
 *  @param nL1 specifies the number of lists in the set
 */
UiListSet::UiListSet(int nI1, int nL1) : nI(nI1), nL(nL1) {
	int i;
	nxt = new item[nI+1]; lh = new listhdr[nL+1];
	for (i = 0; i <= nL; i++) {
		lh[i].head = lh[i].tail = 0;
	}
	for (i = 0; i <= nI; i++) nxt[i] = -1;
}

/** Destrictor for UiListSet class. */
UiListSet::~UiListSet() { delete [] nxt; delete [] lh; }

/** Add an item to a list.
 *  @param i is a list item, which is currently not in any list
 *  @param j is a list number; the item i is added to the end of list j
 */
void UiListSet::addLast(item i, alist j) {
	if (i == 0) return;
	if (lh[j].head == 0) lh[j].head = i;
	else nxt[lh[j].tail] = i;
	lh[j].tail = i; nxt[i] = 0;
}

/** Remove the first item from a list.
 *  @param j is a list number
 *  @return the first item on list j or 0, if it is empty
 */
int UiListSet::removeFirst(alist j) {
	int i = lh[j].head;
	if (i == 0) return 0;
	lh[j].head = nxt[i]; nxt[i] = -1;
	return i;
}

/** Add an item to the front of a list.
 *  @param i is a list item, which is currently not in any list
 *  @param j is a list number; the item i is added to the front of list j
 */
void UiListSet::addFirst(item i, alist j) {
	if (i == 0) return;
	if (lh[j].head == 0) lh[j].tail = i;
	nxt[i] = lh[j].head;
	lh[j].head = i;
}

/** Build a string representation of a list.
 *  @param j is a list number
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& UiListSet::list2string(alist j, string& s) const {
	int i;
	s = "";
	s += j + ": ";
	for (i = first(j); i != 0; i = next(i)) {
		string s1;
		s += Util::node2string(i,nI,s1) + " ";
	}
	s += "\n";
	return s;
}

/** Build a string representation of a set of lists.
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& UiListSet::toString(string& s) const {
	alist j;
	s = "";
	for (j = 1; j <= nL; j++) {
		string s1;
		if (lh[j].head != 0) s += list2string(j,s1);
	}
	return s;
}
