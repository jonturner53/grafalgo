/** \file TestPartition.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Partition.h"
#include "Utest.h"

void basicTests() {
	int n1 = 10; Partition prtn(n1); string s;

	cout << "writing initial partition: " << prtn.toString(s);
	Utest::assertEqual(prtn.toString(s), "[a*] [b*] [c*] [d*] [e*] "
					     "[f*] [g*] [h*] [i*] [j*] \n",
					     "initial partition not correct");

	prtn.link(1,2); prtn.link(3,4); prtn.link(5,6);
	cout << "writing new partition: " << prtn.toString(s);
	Utest::assertEqual(prtn.toString(s), "[a b*] [c d*] [e f*] "
					     "[g*] [h*] [i*] [j*] \n",
					     "mismatch after 3 links");

	prtn.link(2,4); prtn.link(4,7); prtn.link(6,8);
	cout << "writing new partition: " << prtn.toString(s);
	Utest::assertEqual(prtn.toString(s), "[a b c d* g] [e f* h] [i*] [j*] "
					     "\n",	
					     "mismatch after 3 more links");

	prtn.link(9,10); prtn.link(6,10); prtn.link(10,4);
	cout << "writing new partition: " << prtn.toString(s);
	Utest::assertEqual(prtn.toString(s), "[a b c d* e f g h i j] \n",
					     "mismatch after last 3 links");
}

/**
 *  Unit test for Parititon data structure.
 */
main() {
	cout << "running basic tests\n";
	basicTests();
	cout << "basic tests passed\n";

	// add more systematic tests for each individual method
}
