/** \file TestDheapSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "DheapSet.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	DheapSet hs(20,3);

	cout << "writing empty heap: " << hs.toString(1) << endl;
	cout << "starting insertions\n";
	for (int i = 1; i <= 20; i++) {
		cout << "inserting " << i << " " << (i*7)%13 << endl;
		hs.insert(i,(i*7)%13,1);
		cout << hs.toString(1) << endl;
	}
	cout << "starting changeKeyMins\n";
	for (int i = 1; i <= 10; i++) {
		int j = hs.findMin(1);
		cout << "changing key of " << j << " to "
		     << (i*11)%23 << endl;
		hs.changeKeyMin((i*11)%23,1);
		cout << hs.toString(1) << endl;
	}
	cout << "starting deleteMins\n";
	for (int i = 1; i <= 15; i++) {
		int j = hs.deleteMin(1);
		cout << j << "  " << hs.toString(1) << endl;
	}
}

/**
 *  Unit test for HeapSet data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
