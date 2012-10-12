/** \file TestUiClist.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "UiClist.h"
#include "Utest.h"

void basicTests() {
	int n1 = 10; UiClist cl(n1); string s;

	for (int i = 1; i <= n1; i++)
		Utest::assertTrue(cl.suc(i) == i && cl.pred(i) == i,
				  "don't have singletons on startup");

	cout << "writing initial collection" << endl;
	cout << cl.toString(s) << endl;

	cl.join(1,2); cl.join(3,4);
	for (int i = 6; i <= 10; i++) cl.join(i-1,i);
	cout << "writing collection after some joins" << endl;
	cout << cl.toString(s) << endl;
	Utest::assertEqual("(a b), (c d), (e f g h i j)",cl.toString(s),
			   "incorrect result following joins");

	cl.remove(7); cl.remove(9);
	cout << "writing collection after some removes" << endl;
	cout << cl.toString(s) << endl;
	Utest::assertEqual("(a b), (c d), (e f h j), (g), (i)",
			   cl.toString(s),
			   "incorrect result following joins");

}

/**
 *  Unit test for UiList data structure.
 */
main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
