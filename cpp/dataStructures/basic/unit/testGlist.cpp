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
	int n1 = 10; Glist<int> l1(n1);

	Utest::assertTrue(l1.empty(), "initial list not empty");
	cout << "writing empty list: " << l1 << endl;

	for (int i = 1; i <= n1; i++) {
		Utest::assertTrue(!l1.member(i),
			"member returns true on empty list");
	}

	l1.addFirst(1);
	cout << "writing one item list: " << l1 << endl;
	Utest::assertEqual(l1.toString(), "[1]",
		"mismatch on adding first item");
	
	Utest::assertTrue(!l1.empty(),"list with one item reports empty");
	Utest::assertTrue(l1.member(1),"member 1 not reported in list");

	for (int i = 1; i <= n1; i += 2) l1.addLast(i);
	cout << "writing longer list: " << l1 << endl;
	Utest::assertEqual(l1.toString(), "[1, 1, 3, 5, 7, 9]",
		"mismatch on list [1, 1, 3, 5, 7, 9]");

	Utest::assertTrue(l1.contains(5),
		"member 5 not reported in list");
	Utest::assertTrue(!l1.contains(4),
		"non-member 4 is reported in list");
	l1.insert(5,l1.find(1));
	Utest::assertEqual(l1.toString(), "[1, 5, 1, 3, 5, 7, 9]",
		"mismatch on list [1, 5, 1, 3, 5, 7, 9]");
	int i[10]; int p = 1;
	for (int j = l1.first(); j != 0; j = l1.next(j)) i[p++] = j;
	for (int j = l1.last(); j != 0; j = l1.prev(j)) {
		p--;
		Utest::assertEqual(j,i[p],
			"index mismatch at position " + to_string(p));
	}
	Utest::assertEqual(l1.value(i[3]),1,"item at position 3 != 1");
	Utest::assertEqual(l1.value(i[6]),7,"item at position 6 != 7");

	l1.removeFirst();
	Utest::assertEqual(l1.toString(), "[5, 1, 3, 5, 7, 9]",
		"mismatch on list [5, 1, 3, 5, 7, 9]");
	l1.remove(l1.find(3)); 
	Utest::assertEqual(l1.toString(), "[5, 1, 5, 7, 9]",
		"mismatch on list [5, 1, 5, 7, 9]");

	l1.remove(l1.find(7));
	Utest::assertEqual(l1.toString(), "[5, 1, 5, 9]",
		"mismatch on list [5, 1, 5, 9]");

	l1.removeLast();
	Utest::assertEqual(l1.toString(), "[5, 1, 5]",
		"mismatch on list [5, 1, 5]");

	Utest::assertTrue(!l1.empty(),
		"non-empty list reported as empty");

	l1.removeFirst();
	Utest::assertEqual(l1.toString(), "[1, 5]",
		"mismatch on list [1, 5]");

	l1.clear();
	Utest::assertTrue(l1.empty(),
		"empty list reported as non-empty");

	l1.addFirst(1); l1.addFirst(2); l1.addFirst(3);
	Glist<int> l2(n1); l2 = l1;
	Utest::assertEqual(l2.toString(), "[3, 2, 1]",
		"mismatch on list [3, 2, 1] a");
	Utest::assertTrue(l2 == l1, "assignment produces unequal pair");
	int n2 = 27; l2.expand(n2);
	Utest::assertEqual(l2.toString(), "[3, 2, 1]",
		"mismatch on list [3, 2, 1] b");
	Utest::assertTrue(l2 == l1, "expansion produces unequal pair");

	l2.resize(30); l2.addFirst(1); l2.addFirst(2); l2.addFirst(3);
	cout << "writing numeric list: " << l2 << endl;
	Utest::assertEqual(l2.toString(), "[3, 2, 1]",
		"mismatch on list [3, 2, 1] c");

	// test equals method
	l1.clear(); l2.clear();
	Utest::assertTrue(l1.equals(l1),"equals(): list testing unequal "
					"to itself");
	Utest::assertTrue(l1.equals(l2),"equals(): empty lists testing as "
					"unequal");
	l1.addFirst(1);
	Utest::assertTrue(!l1.equals(l2),"equals(): different lists testing as "
					"equal");
	l2.addLast(1);
	Utest::assertTrue(l1.equals(l2),"equals(): equal lists testing as "
					"unequal");
	l1.addLast(5); l2.addLast(5);
	l1.addFirst(3); l2.addFirst(3);
	Utest::assertTrue(l1.equals(l2),"equals(): equal lists testing as "
					"unequal");
	l1.removeFirst();
	Utest::assertTrue(!l1.equals(l2),"equals(): unequal lists testing as "
					"equal");

	Glist<string> l3;
	l3.addFirst("abc"); l3.addLast("def ghi"); l3.addFirst("x y z");
	cout << l3 << endl;
	Utest::assertEqual(l3.toString(), "[x y z, abc, def ghi]",
		"mismatch on list [x y z, abc, def ghi]");
	int a = l3.find("abc");
	Utest::assertEqual(l3.value(a), "abc", "mismatch on abc");
	Utest::assertEqual(l3.value(l3.next(a)), "def ghi",
			"mismatch on def ghi");

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
