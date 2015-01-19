/** \file TestGlist.cpp
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Adt.h"
#include "Glist.h"
#include "Utest.h"

using namespace grafalgo;

bool basicTests() {
	Glist<int> l1; int n1 = l1.n();

	for (int i = 1; i <= n1; i++) {
		chekCond(l1, !l1.find(i),"a" + to_string(i) + " !l1.find(i)");
	}
	chekState(l1, "aa", "[]");

	// single element list
	l1.addLast(1);
	chekState(l1, "b1", "[1]");
	chekCond(l1, !l1.empty(), "b2 !l1.empty()");
	chekCond(l1, l1.find(1), "b3 l1.find(1)");
	
	// checking list building operations
	for (int i = 3; i <= n1; i += 2) l1.addLast(i);
	chekState(l1, "c1", "[1, 3, 5, 7, 9]");
	chekCond(l1, l1.find(5)>0, "c2 l1.find(5)>0");
	chekCond(l1, l1.find(4)==0, "c3 l1.find(4)==0");
	chekExpr(l1, l1.value(l1.last()), "c4 l1.last()", 9);
	chekExpr(l1, l1.value(l1.next(l1.find(3))),
			  "l1.value(l1.next(l1.find(3)))", 5);
	chekExpr(l1, l1.value(l1.get(2)), "c6 l1.value(l1.get(2))", 3);
	l1.addFirst(4);
	l1.insert(6,l1.find(7));
	chekState(l1, "c7", "[4, 1, 3, 5, 7, 6, 9]");

	// checking remove operations
	l1.removeFirst();
	chekState(l1, "d1", "[1, 3, 5, 7, 6, 9]");
	chekCond(l1, l1.find(4)==0, "d2 l1.find(4)==0");
	l1.remove(l1.find(6));
	l1.remove(l1.find(1));
	chekState(l1, "d3", "[3, 5, 7, 9]");
	l1.remove(l1.find(7));
	chekState(l1, "e1", "[3, 5, 9]");
	l1.remove(l1.find(3)); 
	chekState(l1, "e2", "[5, 9]");
	l1.removeLast();
	chekState(l1, "e3", "[5]");
	chekCond(l1, !l1.empty(), "e4 !l1.empty()");
	l1.removeFirst(); 
	chekState(l1, "e5", "[]");
	chekCond(l1, l1.empty(), "e6 l1.empty()");

	// second list, expanding size
	l1.addFirst(1); l1.addFirst(2); l1.addFirst(3);
	Glist<int> l2; l2 = l1;
	chekState(l2, "f1", "[3, 2, 1]");
	int n2 = 27; l2.expand(n2);
	chek(l2, l2.n(), "f2 l2.n()", 27, "[3, 2, 1]");
	l2.addLast(30);
	chekCond(l2, l2.find(30)>0, "f3 l2.find(30)>0");
	chekCond(l2, l2.find(29)==0, "f4 l2.find(29)==0");
	chekExpr(l2, l2.n(), "f5 l2.n()", 27);
	chekState(l2, "f6", "[3, 2, 1, 30]");
	l2.insert(2,l2.find(1));
	chekState(l2, "f7", "[3, 2, 1, 2, 30]");
	chekExpr(l2, l2.find(2,0), "f8 l2.find(2,0)", l2.get(2));
	chekExpr(l2, l2.find(2,l2.get(2)),
			  "l2.find(2,l2.get(2))", l2.get(4));

	// expanding list further
	for (int i = 31; i <= 60; i++) l2.addLast(i);
	for (int i = 31; i <= 60; i++)
		chekCond(l2, l2.find(i)>0, "f"+to_string(i) + " l2.find(i)>0");
	chekExpr( l2, l2.n(), "f70 l2.n()", 54);

	l2.resize(30); l2.addFirst(1); l2.addFirst(2); l2.addFirst(3);
	chekState(l2, "g1", "[3, 2, 1]");

	// test equality operator
	l1.clear(); l2.clear();
	chek(l1, l1==l1, "h1 l1==l1", true, "[]");
	chek(l1, l1==l2, "h2 l1==l2", true, "[]");
	l1.addFirst(1);
	chek(l1, l1==l2, "h3 l1==l2", false, "[1]");
	l2.addLast(1);
	chek(l2, l1==l2, "h4 l1==l2", true, "[1]");
	l1.addLast(5); l2.addLast(5);
	l1.addFirst(3); l2.addFirst(3);
	chek(l1, l1==l2, "h5 l1==l2", true, "[3, 1, 5]");
	l1.removeFirst();
	chek(l1, l1==l2, "h6 l1==l2", false, "[1, 5]");

	Glist<string> l3;
	l3.addFirst("abc"); l3.addLast("def ghi"); l3.addFirst("x y z");
	chekState(l3, "i1", "[x y z, abc, def ghi]");
	int a = l3.find("abc");
	chekSexpr(l3, l3.value(a), "i2 l3.value(a)", "abc");
	chekSexpr(l3, l3.value(l3.next(a)),
		  "i3 l3.value(l3.next(a))", "def ghi");

	return true;
}

/**
 *  Unit test for Glist data structure.
 */
int main() {
	cout << "running basic tests\n";
	if (basicTests()) cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
