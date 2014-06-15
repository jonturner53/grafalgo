/** \file TestSetPair.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "SetPair.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n = 10; SetPair sp(n);

	cout << "writing initial pair " << sp.toString() << endl;

	Utest::assertTrue(!sp.isIn(1) && sp.firstIn() == 0 && sp.lastIn() == 0,
			  "initial inSet non-empty");
	Utest::assertTrue(sp.isOut(1) && sp.firstOut() != 0 && sp.lastOut() !=0,
			  "initial outSet does not contain all elements");

	sp.swap(1);
	Utest::assertEqual(sp.toString(),"{a} {b c d e f g h i j}",
			   "set pair does not match expected value");
	sp.swap(4);
	Utest::assertEqual(sp.toString(),"{a d} {b c e f g h i j}",
			   "set pair does not match expected value");
	sp.swap(10);
	Utest::assertEqual(sp.toString(),"{a d j} {b c e f g h i}",
			   "set pair does not match expected value");
	sp.swap(2); sp.swap(5); sp.swap(9);
	Utest::assertEqual(sp.toString(),"{a d j b e i} {c f g h}",
			   "set pair does not match expected value");
	cout << "writing balanced pair " << sp.toString() << endl;

	sp.swap(4); sp.swap(5); sp.swap(1); sp.swap(9);
	Utest::assertEqual(sp.toString(),"{j b} {c f g h d e a i}",
			   "set pair does not match expected value");

	cout << "writing final pair " << sp.toString() << endl;
}

/**
 *  Unit test for SetPair data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
