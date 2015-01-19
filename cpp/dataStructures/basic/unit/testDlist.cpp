/** @file TestDlist.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dlist.h"
#include "Utest.h"

using namespace grafalgo;

bool basicTests() {
	Dlist l1; int n1 = l1.n();

	for (int i = 1; i <= n1; i++) {
		chekCond(l1, !l1.member(i),
			"a" + to_string(i) + " !l1.member(i)");
	}
	chekState(l1, "aa", "[]");

	// single element list
	l1.addLast(1);
	chek(l1, l1.isConsistent(), "b1 l1.isConsistent()", true, "[a]");
	chekCond(l1, !l1.empty(), "b2 !l1.empty()");
	chekCond(l1, l1.member(1), "b3 l1.member(1)");
	
	// checking list building operations
	for (int i = 3; i <= n1; i += 2) l1.addLast(i);
	chek(l1, l1.isConsistent(), "c1 l1.isConsistent()", true,
			"[a c e g i]");
	chekCond(l1, l1.member(5), "c2 l1.member(5)");
	chekCond(l1, !l1.member(4), "c3 !l1.member(4)");
	chekExpr(l1, l1.last(), "c4 l1.last()", 9);
	chekExpr(l1, l1.next(3), "c5 l1.next(3)", 5);
	chekExpr(l1, l1.get(2), "c6 l1.get(2)", 3);
	l1.addFirst(4); l1.insert(6,7);
	chekState(l1, "c7", "[d a c e g f i]");

	// checking remove operations
	l1.removeFirst();
	chek(l1, l1.isConsistent(), "d1 l1.isConsistent()", true,
			"[a c e g f i]");
	chekCond(l1, !l1.member(4), "d2 !l1.member(4)");
	l1.removeNext(7); l1.removeNext(0);
	chekState(l1, "d3", "[c e g i]");
	l1.remove(7);
	chekState(l1, "e1", "[c e i]");
	l1.remove(3); 
	chek(l1, l1.isConsistent(), "e2 l1.isConsistent()", true, "[e i]");
	l1.removeLast();
	chek(l1, l1.isConsistent(), "e3 l1.isConsistent()", true, "[e]");
	chekCond(l1, !l1.empty(), "e4 !l1.empty()");
	l1.removeFirst(); 
	chek(l1, l1.isConsistent(), "e5 l1.isConsistent()", true, "[]");
	chekCond(l1, l1.empty(), "e6 l1.empty()");

	// second list, expanding size
	l1.addFirst(1); l1.addFirst(2); l1.addFirst(3);
	Dlist l2; l2 = l1;
	chekState(l2, "f1", "[c b a]");
	int n2 = 27; l2.expand(n2);
	chek(l2, l2.n(), "f2 l2.n()", 27, "[3 2 1]");
	l2.addLast(30);
	chekCond(l2, l2.member(30), "f3 l2.member(30)");
	chekCond(l2, !l2.member(29), "f4 l2.member(29)");
	chekExpr(l2, l2.n(), "f5 l2.n()", 54);

	// expanding list further
	for (int i = 31; i <= 60; i++) l2.addLast(i);
	for (int i = 31; i <= 60; i++)
		chekCond(l2, l2.member(i),"f" + to_string(i) + " l2.member(i)");
	chekExpr(l2, l2.n(), "f70 l2.n()", 108);

	l2.resize(30); l2.addFirst(1); l2.addFirst(2); l2.addFirst(3);
	chek(l2, l2.isConsistent(), "g1 l2.isConsistent()", true, "[3 2 1]");

	// test equality operator
	l1.clear(); l2.clear();
	chek(l1, l1==l1, "h1 l1==l1", true, "[]");
	chek(l1, l1==l2, "h2 l1==l2", true, "[]");
	l1.addFirst(1);
	chek(l1, l1==l2, "h3 l1==l2", false, "[a]");
	l2.addLast(1);
	chek(l2, l1==l2, "h4 l1==l2", true, "[1]");
	l1.addLast(5); l2.addLast(5);
	l1.addFirst(3); l2.addFirst(3);
	chek(l1, l1==l2, "h5 l1==l2", true, "[c a e]");
	l1.removeFirst();
	chek(l1, l1==l2, "h6 l1==l2", false, "[a e]");
	return true;
}

/**
 *  Unit test for Dlist data structure.
 */
int main() {
	cout << "testing\n";
	basicTests();
	cout << "passed\n";
}
