/** \file TestList.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Adt.h"
#include "List.h"
#include "Utest.h"

using namespace grafalgo;

bool basicTests() {
	int n1 = 10; List l1(n1);

	Utest::assertTrue(l1.empty(), "initial list not empty");
	Utest::assertTrue(l1.isConsistent(), "initial list not consistent");
	cout << "writing empty list: " << l1 << endl;

	for (int i = 1; i <= n1; i++) {
		Utest::assertTrue(!l1.member(i),
			"member returns true on empty list");
	}

	// test illegal argument exceptions
	try {
		l1.addFirst(n1+1);
		Utest::assertTrue(false,"addFirst fails to detect illegal "
					"argument");
	} catch(IllegalArgumentException e) { cout << endl; }
	try {
		l1.addFirst(-1);
		Utest::assertTrue(false,"addFirst fails to detect illegal "
					"argument");
	} catch(IllegalArgumentException e) { cout << endl; }
	try {
		l1.addFirst(1);
	} catch(IllegalArgumentException e) { 
		Utest::assertTrue(false,"addFirst incorrectly detects illegal "
					"argument");
	}
	cout << "writing one item list: " << l1 << endl;
	Utest::assertEqual(l1.toString(), "[a]",
		"mismatch on adding first item");
	Utest::assertTrue(l1.isConsistent(), "new list not consistent");
	
	Utest::assertTrue(!l1.empty(),"list with one item reports empty");
	Utest::assertTrue(l1.member(1),"member 1 not reported in list");

	for (int i = 1; i <= n1; i += 2) l1.addLast(i);
	cout << "writing longer list: " << l1 << endl;
	Utest::assertEqual(l1.toString(), "[a c e g i]",
		"mismatch on list [a c e g i]");
	Utest::assertTrue(l1.isConsistent(), "longer list not consistent");

	Utest::assertTrue(l1.member(5),
		"member 5 not reported in list");
	Utest::assertTrue(!l1.member(4),
		"non-member 4 is reported in list");

	l1.removeFirst();
	Utest::assertEqual(l1.toString(), "[c e g i]",
		"mismatch on list [c e g i]");
	Utest::assertTrue(l1.isConsistent(), "not consistent after removal");
	Utest::assertTrue(!l1.member(1),
		"non-member 1 is reported in list");

	l1.removeNext(5); 
	Utest::assertEqual(l1.toString(), "[c e i]",
		"mismatch on list [c e i]");

	l1.removeNext(0);
	Utest::assertEqual(l1.toString(), "[e i]",
		"mismatch on list [e i]");
	Utest::assertTrue(l1.isConsistent(),
			  "not consistent after next removal");

	l1.removeFirst();
	Utest::assertEqual(l1.toString(), "[i]",
		"mismatch on list [i]");
	Utest::assertTrue(l1.isConsistent(),
			  "not consistent after next removal");

	Utest::assertTrue(!l1.empty(),
		"non-empty list reported as empty");

	l1.removeFirst();
	Utest::assertEqual(l1.toString(), "[]",
		"mismatch on list []");
	Utest::assertTrue(l1.isConsistent(),
			  "not consistent after final removal");

	Utest::assertTrue(l1.empty(),
		"empty list reported as non-empty");

	l1.addFirst(1); l1.addFirst(2); l1.addFirst(3);
	List l2(n1); l2 = l1;
	Utest::assertEqual(l2.toString(), "[c b a]",
		"mismatch on list [c b a]");
	int n2 = 27; l2.expand(n2);
	Utest::assertEqual(l2.toString(), "[3 2 1]",
		"mismatch on list [3 2 1]");

	l2.resize(30); l2.addFirst(1); l2.addFirst(2); l2.addFirst(3);
	cout << "writing numeric list: " << l2 << endl;
	Utest::assertEqual(l2.toString(), "[3 2 1]",
		"mismatch on list [3 2 1]");
	Utest::assertTrue(l1.isConsistent(),
			  "not consistent after three more adds");

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

	return true;
}

/**
 *  Unit test for List data structure.
 */
int main() {
	cout << "running basic tests\n";
	if (basicTests()) cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
