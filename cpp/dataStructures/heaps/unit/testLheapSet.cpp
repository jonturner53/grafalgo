/** \file TestLheapSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "LheapSet.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	LheapSet hset; string s;

	cout << "writing empty heap set: " << hset.toString(s) << "\n\n";

	hset.setkey(1,5); hset.setkey(3,4); hset.setkey(5,6);
	int h1 = 1; h1 = hset.insert(3,h1); h1 = hset.insert(5,h1);
	Utest::assertTrue(hset.findmin(h1) == 3, "min item does not match");
	cout << "writing hset with 3 item heap\n" << hset.toString(s) << endl;

	hset.setkey(8,2); hset.setkey(9,7); hset.setkey(7,3);
	int h2 = 8; h2 = hset.insert(9,h2); h2 = hset.insert(7,h2);
	Utest::assertTrue(hset.findmin(h2) == 8, "min item does not match");
	cout << "writing hset with two 3 item heaps\n"
	     << hset.toString(s) << endl;

	h1 = hset.meld(h1,h2);
	Utest::assertTrue(hset.findmin(h1) == 8, "min item does not match");
	cout << "after melding\n" << hset.toString(s) << endl;

	h1 = hset.deletemin(h1);
	Utest::assertTrue(hset.findmin(h1) == 7, "min item does not match");
	cout << "after deletemin\n" << hset.toString(s) << endl;

	h1 = hset.deletemin(h1);
	Utest::assertTrue(hset.findmin(h1) == 3, "min item does not match");
	cout << "after deletemin\n" << hset.toString(s) << endl;
}

/**
 *  Unit test for LheapSet data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
