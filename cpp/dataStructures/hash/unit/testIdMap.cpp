/** \file TestList.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "IdMap.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n1 = 10; IdMap map1(n1); string s;

	Utest::assertEqual(map1.firstId(), 0, "initial map not empty");
	cout << "writing empty idMap: " << map1 << endl;

	map1.addPair(1234);
	Utest::assertEqual(map1.getId(1234),1,"wrong id for first item");
	cout << "writing singleton idMap: " << map1 << endl;

	Utest::assertEqual(map1.toString(s), "{1234:1}",
		"mismatch on adding first item");

	map1.addPair(2345); map1.addPair(3456);
	Utest::assertEqual(map1.getId(2345),2,"wrong id for second item");
	Utest::assertEqual(map1.getId(3456),3,"wrong id for third item");
	Utest::assertEqual(map1.toString(s), "{1234:1 2345:2 3456:3}",
		"mismatch after adding third item");
	cout << "writing 3 idMap: " << map1 << endl;

	map1.dropPair(2345);
	Utest::assertEqual(map1.toString(s), "{1234:1 3456:3}",
		"mismatch after releasing second id");

	map1.addPair(4567);
	Utest::assertEqual(map1.toString(s), "{1234:1 3456:3 4567:4}",
		"mismatch on adding after releasing id");

	map1.clear();
	Utest::assertEqual(map1.toString(s), "{}",
			   "mismatch after clearing map");
}

/**
 *  Unit test for List data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
