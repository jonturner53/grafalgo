/** \file TestHashSet.cpp
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Hash.h"
#include "HashSet.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	HashSet<uint32_t,Hash::u32> map1;

	Utest::assertEqual(map1.first(), 0, "initial map not empty");
	cout << "writing empty indexMap: " << map1 << endl;

	map1.insert(1234);
	Utest::assertEqual(map1.insert(1234,3),3,"wrong index for first item");
	Utest::assertEqual(map1.retrieve(3),1234,"wrong key for first item");
	cout << "writing singleton indexMap: " << map1 << endl;
	Utest::assertEqual(map1.toString(), "{(1234,3)}",
		"mismatch on adding first item");

	Utest::assertEqual(map1.insert(2345,7),7,"wrong index for second item");
	int32_t x = map1.insert(3456);
	Utest::assertEqual(map1.find(3456),x,"wrong index for third item");
	Utest::assertEqual(map1.toString(),
		"{(1234,3) (2345,7) (3456," + to_string(x) + ")}",
		"mismatch after adding third item");
	cout << "writing 3 index map: " << map1 << endl;

	map1.remove(2345);
	Utest::assertEqual(map1.toString(),
		"{(1234,3) (3456," + to_string(x) + ")}",
		"mismatch after removing element");

	int32_t y = map1.insert(4567);
	Utest::assertEqual(map1.toString(), 
		"{(1234,3) (3456," + to_string(x) + ") " +
		"(4567," + to_string(y) + ")}",
		"mismatch on adding after removing");
	
	// force map to expand
	for (int i = 20; i < 30; i++) map1.insert(i);
	for (int i = 20; i < 30; i++)
		Utest::assertTrue(map1.contains(i),"mismatch on membership test1");

	// force map to expand again
	for (int i = 30; i < 80; i++) map1.insert(i);
	for (int i = 30; i < 80; i++) {
		Utest::assertTrue(map1.contains(i),"mismatch on membership test2");
	}

	HashSet<uint32_t,Hash::u32> copy1(map1);
	for (grafalgo::index x = map1.first(); x != 0; x = map1.next(x))
		Utest::assertTrue(copy1.contains(map1.retrieve(x)),
			"mismatch on membership test in copy1");
	HashSet<uint32_t,Hash::u32> copy2;
	copy2 = copy1;
	for (grafalgo::index x = map1.first(); x != 0; x = map1.next(x))
		Utest::assertTrue(copy2.contains(map1.retrieve(x)),
			"mismatch on membership test in copy2");

	map1.clear();
	Utest::assertEqual(map1.toString(), "{}",
			   "mismatch after clearing map");

	HashSet<string,Hash::string> map2;
	map2.insert("abc", 5);
	map2.insert("abc def", 4);
	map2.insert("xyz",2);
	Utest::assertEqual(map2.toString(), "{(abc,5) (abc def,4) (xyz,2)}",
		"mismatch on 3 map");
	map2.insert("xyz",7);
	Utest::assertEqual(map2.toString(), "{(abc,5) (abc def,4) (xyz,7)}",
		"mismatch on modified 3 map");
	Utest::assertTrue(map2.contains("abc"),
		"contains returns false for string \"abc\" in set");
	Utest::assertTrue(map2.contains("abc def"),
		"contains returns false for string \"abc def\" in set");
	Utest::assertTrue(map2.contains("xyz"),
		"contains returns false for string \"xyz\" in set");
	Utest::assertTrue(!map2.contains("xy"),
		"contains returns true for element not in set");
	map2.remove("abc");
	Utest::assertEqual(map2.toString(), "{(abc def,4) (xyz,7)}",
		"mismatch on 2 map");
}

/**
 *  Unit test for HashSet data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
