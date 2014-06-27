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
	Dheap<int> *dhp;
	string	method;
	int	arg1;
	int	arg2;
	int	arg3;
	int	rval;
	string	expected;

	testcase(Dheap<int>& dh, string m, int a1, int a2, int a3, 
		 int rv, string exp) {
		dhp = &dh; method = m; arg1 = a1; arg2 = a2; arg3 = a3;
		rval = rv; expected = exp;
	}
};

bool run(testcase tc) {
	int rv;
	string before, after;
	if (tc.method == "empty") {
		before = tc.dhp->toString();
		rv = tc.dhp->empty();
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on empty()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "member") {
		before = tc.dhp->toString();
		rv = tc.dhp->member(tc.arg1);
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on member("
		     << tc.arg1 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "size") {
		before = tc.dhp->toString();
		rv = tc.dhp->size();
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on size()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "findmin") {
		before = tc.dhp->toString();
		rv = tc.dhp->findmin();
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on findmin()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "key") {
		before = tc.dhp->toString();
		rv = tc.dhp->key(tc.arg1);
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on key(" << tc.arg1 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "changekey") {
		before = tc.dhp->toString();
		tc.dhp->changekey(tc.arg1,tc.arg2);
		after = tc.dhp->toString();
		if (after == tc.expected) return true;
		cerr << "Error: on changekey("
		     << tc.arg1 << "," << tc.arg2 << "," << tc.arg3 << ")\n"
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "insert") {
		before = tc.dhp->toString();
		tc.dhp->insert(tc.arg1,tc.arg2);
		after = tc.dhp->toString();
		if (after == tc.expected) return true;
		cerr << "Error: on insert("
		     << tc.arg1 << "," << tc.arg2 << ")\n"
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "deletemin") {
		before = tc.dhp->toString();
		rv = tc.dhp->deletemin();
		after = tc.dhp->toString();
		if (rv == tc.rval && after == tc.expected) return true;
		cerr << "Error: on deletemin(" << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "remove") {
		before = tc.dhp->toString();
		tc.dhp->remove(tc.arg1);
		after = tc.dhp->toString();
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

void runTests1() {
	Dheap<int> dh(26,2); string s;
	testcase tests[] = {
		// object method arg1 2 3 retval expected output
		testcase(dh, "empty", 0, 0, 0, 1, ""),
		testcase(dh, "insert", 3, 8, 0, 0, "(c,8)"),
		testcase(dh, "empty", 0, 0, 0, 0, ""),
		testcase(dh, "insert", 5, 9, 0, 0, "(c,8) (e,9)"),
		testcase(dh, "insert", 4, 7, 0, 0, "(d,7) (e,9) (c,8)"),
		testcase(dh, "member", 5, 0, 0, 1, ""),
		testcase(dh, "member", 8, 0, 0, 0, ""),
		testcase(dh, "findmin",0, 0, 0, 4, ""),
		testcase(dh, "insert", 2, 6, 0, 0,
			"(b,6) (d,7) (c,8) (e,9)"),
		testcase(dh, "insert", 1, 1, 0, 0, 
			"(a,1) (b,6) (c,8) (e,9) (d,7)"),
		testcase(dh, "insert", 8, 4, 0, 0, 
			"(a,1) (b,6) (h,4) (e,9) (d,7) (c,8)"),
		testcase(dh, "findmin",0, 0, 0, 1, ""),
		testcase(dh, "insert", 7, 5, 0, 0,
			"(a,1) (b,6) (h,4) (e,9) (d,7) (c,8) (g,5)"),
		testcase(dh, "insert", 6, 3, 0, 0,
			"(a,1) (f,3) (h,4) (b,6) (d,7) (c,8) (g,5) (e,9)"),
		testcase(dh, "insert", 9, 2, 0, 0,
			"(a,1) (i,2) (h,4) (f,3) (d,7) (c,8) (g,5) (e,9) "
			"(b,6)"),
		testcase(dh, "deletemin", 0, 0, 0, 1,
			"(i,2) (f,3) (h,4) (b,6) (d,7) (c,8) (g,5) (e,9)"),
		testcase(dh, "deletemin", 0, 0, 0, 9,
			"(f,3) (b,6) (h,4) (e,9) (d,7) (c,8) (g,5)"),
		testcase(dh, "deletemin", 0, 0, 0, 6,
			"(h,4) (b,6) (g,5) (e,9) (d,7) (c,8)"),
		testcase(dh, "remove", 7, 0, 0, 8,
			"(h,4) (b,6) (c,8) (e,9) (d,7)"),
		testcase(dh, "fin", 0, 0, 0, 0, "")
	};
	testcase *p;
	bool success = true;
	for (p = tests; p->method != "fin"; p++) {
		success &= run(*p);
	}
	if (success) cerr << "runTests1: all tests passed\n";
}
class testcase2 {
public:
	Dheap<string> *dhp;
	string	method;
	int	arg1;
	int	arg2;
	int	arg3;
	string  arg4;
	int	rval;
	string  srval;
	string	expected;

	testcase2(Dheap<string>& dh, string m, int a1, int a2, int a3,
		 string a4, int rv, string srv, string exp) {
		dhp = &dh; method = m; arg1 = a1; arg2 = a2; arg3 = a3;
		arg4 = a4; srval = srv, rval = rv; expected = exp;
	}
};

bool run2(testcase2 tc) {
	int rv; string srv;
	string before, after;
	if (tc.method == "empty") {
		before = tc.dhp->toString();
		rv = tc.dhp->empty();
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on empty()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "member") {
		before = tc.dhp->toString();
		rv = tc.dhp->member(tc.arg1);
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on member("
		     << tc.arg1 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "size") {
		before = tc.dhp->toString();
		rv = tc.dhp->size();
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on size()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "findmin") {
		before = tc.dhp->toString();
		rv = tc.dhp->findmin();
		after = tc.dhp->toString();
		if (after == before && rv == tc.rval) return true;
		cerr << "Error: on findmin()\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "key") {
		before = tc.dhp->toString();
		srv = tc.dhp->key(tc.arg1);
		after = tc.dhp->toString();
		if (after == before && srv == tc.srval) return true;
		cerr << "Error: on key(" << tc.arg1 << ")\n"
		     << "returned " << srv << " expected " << tc.srval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl;
		return false;
	} else if (tc.method == "changekey") {
		before = tc.dhp->toString();
		tc.dhp->changekey(tc.arg1,tc.arg4);
		after = tc.dhp->toString();
		if (after == tc.expected) return true;
		cerr << "Error: on changekey("
		     << tc.arg1 << "," << tc.arg4 << "," << ")\n"
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "insert") {
		before = tc.dhp->toString();
		tc.dhp->insert(tc.arg1,tc.arg4);
		after = tc.dhp->toString();
		if (after == tc.expected) return true;
		cerr << "Error: on insert("
		     << tc.arg1 << "," << tc.arg4 << ")\n"
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "deletemin") {
		before = tc.dhp->toString();
		rv = tc.dhp->deletemin();
		after = tc.dhp->toString();
		if (rv == tc.rval && after == tc.expected) return true;
		cerr << "Error: on deletemin(" << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before << endl
		     << "final state:\n" << after << endl
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "remove") {
		before = tc.dhp->toString();
		tc.dhp->remove(tc.arg1);
		after = tc.dhp->toString();
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

void runTests2() {
	Dheap<string> dh(26,2); string s;
	testcase2 tests2[] = {
		// object method arg1 2 3 4 retval sretval expected state
		testcase2(dh, "empty", 0, 0, 0, "", 1, "", ""),
		testcase2(dh, "insert", 3, 0, 0, "abc", 0, "", "(c,abc)"),
		testcase2(dh, "insert", 2, 0, 0, "def", 0, "",
				"(c,abc) (b,def)"),
		testcase2(dh, "insert", 7, 0, 0, "xyz", 0, "",
				"(c,abc) (b,def) (g,xyz)"),
		testcase2(dh, "insert", 4, 0, 0, "a", 0, "",
				"(d,a) (c,abc) (g,xyz) (b,def)"),
		testcase2(dh, "fin", 0, 0, 0, "", 0, "", "")
	};
	testcase2 *p;
	bool success = true;
	for (p = tests2; p->method != "fin"; p++) {
		success &= run2(*p);
	}
	if (success) cerr << "runTests2: all tests passed\n";
}

/**
 *  Unit test for FheapSet data structure.
 */
int main() { runTests1(); runTests2(); }

