/** \file TestDheap.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Dheap.h"
#include "Utest.h"

using namespace grafalgo;

class testcase {
public:
	Dheap *dheap;
	string	method;
	int	arg1;
	int	arg2;
	int	arg3;
	int	rval;
	string	expected;

	testcase(Dheap& dh, string m, int a1, int a2, int a3, 
		 int rv, string exp) {
		dheap = &dh; method = m; arg1 = a1; arg2 = a2; arg3 = a3;
		rval = rv; expected = exp;
	}
};

bool run(testcase tc) {
	int rv;
	string before, after;
	if (tc.method == "empty") {
		before = tc.dheap->toString();
		rv = tc.dheap->empty();
		after = tc.dheap->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on empty()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "member") {
		before = tc.dheap->toString();
		rv = tc.dheap->member(tc.arg1);
		after = tc.dheap->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on member("
		     << tc.arg1 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "size") {
		before = tc.dheap->toString();
		rv = tc.dheap->size();
		after = tc.dheap->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on size()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "findmin") {
		before = tc.dheap->toString();
		rv = tc.dheap->findmin();
		after = tc.dheap->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on findmin()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "key") {
		before = tc.dheap->toString();
		rv = tc.dheap->key(tc.arg1);
		after = tc.dheap->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on key(" << tc.arg1 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "changekey") {
		before = tc.dheap->toString();
		tc.dheap->changekey(tc.arg1,tc.arg2);
		after = tc.dheap->toString();
		if (after == tc.expected) return true;
		cerr << "Error: on changekey("
		     << tc.arg1 << "," << tc.arg2 << "," << tc.arg3 << ")\n"
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "insert") {
		before = tc.dheap->toString();
		tc.dheap->insert(tc.arg1,tc.arg2);
		after = tc.dheap->toString();
		if (after == tc.expected) return true;
		cerr << "Error: on insert("
		     << tc.arg1 << "," << tc.arg2 << ")\n"
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "deletemin") {
		before = tc.dheap->toString();
		rv = tc.dheap->deletemin();
		after = tc.dheap->toString();
		if (rv == tc.rval && after == tc.expected) return true;
		cerr << "Error: on deletemin(" << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "remove") {
		before = tc.dheap->toString();
		tc.dheap->remove(tc.arg1);
		after = tc.dheap->toString();
		if (after == tc.expected) return true;
		cerr << "Error: on remove("
		     << tc.arg1 << ")\n"
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	}
	cerr << "\nError: unknown test\n";
	return false;
};

void runTests() {
	Dheap dheap(26,2); string s;
	testcase tests[] = {
		// object method arg1 2 3 retval expected output
		testcase(dheap, "empty", 0, 0, 0, 1, ""),
		testcase(dheap, "insert", 3, 8, 0, 0, "(c,8)"),
		testcase(dheap, "empty", 0, 0, 0, 0, ""),
		testcase(dheap, "insert", 5, 9, 0, 0, "(c,8) (e,9)"),
		testcase(dheap, "insert", 4, 7, 0, 0, "(d,7) (e,9) (c,8)"),
		testcase(dheap, "member", 5, 0, 0, 1, ""),
		testcase(dheap, "member", 8, 0, 0, 0, ""),
		testcase(dheap, "findmin",0, 0, 0, 4, ""),
		testcase(dheap, "insert", 2, 6, 0, 0,
			"(b,6) (d,7) (c,8) (e,9)"),
		testcase(dheap, "insert", 1, 1, 0, 0, 
			"(a,1) (b,6) (c,8) (e,9) (d,7)"),
		testcase(dheap, "insert", 8, 4, 0, 0, 
			"(a,1) (b,6) (h,4) (e,9) (d,7) (c,8)"),
		testcase(dheap, "findmin",0, 0, 0, 1, ""),
		testcase(dheap, "insert", 7, 5, 0, 0,
			"(a,1) (b,6) (h,4) (e,9) (d,7) (c,8) (g,5)"),
		testcase(dheap, "insert", 6, 3, 0, 0,
			"(a,1) (f,3) (h,4) (b,6) (d,7) (c,8) (g,5) (e,9)"),
		testcase(dheap, "insert", 9, 2, 0, 0,
			"(a,1) (i,2) (h,4) (f,3) (d,7) (c,8) (g,5) (e,9) "
			"(b,6)"),
		testcase(dheap, "deletemin", 0, 0, 0, 1,
			"(i,2) (f,3) (h,4) (b,6) (d,7) (c,8) (g,5) (e,9)"),
		testcase(dheap, "deletemin", 0, 0, 0, 9,
			"(f,3) (b,6) (h,4) (e,9) (d,7) (c,8) (g,5)"),
		testcase(dheap, "deletemin", 0, 0, 0, 6,
			"(h,4) (b,6) (g,5) (e,9) (d,7) (c,8)"),
		testcase(dheap, "remove", 7, 0, 0, 8,
			"(h,4) (b,6) (c,8) (e,9) (d,7)"),
		testcase(dheap, "fin", 0, 0, 0, 0, "")
	};
	testcase *p;
	bool success = true;
	for (p = tests; p->method != "fin"; p++) {
		success &= run(*p);
	}
	if (success) cerr << "all tests passed\n";
}

/**
 *  Unit test for FheapSet data structure.
 */
int main() { runTests(); }

