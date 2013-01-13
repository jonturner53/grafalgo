/** \file TestDheap.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dheap.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	Dheap heap(10,2); string s;

	cout << "writing initial heap: " << heap.toString(s) << endl;
	Utest::assertEqual(heap.toString(s), "", "initial heap not correct");

	heap.insert(1,5); heap.insert(3,4); heap.insert(5,6);
	Utest::assertTrue(heap.member(1), "inserted item not in heap");
	Utest::assertTrue(heap.member(3), "inserted item not in heap");
	Utest::assertTrue(heap.member(5), "inserted item not in heap");
	Utest::assertTrue(heap.size() == 3, "size mismatch");
	cout << "writing 3 item heap: " << heap.toString(s) << endl;

	heap.insert(8,2); heap.insert(9,7); heap.insert(7,3);
	Utest::assertTrue(heap.member(8), "inserted item not in heap");
	Utest::assertTrue(heap.member(9), "inserted item not in heap");
	Utest::assertTrue(heap.member(7), "inserted item not in heap");
	Utest::assertTrue(heap.size() == 6, "size mismatch");
	cout << "writing 6 item heap: " << heap.toString(s) << endl;

	int u = heap.deletemin();
	Utest::assertTrue(u == 8, "deletemin returned wrong value");
	Utest::assertTrue(!heap.member(u), "deleted item still in heap");

	u = heap.deletemin();
	Utest::assertTrue(u == 7, "deletemin returned wrong value");
	Utest::assertTrue(!heap.member(u), "deleted item still in heap");
}

/**
 *  Unit test for Dheap data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
