/** \file TestLheapSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "LheapSet.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	LheapSet hset; 

	hset.setkey(1,5); hset.setkey(3,4); hset.setkey(5,6);
	int h1 = 1; h1 = hset.insert(3,h1); h1 = hset.insert(5,h1);
	chekState(hset, "a", "(1:5,1 3:4,2* 5:6,1)\n");

	chekExpr(hset, hset.findmin(h1), "b hset.findmin(h1)", 3);

	hset.setkey(8,2); hset.setkey(9,7); hset.setkey(7,3);
	int h2 = 8; h2 = hset.insert(9,h2); h2 = hset.insert(7,h2);
	chek(hset, hset.findmin(h2), "c hset.findmin(h2)", 8,
		"(1:5,1 3:4,2* 5:6,1)\n(9:7,1 8:2,2* 7:3,1)\n");
	
	h1 = hset.meld(h1,h2);
	chek(hset, hset.findmin(h1), "d hset.findmin(h1)", 8,
		"(9:7,1 8:2,2* ((1:5,1 3:4,2 5:6,1) 7:3,1))\n");

	h1 = hset.deletemin(h1);
	chek(hset, hset.findmin(h1), "e hset.findmin(h1)", 7,
		"((1:5,1 3:4,2 5:6,1) 7:3,2* 9:7,1)\n");

	h1 = hset.deletemin(h1);
	chek(hset, hset.findmin(h1), "f hset.findmin(h1)", 3,
		"(1:5,1 3:4,2* (9:7,1 5:6,1))\n");
}

/**
 *  Unit test for LheapSet data structure.
 */
int main() {
	cout << "testing\n";
	basicTests();
	cout << "passed\n";
}
