/** \file TestPartition.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Partition.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n1 = 10; Partition prtn(n1);

	chekState(prtn, "a", "{}");

	prtn.link(1,2); prtn.link(3,4); prtn.link(5,6);
	chekState(prtn, "b", "{[a b*] [c d*] [e f*]}");

	prtn.link(2,4); prtn.link(4,7); prtn.link(6,8);
	chekState(prtn, "c", "{[a b c d* g] [e f* h]}");

	prtn.link(9,10); prtn.link(6,10); prtn.link(10,4);
	chekState(prtn, "d", "{[a b c d* e f g h i j]}");
	prtn.expand(27); prtn.link(13,27);
	chekState(prtn, "e", "{[1 2 3 4* 5 6 7 8 9 10] [13 27*]}");
}

/**
 *  Unit test for Parititon data structure.
 */
int main() {
	cout << "testing\n";
	basicTests();
	cout << "passed\n";
}
