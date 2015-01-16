/** \file TestBalBstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "BalBstSet.h"

using namespace grafalgo;

struct testcase {
public:
	BalBstSet *bstset;
	string	method;
	int	a1, a2, a3;     // up to 3 args
	int	rv1, rv2;	// up to 2 return values
	string	exp;	  	// expected value after test case
};

bool test1(testcase& tc, int rv, string& before, string& after) {
	if (rv == tc.rv1 && after == tc.exp) return true;
	cout << "Error: on " << tc.method << "(" << tc.a1 << ")\n"
	     << "returned " << rv << " expected " << tc.rv1 << endl
	     << "initial state:\n" << before
	     << "final state:\n" << after
	     << "expected:\n" << tc.exp << endl;
	return false;
}

bool test2(testcase& tc, int rv, string& before, string& after) {
	if (rv == tc.rv1 && after == tc.exp) return true;
	cout << "Error: on " << tc.method
	     << "(" << tc.a1 << "," << tc.a2 << ")\n"
	     << "returned " << rv << " expected " << tc.rv1 << endl
	     << "initial state:\n" << before
	     << "final state:\n" << after
	     << "expected:\n" << tc.exp << endl;
	return false;
}

bool test3(testcase& tc, int rv, string& before, string& after) {
	if (rv == tc.rv1 && after == tc.exp) return true;
	cout << "Error: on " << tc.method
	     << "(" << tc.a1 << "," << tc.a2 << "," << tc.a3 << ")\n"
	     << "returned " << rv << " expected " << tc.rv1 << endl
	     << "initial state:\n" << before
	     << "final state:\n" << after
	     << "expected:\n" << tc.exp << endl;
	return false;
}

bool test2x(testcase& tc, int rv1, int rv2, string& before, string& after) {
	if (rv1 == tc.rv1 && rv2 == tc.rv2 && after == tc.exp) return true;
	cout << "Error: on " << tc.method
	     << "(" << tc.a1 << "," << tc.a2 << ")\n"
	     << "returned (" << rv1 << "," << rv2
	     << ") expected (" << tc.rv1 << "," << tc.rv2 << ")\n"
	     << "initial state:\n" << before
	     << "final state:\n" << after
	     << "expected:\n" << tc.exp << endl;
	return false;
}

bool run(testcase tc) {
	int rv;
	string before, after;
	stringstream ss;
	if (tc.method == "key") {
		before = tc.bstset->toString();
		rv = tc.bstset->key(tc.a1);
		after = tc.bstset->toString();
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "find") {
		before = tc.bstset->toString();
		rv = tc.bstset->find(tc.a1);
		after = tc.bstset->toString();
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "first") {
		before = tc.bstset->toString();
		rv = tc.bstset->first(tc.a1);
		after = tc.bstset->toString();
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "last") {
		before = tc.bstset->toString();
		rv = tc.bstset->last(tc.a1);
		after = tc.bstset->toString();
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "next") {
		before = tc.bstset->toString();
		rv = tc.bstset->next(tc.a1);
		after = tc.bstset->toString();
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "prev") {
		before = tc.bstset->toString();
		rv = tc.bstset->prev(tc.a1);
		after = tc.bstset->toString();
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "access") {
		before = tc.bstset->toString();
		rv = tc.bstset->access(tc.a1,tc.a2);
		after = tc.bstset->toString();
		tc.exp = before;
		return test2(tc,rv,before,after);
	} else if (tc.method == "setkey") {
		before = tc.bstset->toString();
		tc.bstset->setkey(tc.a1,tc.a2);
		after = tc.bstset->toString();
		return test2(tc,0,before,after);
	} else if (tc.method == "insert") {
		before = tc.bstset->toString();
		int rv2 = tc.a2;
		rv = tc.bstset->insert(tc.a1,rv2);
		after = tc.bstset->toString();
		return test2x(tc,rv,rv2,before,after);
		return false;
	} else if (tc.method == "remove") {
		before = tc.bstset->toString();
		int rv2 = tc.a2;
		tc.bstset->remove(tc.a1,rv2);
		after = tc.bstset->toString();
		return test2x(tc,0,rv2,before,after);
	} else if (tc.method == "join") {
		before = tc.bstset->toString();
		rv = tc.bstset->join(tc.a1,tc.a2,tc.a3);
		after = tc.bstset->toString();
		return test3(tc,rv,before,after);
		return false;
	} else if (tc.method == "split") {
		before = tc.bstset->toString();
		BstSet::BstPair rv(0,0);
		rv = tc.bstset->split(tc.a1,tc.a2);
		after = tc.bstset->toString();
		return test2x(tc,rv.t1,rv.t2,before,after);
	}
	cout << "\nError: unknown test\n";
	return false;
};

void runTests() {
	BalBstSet bstset; string s;
	testcase tests[] = {

	// object method a1 2 3 retval pair expected output
	{&bstset, "setkey", 1,20, 0, 0, 0, ""},
	{&bstset, "setkey", 1,20, 0, 0, 0, ""},
	{&bstset, "setkey", 2,19, 0, 0, 0, ""},
	{&bstset, "setkey", 3,18, 0, 0, 0, ""},
	{&bstset, "setkey", 4,17, 0, 0, 0, ""},
	{&bstset, "setkey", 5,16, 0, 0, 0, ""},
	{&bstset, "setkey", 6,15, 0, 0, 0, ""},
	{&bstset, "setkey", 7,14, 0, 0, 0, ""},
	{&bstset, "setkey", 8,13, 0, 0, 0, ""},
	{&bstset, "setkey", 9,12, 0, 0, 0, ""},
	{&bstset, "setkey",10,11, 0, 0, 0, ""},
	{&bstset, "setkey",11,10, 0, 0, 0, ""},
	{&bstset, "setkey",12, 9, 0, 0, 0, ""},
	{&bstset, "setkey",13, 8, 0, 0, 0, ""},
	{&bstset, "setkey",14, 7, 0, 0, 0, ""},
	{&bstset, "setkey",15, 6, 0, 0, 0, ""},
	{&bstset, "setkey",16, 5, 0, 0, 0, ""},
	{&bstset, "setkey",17, 4, 0, 0, 0, ""},
	{&bstset, "setkey",18, 3, 0, 0, 0, ""},
	{&bstset, "setkey",19, 2, 0, 0, 0, ""},
	{&bstset, "setkey",20, 1, 0, 0, 0, ""},
	{&bstset,    "key", 1, 0, 0,20, 0, ""},
	{&bstset,    "key",10, 0, 0,11, 0, ""},

	{&bstset, "insert", 2, 1, 0, 1, 1,
		"(b:19:1) a*20:1\n"},
	{&bstset, "insert", 3, 1, 0, 1, 2, 
		"(c:18:1) b*19:1 (a:20:1)\n"},
	{&bstset, "insert", 4, 2, 0, 1, 2, 
		"((d:17:1) c:18:1) b*19:2 (a:20:1)\n"},
	{&bstset, "insert", 5, 2, 0, 1, 2, 
		"((e:16:1) d:17:1 (c:18:1)) b*19:2 (a:20:1)\n"},
	{&bstset, "insert", 6, 2, 0, 1, 2, 
		"(((f:15:1) e:16:1) d:17:2 (c:18:1)) b*19:2 (a:20:1)\n"},
	{&bstset, "insert", 7, 2, 0, 1, 2, 
		"(((g:14:1) f:15:1 (e:16:1)) d:17:2 (c:18:1)) b*19:2 "
			"(a:20:1)\n"},
	{&bstset, "insert", 8, 2, 0, 1, 4, 
		"(((h:13:1) g:14:1) f:15:2 (e:16:1)) d*17:2 "
			"((c:18:1) b:19:2 (a:20:1))\n"},
	{&bstset, "insert", 9, 4, 0, 1, 4, 
		"(((i:12:1) h:13:1 (g:14:1)) f:15:2 (e:16:1)) d*17:2 "
			"((c:18:1) b:19:2 (a:20:1))\n"},
	{&bstset, "insert",10,4, 0, 1, 4, 
		"((((j:11:1) i:12:1) h:13:2 (g:14:1)) f:15:2 (e:16:1)) d*17:3 "
			"((c:18:1) b:19:2 (a:20:1))\n"},
	{&bstset, "insert",11,4, 0, 1, 4, 
		"((((k:10:1) j:11:1 (i:12:1)) h:13:2 (g:14:1)) f:15:2 "
			"(e:16:1)) d*17:3 ((c:18:1) b:19:2 (a:20:1))\n"},
	{&bstset, "insert",12,4, 0, 1, 4, 
		"((((l:9:1) k:10:1) j:11:2 (i:12:1)) h:13:2 ((g:14:1) f:15:2 "
			"(e:16:1))) d*17:3 ((c:18:1) b:19:2 (a:20:1))\n"},
	{&bstset, "insert",13,4, 0, 1, 4, 
		"((((m:8:1) l:9:1 (k:10:1)) j:11:2 (i:12:1)) h:13:2 ((g:14:1) "
			"f:15:2 (e:16:1))) d*17:3 "
			"((c:18:1) b:19:2 (a:20:1))\n"},
	{&bstset, "insert",17,19, 0, 1, 19, 
		"((((m:8:1) l:9:1 (k:10:1)) j:11:2 (i:12:1)) h:13:2 ((g:14:1) "
			"f:15:2 (e:16:1))) d*17:3 ((c:18:1) b:19:2 (a:20:1))\n"
		"s*2:1 (q:4:1)\n"},
	{&bstset, "insert",18,19, 0, 1, 18, 
		"((((m:8:1) l:9:1 (k:10:1)) j:11:2 (i:12:1)) h:13:2 ((g:14:1) "
			"f:15:2 (e:16:1))) d*17:3 ((c:18:1) b:19:2 (a:20:1))\n"
		"(s:2:1) r*3:1 (q:4:1)\n"},
	{&bstset, "insert",20,19, 0, 1, 18, 
		"((((m:8:1) l:9:1 (k:10:1)) j:11:2 (i:12:1)) h:13:2 ((g:14:1) "
			"f:15:2 (e:16:1))) d*17:3 ((c:18:1) b:19:2 (a:20:1))\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1)\n"},

	{&bstset, "find", 3, 0, 0, 4, 0,""},
	{&bstset, "find", 5, 0, 0, 4, 0,""},
	{&bstset, "find",17, 0, 0,18, 0,""},
	{&bstset,"first", 4, 0, 0,13, 0,""},
	{&bstset, "last", 4, 0, 0, 1, 0,""},
	{&bstset, "next",10, 0, 0, 9, 0,""},
	{&bstset, "next", 9, 0, 0, 8, 0,""},
	{&bstset, "next", 1, 0, 0, 0, 0,""},
	{&bstset, "prev", 7, 0, 0, 8, 0,""},
	{&bstset, "prev",10, 0, 0,11, 0,""},
	{&bstset, "prev", 4, 0, 0, 5, 0,""},
	{&bstset,"access",10, 4, 0,11, 0,""},
	{&bstset,"access",15, 4, 0, 6, 0,""},
	{&bstset,"access", 5, 4, 0, 0, 0,""},

	{&bstset,"join", 18, 16, 4, 4, 0,
		"((((t:1:1) s:2:1) r:3:2 (q:4:1)) p:5:3 "
			"((((m:8:1) l:9:1 (k:10:1)) j:11:2 (i:12:1)) h:13:2 "
			"((g:14:1) f:15:2 (e:16:1)))) d*17:3 "
			"((c:18:1) b:19:2 (a:20:1))\n"},
	{&bstset,"split",13, 4, 0,18, 8,
		"(((l:9:1) k:10:1) j:11:2 (i:12:1)) h*13:3 (((g:14:1) f:15:2 "
			"(e:16:1)) d:17:3 ((c:18:1) b:19:2 (a:20:1)))\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1 (p:5:1))\n"},

	{&bstset, "remove", 9, 8, 0, 0, 8,
		"((l:9:1) k:10:2 (j:11:1)) h*13:3 (((g:14:1) f:15:2 (e:16:1)) "
			"d:17:3 ((c:18:1) b:19:2 (a:20:1)))\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1 (p:5:1))\n"},
	{&bstset, "remove", 4, 8, 0, 0, 8,
		"((l:9:1) k:10:2 (j:11:1)) h*13:3 (((g:14:1) f:15:1) e:16:2 "
			"((c:18:1) b:19:2 (a:20:1)))\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1 (p:5:1))\n"},
	{&bstset, "remove", 8, 8, 0, 0, 5, 
		"(((l:9:1) k:10:1) j:11:2 ((g:14:1) f:15:1)) e*16:3 "
			"((c:18:1) b:19:2 (a:20:1))\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1 (p:5:1))\n"},
	{&bstset, "remove", 7,5, 0, 0, 5, 
		"(((l:9:1) k:10:1) j:11:2 (f:15:1)) e*16:3 "
			"((c:18:1) b:19:2 (a:20:1))\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1 (p:5:1))\n"},
	{&bstset, "remove",10, 5, 0, 0, 5, 
		"((l:9:1) k:10:2 (f:15:1)) e*16:3 ((c:18:1) b:19:2 (a:20:1))\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1 (p:5:1))\n"},
	{&bstset, "join",18,14,5, 5, 0, 
		"((((t:1:1) s:2:1) r:3:2 (q:4:1 (p:5:1))) n:7:3 ((l:9:1) "
			"k:10:2 (f:15:1))) e*16:3 ((c:18:1) b:19:2 "
			"(a:20:1))\n"},
	{&bstset, "split",16,5, 0,18, 5, 
		"(((n:7:1) l:9:1) k:10:2 (f:15:1)) e*16:3 "
			"((c:18:1) b:19:2 (a:20:1))\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1)\n"},
	{&bstset, "split", 6, 5,0,12, 2, 
		"((e:16:1) c:18:1) b*19:2 (a:20:1)\n"
		"(n:7:1) l*9:1 (k:10:1)\n"
		"((t:1:1) s:2:1) r*3:2 (q:4:1)\n"},
	{&bstset,"fin",0,0,0,0,0,""},

	};
	testcase *p;
	bool success = true;
	for (p = tests; p->method != "fin"; p++) {
		success &= run(*p);
	}
	if (success) cout << "all tests passed\n";
}

/**
 *  Unit test for BalBstSet data structure.
 */
int main() { runTests(); }
