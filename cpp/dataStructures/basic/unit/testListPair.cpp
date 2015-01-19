/** \file TestListPair.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ListPair.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n = 10; ListPair lp(n);

	chekCond(lp, !lp.isIn(1) && lp.firstIn() == 0 && lp.lastIn() == 0,
		  "a !lp.isIn(1) && lp.firstIn() == 0 && lp.lastIn() == 0");
	chekCond(lp, lp.isOut(1) && lp.firstOut() != 0 && lp.lastOut() !=0,
		  "b lp.isOut(1) && lp.firstOut() != 0 && lp.lastOut() !=0");

	lp.swap(1);
	chekState(lp,"c", "{a} {b c d e f g h i j}");
	lp.swap(4);
	chekState(lp,"d", "{a d} {b c e f g h i j}");
	lp.swap(10);
	chekState(lp,"e", "{a d j} {b c e f g h i}");
	lp.swap(2); lp.swap(5); lp.swap(9);
	chekState(lp,"f", "{a d j b e i} {c f g h}");

	lp.swap(4); lp.swap(5); lp.swap(1); lp.swap(9);
	chekState(lp,"g", "{j b} {c f g h d e a i}");

	lp.swap(2,0); 
	chekState(lp,"h", "{j} {b c f g h d e a i}");

	lp.swap(10,9); 
	chekState(lp,"i", "{} {b c f g h d e a i j}");

	lp.swap(5,0); 
	chekState(lp,"j", "{e} {b c f g h d a i j}");

	lp.swap(6,0); 
	chekState(lp,"k", "{f e} {b c g h d a i j}");
	lp.swap(8,5); 
	chekState(lp,"l", "{f e h} {b c g d a i j}");
	lp.swap(4,6); 
	chekState(lp,"m", "{f d e h} {b c g a i j}");
}

/**
 *  Unit test for ListPair data structure.
 */
int main() {
	cout << "testing\n";
	basicTests();
	cout << "passed\n";
}
