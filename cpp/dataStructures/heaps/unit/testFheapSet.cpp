/** \file TestFheapSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "FheapSet.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	FheapSet hset; string s;

	cout << "writing empty heap set: " << hset.toString(s) << endl;
	//Utest::assertEqual(hset.toString(s), "", "initial heap not correct");

	hset.setKey(1,5);
	int h1 = 1; h1 = hset.insert(3,h1,4); h1 = hset.insert(5,h1,6);
	Utest::assertTrue(hset.findmin(h1) == 3, "min item does not match");
	cout << "writing hset with 3 item heap\n" << hset.toString(s) << endl;

	hset.setKey(8,2);
	int h2 = 8; h2 = hset.insert(9,h2,7); h2 = hset.insert(7,h2,3);
	Utest::assertTrue(hset.findmin(h2) == 8, "min item does not match");
	cout << "writing hset with two 3 item heaps\n"
	     << hset.toString(s) << endl;

	h1 = hset.meld(h1,h2);
	Utest::assertTrue(hset.findmin(h1) == 8, "min item does not match");
	cout << "writing hset with 6 item heap\n"
	     << hset.toString(s) << endl;

	h1 = hset.decreasekey(9,6,h1);
	Utest::assertTrue(hset.findmin(h1) == 9, "min item does not match");
	cout << "writing hset after decreasekey\n"
	     << hset.toString(s) << endl;

	h1 = hset.deletemin(h1);
	Utest::assertTrue(hset.findmin(h1) == 8, "min item does not match");
	cout << "writing modified hset with 5 item heap\n"
	     << hset.toString(s) << endl;

	h1 = hset.deletemin(h1);
	Utest::assertTrue(hset.findmin(h1) == 7, "min item does not match");
	cout << "writing modified hset with 4 item heap\n"
	     << hset.toString(s) << endl;

	h1 = hset.decreasekey(5,4,h1);
	cout << "writing hset after decreasekey\n"
	     << hset.toString(s) << endl;
}

/**
 *  Unit test for FheapSet data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
