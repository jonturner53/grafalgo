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

	chekCond(map1, !map1.first(), "a1 !map1.first()");
	chekState(map1, "a2", "{}");

	map1.insert(1234);
	chekExpr(map1, map1.insert(1234,3), "b1 map1.insert(1234,3)", 3);
	chekExpr(map1, map1.retrieve(3), "b1 map1.retrieve(3)", 1234);
	chekState(map1, "b3", "{(1234,3)}");

	chekExpr(map1, map1.insert(2345,7), "b1 map1.insert(2345,7)", 7);
	int32_t x = map1.insert(3456);
	chekState(map1, "b2", "{(1234,3) (2345,7) (3456," + to_string(x) +")}");
	map1.remove(2345);
	chekState(map1, "b3", "{(1234,3) (3456," + to_string(x) + ")}");

	int32_t y = map1.insert(4567);
	chekState(map1, "b4", "{(1234,3) (3456," + to_string(x) +
			      ") (4567," + to_string(y) + ")}");
	
	// force map to expand
	for (int i = 20; i < 30; i++) map1.insert(i);
	for (int i = 20; i < 30; i++)
		chekCond(map1, map1.contains(i),
			"c" + to_string(i) + " map1.contains(i)");

	// force map to expand again
	for (int i = 30; i < 80; i++) map1.insert(i);
	for (int i = 30; i < 80; i++) {
		chekCond(map1, map1.contains(i),
			"c" + to_string(i) + " map1.contains(i)");
	}

	HashSet<uint32_t,Hash::u32> copy1(map1);
	for (grafalgo::index x = map1.first(); x != 0; x = map1.next(x))
		chekCond(copy1, copy1.contains(map1.retrieve(x)),
			"d" + to_string(x) +
			" copy1.contains(map1.retrieve(x))");
	HashSet<uint32_t,Hash::u32> copy2;
	copy2 = copy1;
	for (grafalgo::index x = map1.first(); x != 0; x = map1.next(x))
		chekCond(copy2, copy1.contains(map1.retrieve(x)),
			"e" + to_string(x) + 
			" copy2.contains(map1.retrieve(x))");

	map1.clear();
	chekState(map1, "f", "{}");

	HashSet<string,Hash::string> map2;
	map2.insert("abc", 5);
	map2.insert("abc def", 4);
	map2.insert("xyz",2);
	chekState(map2, "g1", "{(abc,5) (abc def,4) (xyz,2)}");
	map2.insert("xyz",7);
	chekState(map2, "g2", "{(abc,5) (abc def,4) (xyz,7)}");
	chekCond(map2, map2.contains("abc"), "g3 map2.contains(abc)");
	chekCond(map2, map2.contains("abc def"), "g4 map2.contains(abc def)");
	chekCond(map2, map2.contains("xyz"), "g5 map2.contains(xyz)");
	chekCond(map2, !map2.contains("xy"), "g6 !map2.contains(xy)");
	map2.remove("abc");
	chekState(map2, "g1", "{(abc def,4) (xyz,7)}");
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
