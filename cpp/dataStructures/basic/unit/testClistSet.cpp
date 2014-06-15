/** \file TestClistSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ClistSet.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n1 = 12; ClistSet cl(n1);

	for (int i = 1; i <= n1; i++)
		Utest::assertTrue(cl.suc(i) == i && cl.pred(i) == i,
				  "don't have singletons on startup");

	cout << "writing initial collection" << endl;
	cout << cl << endl;

	cl.join(1,2); cl.join(3,4);
	for (int i = 6; i <= 10; i++) cl.join(i-1,i);
	cout << "writing collection after some joins" << endl;
	cout << cl << endl;
	Utest::assertEqual("{[a b], [c d], [e f g h i j]}",cl.toString(),
			   "incorrect result following joins");

	cl.remove(7); cl.remove(9);
	cout << "writing collection after some removes" << endl;
	cout << cl << endl;
	Utest::assertEqual("{[a b], [c d], [e f h j]}",
			   cl.toString(),
			   "incorrect result following removes");

	ClistSet cl2(n1); cl2.copyFrom(cl);
	Utest::assertEqual("{[a b], [c d], [e f h j]}",
			   cl2.toString(),
			   "incorrect result following copy");
	cl2.expand(27);
	Utest::assertEqual("{[1 2], [3 4], [5 6 8 10]}",
			   cl2.toString(),
			   "incorrect result following expand");
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
