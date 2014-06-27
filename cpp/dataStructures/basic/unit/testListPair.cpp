/** \file TestListPair.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ListPair.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n = 10; ListPair lp(n);

	cout << "writing initial pair " << lp << endl;

	Utest::assertTrue(!lp.isIn(1) && lp.firstIn() == 0 && lp.lastIn() == 0,
			  "initial inSet non-empty");
	Utest::assertTrue(lp.isOut(1) && lp.firstOut() != 0 && lp.lastOut() !=0,
			  "initial outSet does not contain all elements");

	lp.swap(1);
	Utest::assertEqual(lp.toString(),"{a} {b c d e f g h i j}",
			   "set pair does not match expected value");
	lp.swap(4);
	Utest::assertEqual(lp.toString(),"{a d} {b c e f g h i j}",
			   "set pair does not match expected value");
	lp.swap(10);
	Utest::assertEqual(lp.toString(),"{a d j} {b c e f g h i}",
			   "set pair does not match expected value");
	lp.swap(2); lp.swap(5); lp.swap(9);
	Utest::assertEqual(lp.toString(),"{a d j b e i} {c f g h}",
			   "set pair does not match expected value");
	cout << "writing balanced pair " << lp << endl;

	lp.swap(4); lp.swap(5); lp.swap(1); lp.swap(9);
	Utest::assertEqual(lp.toString(),"{j b} {c f g h d e a i}",
			   "set pair does not match expected value");

	lp.swap(2,0); 
	Utest::assertEqual(lp.toString(),"{j} {b c f g h d e a i}",
			   "set pair does not match expected value");

	lp.swap(10,9); 
	Utest::assertEqual(lp.toString(),"{} {b c f g h d e a i j}",
			   "set pair does not match expected value");

	lp.swap(5,0); 
	Utest::assertEqual(lp.toString(),"{e} {b c f g h d a i j}",
			   "set pair does not match expected value");

	lp.swap(6,0); 
	Utest::assertEqual(lp.toString(),"{f e} {b c g h d a i j}",
			   "set pair does not match expected value");
	lp.swap(8,5); 
	Utest::assertEqual(lp.toString(),"{f e h} {b c g d a i j}",
			   "set pair does not match expected value");
	lp.swap(4,6); 
	Utest::assertEqual(lp.toString(),"{f d e h} {b c g a i j}",
			   "set pair does not match expected value");

	cout << "writing final pair " << lp << endl;
}

/**
 *  Unit test for ListPair data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
