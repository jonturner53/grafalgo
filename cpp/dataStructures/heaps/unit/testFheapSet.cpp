/** \file TestFheapSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "FheapSet.h"
#include "Utest.h"

using namespace grafalgo;

class testcase {
public:
	FheapSet *hset;
	string	method;
	int	arg1;
	int	arg2;
	int	arg3;
	int	rval;
	string	expected;

	testcase(FheapSet& hs, string m, int a1, int a2, int a3, 
		 int rv, string exp) {
		hset = &hs; method = m; arg1 = a1; arg2 = a2; arg3 = a3;
		rval = rv; expected = exp;
	}
};

bool run(testcase tc) {
	int rv;
	string before, after;
	stringstream ss;
	if (tc.method == "setKey") {
		before = tc.hset->toString();
		tc.hset->setKey(tc.arg1,tc.arg2);
		after = tc.hset->toString();
		if (after == tc.expected) return true;
		cerr << "Error: on setKey("
		     << tc.arg1 << "," << tc.arg2 << ")\n"
		     << "initial state:\n" << before
		     << "final state:\n" << after
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "meld") {
		before = tc.hset->toString();
		rv = tc.hset->meld(tc.arg1,tc.arg2);
		after = tc.hset->toString();
		if (rv == tc.rval && after == tc.expected) return true;
		cerr << "Error: on meld("
		     << tc.arg1 << "," << tc.arg2 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before
		     << "final state:\n" << after
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "decreasekey") {
		before = tc.hset->toString();
		rv = tc.hset->decreasekey(tc.arg1,tc.arg2,tc.arg3);
		after = tc.hset->toString();
		if (rv == tc.rval && after == tc.expected) return true;
		cerr << "Error: on decreasekey("
		     << tc.arg1 << "," << tc.arg2 << "," << tc.arg3 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before
		     << "final state:\n" << after
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "insert") {
		before = tc.hset->toString();
		rv = tc.hset->insert(tc.arg1,tc.arg2,tc.arg3);
		after = tc.hset->toString();
		if (rv == tc.rval && after == tc.expected) return true;
		cerr << "Error: on insert("
		     << tc.arg1 << "," << tc.arg2 << "," << tc.arg3 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before
		     << "final state:\n" << after
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "deletemin") {
		before = tc.hset->toString();
		rv = tc.hset->deletemin(tc.arg1);
		after = tc.hset->toString();
		if (rv == tc.rval && after == tc.expected) return true;
		cerr << "Error: on deletemin(" << tc.arg1 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before
		     << "final state:\n" << after
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "remove") {
		before = tc.hset->toString();
		rv = tc.hset->remove(tc.arg1,tc.arg2);
		after = tc.hset->toString();
		if (rv == tc.rval && after == tc.expected) return true;
		cerr << "Error: on remove("
		     << tc.arg1 << "," << tc.arg2 << ")\n"
		     << "returned " << rv << " expected " << tc.rval << endl
		     << "initial state:\n" << before
		     << "final state:\n" << after
		     << "expected:\n" << tc.expected << endl;
		return false;
	} else if (tc.method == "key") {
		rv = tc.hset->key(tc.arg1);
		if (rv == tc.rval) return true;
		cerr << "Error: on key(" << tc.arg1 << ")\n"
		     << "returned " << rv << " expected " << tc.rval
		     << endl;
		return false;
	} else if (tc.method == "findmin") {
		rv = tc.hset->findmin(tc.arg1);
		if (rv == tc.rval) return true;
		cerr << "Error: on findmin(" << tc.arg1 << ")\n"
		     << "returned " << rv << " expected " << tc.rval
		     << endl;
		return false;
	}
	cerr << "\nError: unknown test\n";
	return false;
};

void runTests() {
	FheapSet hset; string s;
	testcase tests[] = {
		// object method arg1 2 3 retval expected output
		testcase(hset, "setKey", 1, 5, 0, 0, ""),
		testcase(hset, "key", 1, 0, 0, 5, ""),
		testcase(hset, "insert", 3, 1, 4, 3, "[c:4,0 a:5,0]\n"),
		testcase(hset, "insert", 5, 3, 6, 3, "[c:4,0 a:5,0 e:6,0]\n"),
		testcase(hset, "setKey", 8, 2, 0, 0, "[c:4,0 a:5,0 e:6,0]\n"),
		testcase(hset, "insert", 9, 8, 7, 8,
			"[c:4,0 a:5,0 e:6,0]\n[h:2,0 i:7,0]\n"),
		testcase(hset, "insert", 7, 8, 3, 8,
			 "[c:4,0 a:5,0 e:6,0]\n[h:2,0 i:7,0 g:3,0]\n"),
		testcase(hset, "meld", 3, 8, 0, 8,
			 "[h:2,0 i:7,0 g:3,0 a:5,0 e:6,0 c:4,0]\n"),
		testcase(hset, "decreasekey", 9, 6, 8, 9,
			 "[i:1,0 g:3,0 a:5,0 e:6,0 c:4,0 h:2,0]\n"),
		testcase(hset, "deletemin", 9, 0, 0, 8,
			 "[h:2,0 g:3,2[c:4,1[e:6,0] a:5,0]]\n"),
		testcase(hset, "deletemin", 8, 0, 0, 7,
			 "[g:3,2[c:4,1[e:6,0] a:5,0]]\n"),
		testcase(hset, "insert", 10, 7, 8, 7,
                         "[g:3,2[c:4,1[e:6,0] a:5,0] j:8,0]\n"),
		testcase(hset, "insert", 11, 7, 12, 7,
                         "[g:3,2[c:4,1[e:6,0] a:5,0] j:8,0 k:12,0]\n"),
		testcase(hset, "insert", 12, 7, 1, 12,
                         "[l:1,0 g:3,2[c:4,1[e:6,0] a:5,0] j:8,0 k:12,0]\n"),
		testcase(hset, "insert", 13, 12, 7, 12,
                      	"[l:1,0 g:3,2[c:4,1[e:6,0] a:5,0] j:8,0 "
			"k:12,0 m:7,0]\n"),
		testcase(hset, "insert", 14, 12, 2, 12,
                      	"[l:1,0 g:3,2[c:4,1[e:6,0] a:5,0] j:8,0 k:12,0 "
			"m:7,0 n:2,0]\n"),
		testcase(hset, "insert", 15, 12, 4, 12,
                     	"[l:1,0 g:3,2[c:4,1[e:6,0] a:5,0] j:8,0 k:12,0 "
			"m:7,0 n:2,0 o:4,0]\n"),
		testcase(hset, "deletemin", 12, 0, 0, 14,
			"[n:2,3[g:3,2[c:4,1[e:6,0] a:5,0] m:7,0 "
			"j:8,1[k:12,0]] o:4,0]\n"),
		testcase(hset, "deletemin", 14, 0, 0, 7,
			"[g:3,3[o:4,2[j:8,1[k:12,0] m:7,0] a:5,0 "
			"c:4,1[e:6,0]]]\n"),
		testcase(hset, "decreasekey", 5, 1, 7, 7,
			"[g:3,3[o:4,2[j:8,1[k:12,0] m:7,0] a:5,0 "
			"c:4,1[e:5,0]]]\n"),
		testcase(hset, "decreasekey", 13, 5, 7, 13,
			"[m:2,0 g:3,3[o!4,1[j:8,1[k:12,0]] a:5,0 "
			"c:4,1[e:5,0]]]\n"),
		testcase(hset, "decreasekey", 10, 7, 13, 10,
			"[j:1,1[k:12,0] m:2,0 g:3,2[a:5,0 c:4,1[e:5,0]] "
			"o:4,0]\n"),
		testcase(hset, "fin", 0, 0, 0, 0, "")
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
