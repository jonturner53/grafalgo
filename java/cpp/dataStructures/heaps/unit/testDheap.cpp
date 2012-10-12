/** \file TestDheap.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dheap.h"
#include "Utest.h"

void basicTests() {
	Dheap heap(10,2); string s;

	cout << "writing initial heap: " << heap.toString(s);
	Utest::assertEqual(heap.toString(s), "\n", "initial heap not correct");

	heap.insert(1,5); heap.insert(3,4); heap.insert(5,6);
	cout << "writing new heap: " << heap.toString(s);
	Utest::assertEqual(heap.toString(s), "(c,4) (a,5) (e,6) \n",
					     "mismatch after 3 inserts");

	heap.insert(8,2); heap.insert(9,7); heap.insert(7,3);
	cout << "writing new heap: " << heap.toString(s);
	Utest::assertEqual(heap.toString(s), "(h 2) (c,4) (g,3) (e,6) (i,7) "
					     "(a,5)\n",
					     "mismatch after more 3 inserts");
}

/**
 *  Unit test for Parititon data structure.
 */
main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
