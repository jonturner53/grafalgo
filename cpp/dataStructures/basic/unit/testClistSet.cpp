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

	for (int i = 1; i <= n1; i++) {
		chekExpr(cl, cl.next(i), "a" + to_string(i) + " cl.next(i)", i);
		chekExpr(cl, cl.prev(i), "A" + to_string(i) + " cl.prev(i)", i);
	}

	chekState(cl, "a13", "{}");

	// joining
	cl.join(1,2); cl.join(3,4);
	for (int i = 6; i <= 10; i++) cl.join(i-1,i);
	chekState(cl, "b", "{[a b], [c d], [e f g h i j]}");

	// removing some items
	cl.remove(7); cl.remove(9);
	chekState(cl, "c", "{[a b], [c d], [e f h j]}");

	ClistSet cl2(n1);
	cl2.copyFrom(cl);
	chekState(cl2, "d", "{[a b], [c d], [e f h j]}");

	cl2.expand(27);
	chekState(cl2, "e", "{[1 2], [3 4], [5 6 8 10]}");
}

/**
 *  Unit test for List data structure.
 */
int main() {
	cout << "testing\n";
	basicTests();
	cout << "passed\n";

	// add more systematic tests for each individual method
}
