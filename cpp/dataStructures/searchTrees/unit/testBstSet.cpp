/** \file TestBstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "BstSet.h"
#include "Utest.h"

using namespace grafalgo;

struct testcase {
public:
	BstSet *bstset;
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
	string s, before, after;
	stringstream ss;
	if (tc.method == "key") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->key(tc.a1);
		after = tc.bstset->toString(s);
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "find") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->find(tc.a1);
		after = tc.bstset->toString(s);
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "first") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->first(tc.a1);
		after = tc.bstset->toString(s);
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "last") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->last(tc.a1);
		after = tc.bstset->toString(s);
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "suc") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->suc(tc.a1);
		after = tc.bstset->toString(s);
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "pred") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->pred(tc.a1);
		after = tc.bstset->toString(s);
		tc.exp = before;
		return test1(tc,rv,before,after);
	} else if (tc.method == "access") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->access(tc.a1,tc.a2);
		after = tc.bstset->toString(s);
		tc.exp = before;
		return test2(tc,rv,before,after);
	} else if (tc.method == "setkey") {
		before = tc.bstset->toString(s);
		tc.bstset->setkey(tc.a1,tc.a2);
		after = tc.bstset->toString(s);
		return test2(tc,0,before,after);
	} else if (tc.method == "insert") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->insert(tc.a1,tc.a2);
		after = tc.bstset->toString(s);
		return test2(tc,rv,before,after);
	} else if (tc.method == "remove") {
		before = tc.bstset->toString(s);
		tc.bstset->remove(tc.a1,tc.a2);
		after = tc.bstset->toString(s);
		return test2(tc,0,before,after);
	} else if (tc.method == "join") {
		before = tc.bstset->toString(s);
		rv = tc.bstset->join(tc.a1,tc.a2,tc.a3);
		after = tc.bstset->toString(s);
		return test3(tc,rv,before,after);
	} else if (tc.method == "split") {
		before = tc.bstset->toString(s);
		BstSet::BstPair rv(0,0);
		rv = tc.bstset->split(tc.a1,tc.a2);
		after = tc.bstset->toString(s);
		return test2x(tc,rv.t1,rv.t2,before,after);
	}
	cout << "\nError: unknown test\n";
	return false;
};

void runTests() {
	BstSet bstset; string s;
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

	{&bstset, "insert", 1, 2, 0, 1, 0,
		"b*19 (a:20)\n"},
	{&bstset, "insert", 3, 2, 0, 1, 0, 
		"(c:18) b*19 (a:20)\n"},
	{&bstset, "insert", 4, 2, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"},
	{&bstset, "insert", 5,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\nj*11 (e:16)\n"},
	{&bstset, "insert",12,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n(l:9) j*11 (e:16)\n"},
	{&bstset, "insert",11,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(l:9 (k:10)) j*11 (e:16)\n"},
	{&bstset, "insert", 8,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(l:9 (k:10)) j*11 ((h:13) e:16)\n"},
	{&bstset, "insert", 9,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(l:9 (k:10)) j*11 (((i:12) h:13) e:16)\n"},
	{&bstset, "insert", 6,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(l:9 (k:10)) j*11 (((i:12) h:13 (f:15)) e:16)\n"},
	{&bstset, "insert", 7,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(l:9 (k:10)) j*11 "
			"(((i:12) h:13 ((g:14) f:15)) e:16)\n"},
	{&bstset, "insert",13,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"((m:8) l:9 (k:10)) j*11 "
			"(((i:12) h:13 ((g:14) f:15)) e:16)\n"},
	{&bstset, "insert",15,10, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(((o:6) m:8) l:9 (k:10)) j*11 "
			"(((i:12) h:13 ((g:14) f:15)) e:16)\n"},
	{&bstset, "insert",17,19, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(((o:6) m:8) l:9 (k:10)) j*11 "
			"(((i:12) h:13 ((g:14) f:15)) e:16)\n"
		"s*2 (q:4)\n"},
	{&bstset, "insert",18,19, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(((o:6) m:8) l:9 (k:10)) j*11 "
			"(((i:12) h:13 ((g:14) f:15)) e:16)\n"
		"s*2 ((r:3) q:4)\n"},
	{&bstset, "insert",20,19, 0, 1, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"(((o:6) m:8) l:9 (k:10)) j*11 "
			"(((i:12) h:13 ((g:14) f:15)) e:16)\n"
		"(t:1) s*2 ((r:3) q:4)\n"},

	{&bstset, "find", 3, 0, 0, 2, 0,""},
	{&bstset, "find", 5, 0, 0,10, 0,""},
	{&bstset, "find",18, 0, 0,19, 0,""},
	{&bstset,"first", 2, 0, 0, 4, 0,""},
	{&bstset, "last",10, 0, 0, 5, 0,""},
	{&bstset,  "suc",10, 0, 0, 9, 0,""},
	{&bstset,  "suc", 9, 0, 0, 8, 0,""},
	{&bstset,  "suc", 5, 0, 0, 0, 0,""},
	{&bstset, "pred", 7, 0, 0, 8, 0,""},
	{&bstset, "pred",10, 0, 0,11, 0,""},
	{&bstset, "pred", 4, 0, 0, 0, 0,""},
	{&bstset,"access",10,10, 0,11, 0,""},
	{&bstset,"access",15,10, 0, 6, 0,""},
	{&bstset,"access", 5,10, 0, 0, 0,""},

	{&bstset, "remove",15,10, 0, 0, 0,
		"((d:17) c:18) b*19 (a:20)\n"
		"((m:8) l:9 (k:10)) j*11 (((i:12) h:13 ((g:14) f:15)) e:16)\n"
		"(t:1) s*2 ((r:3) q:4)\n"},
	{&bstset, "remove", 8,10, 0, 0, 0,
		"((d:17) c:18) b*19 (a:20)\n"
		"((m:8) l:9 (k:10)) j*11 ((i:12 ((g:14) f:15)) e:16)\n"
		"(t:1) s*2 ((r:3) q:4)\n"},
	{&bstset, "remove", 6,10, 0, 0, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"((m:8) l:9 (k:10)) j*11 ((i:12 (g:14)) e:16)\n"
		"(t:1) s*2 ((r:3) q:4)\n"},
	{&bstset, "remove", 7,10, 0, 0, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"((m:8) l:9 (k:10)) j*11 ((i:12) e:16)\n"
		"(t:1) s*2 ((r:3) q:4)\n"},
	{&bstset, "remove",10,10, 0, 0, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"((m:8) l:9) k*10 ((i:12) e:16)\n"
		"(t:1) s*2 ((r:3) q:4)\n"},
	{&bstset, "join",19,16,11,16, 0, 
		"((d:17) c:18) b*19 (a:20)\n"
		"((t:1) s:2 ((r:3) q:4)) p*5 "
			"(((m:8) l:9) k:10 ((i:12) e:16))\n"},
	{&bstset, "split",12,16, 0, 16, 11, 
		"((d:17) c:18) b*19 (a:20)\n"
		"k*10 ((i:12) e:16)\n"
		"((t:1) s:2 ((r:3) q:4)) p*5 (m:8)\n"},
	{&bstset, "join",16,10,2,10, 0, 
		"(((t:1) s:2 ((r:3) q:4)) p:5 (m:8)) j*11 "
			"(((d:17) c:18) b:19 (a:20))\n"
		"k*10 ((i:12) e:16)\n"},
	{&bstset, "split",17,10,0,19,10, 
		"(p:5 (m:8)) j*11 (((d:17) c:18) b:19 (a:20))\n"
		"k*10 ((i:12) e:16)\n"
		"(t:1) s*2 (r:3)\n"},
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
 *  Unit test for BstSet data structure.
 */
int main() { runTests(); }
