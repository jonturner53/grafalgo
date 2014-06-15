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

	cout << "writing initial partition: " << prtn << endl;
	Utest::assertEqual(prtn.toString(), "{}",
					     "initial partition not correct");

	prtn.link(1,2); prtn.link(3,4); prtn.link(5,6);
	cout << "writing new partition: " << prtn << endl;
	Utest::assertEqual(prtn.toString(), "{[a b*] [c d*] [e f*]}",
					     "mismatch after 3 links");

	prtn.link(2,4); prtn.link(4,7); prtn.link(6,8);
	cout << "writing new partition: " << prtn << endl;
	Utest::assertEqual(prtn.toString(), "{[a b c d* g] [e f* h]}",	
					     "mismatch after 3 more links");

	prtn.link(9,10); prtn.link(6,10); prtn.link(10,4);
	cout << "writing new partition: " << prtn << endl;
	Utest::assertEqual(prtn.toString(), "{[a b c d* e f g h i j]}",
					     "mismatch after another 3 links");
	prtn.expand(27); prtn.link(13,27);
	cout << "writing expanded partition: " << prtn << endl;
	Utest::assertEqual(prtn.toString(), "{[1 2 3 4* 5 6 7 8 9 10] "
					     "[13 27*]}",
					     "mismatch after expand/link");
}

/**
 *  Unit test for Parititon data structure.
 */
int main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
