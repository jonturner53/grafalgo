/** @file UiRlist.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "UiRlist.h"

#define succ(x) node[x].next
#define pred(x) node[x].prev

/** Constructor for UiRlist class.
 *  @param N1 defines the set of integers 1..N1 on which the lists are defined.
 */
UiRlist::UiRlist(int N1) : N(N1) {
	assert(N >= 0);
	node = new ListNode[N+1];
	for (item i = 1; i <= N; i++) { succ(i) = pred(i) = i; }
	succ(0) = pred(0) = 0;
}

/** Destructor for UiRlist class. */
UiRlist::~UiRlist() { delete [] node; }

/** Remove first item from a list.
 *  Has no effect on a singleton list, since all items must
 *  be on some list.
 *  @param t is the last item on some list
 *  @return the last item of the modified list.
 */
item UiRlist::pop(item t) {
	assert(0 <= t && t <= N);
	item h = succ(t);
	if (h == t) return t;
	if (pred(h) == t) succ(t) = succ(h);
	else              succ(t) = pred(h);
	if (pred(succ(t)) == h) pred(succ(t)) = t;
	else                    succ(succ(t)) = t;
	succ(h) = pred(h) = h;
	return t;
}

/** Combine two lists.
 *  @param t1 is the last item on some list
 *  @param t2 is the last item on a second list
 *  @return the last item on the list formed by appending the second
 *  list to the end of the first
 */
item UiRlist::join(item t1, item t2) {
	assert(0 <= t1 && t1 <= N && 0 <= t2 && t2 <= N);
	if (t1 == 0) return t2;
	else if (t2 == 0 || t2 == t1) return t1;

	item h1 = succ(t1); item h2 = succ(t2);
	succ(t1) = h2; succ(t2) = h1;
	if (t1 == pred(h1)) pred(h1) = t2;
	else                succ(h1) = t2;
	if (t2 == pred(h2)) pred(h2) = t1;
	else                succ(h2) = t1;

	return t2;
}

/** Reverse a list.
 *  @param t is the last item on some list
 *  @return the last item on the list obtained by reversing the original
 *  list.
 */
item UiRlist::reverse(item t) {
	assert(0 <= t && t <= N);
	item h = succ(t);
	if (t == 0 || h == t) return t;
	if (t == pred(h)) pred(h) = succ(h);
	succ(h) = t;
	return h;
}

/** Build a string representation of a list.
 *  @param t is the last item on some list
 *  @param s is the string in which the result is returned
 *  @return a reference to s
 */
string& UiRlist::toString(item t, string& s) const {
	item h = succ(t);
	s = ""; string s1;
	if (t == 0) s += "-";
	else if (h == t) s += Util::node2string(h,N,s1);
	else {
		item x = h; item y = t;
		do {
			s += Util::node2string(x,N,s1) + " ";
			if (y == pred(x)) {
				y = x; x = succ(x);
			} else {
				y = x; x = pred(x);
			}
		} while (x != h);
	}
	return s;
}
