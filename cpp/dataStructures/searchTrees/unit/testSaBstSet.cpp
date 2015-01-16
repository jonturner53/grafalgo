/** \file TestSaBstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "SaBstSet.h"

using namespace grafalgo;

struct testcase {
public:
	SaBstSet *bstset;
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
		before = tc.bstset->toString();
		rv = tc.bstset->key(tc.a1);
		after = tc.bstset->toString();
		return test1(tc,rv,before,after);
	} else if (tc.method == "find") {
		before = tc.bstset->toString();
		rv = tc.bstset->find(tc.a1);
		after = tc.bstset->toString();
		return test1(tc,rv,before,after);
	} else if (tc.method == "access") {
		before = tc.bstset->toString();
		int rv2 = tc.a2;
		int rv1 = tc.bstset->access(tc.a1,rv2);
		after = tc.bstset->toString();
		return test2x(tc,rv1,rv2,before,after);
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
	} else if (tc.method == "remove") {
		before = tc.bstset->toString();
		rv = tc.bstset->findroot(tc.a1);
		tc.bstset->remove(tc.a1,rv);
		after = tc.bstset->toString();
		return test2(tc,rv,before,after);
	} else if (tc.method == "join") {
		before = tc.bstset->toString();
		rv = tc.bstset->join(tc.a1,tc.a2,tc.a3);
		after = tc.bstset->toString();
		return test3(tc,rv,before,after);
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
	SaBstSet bstset; string s;
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

	{&bstset, "insert", 2, 1, 0, 1, 2,
		"b*19 (a:20)\n"},
	{&bstset, "insert", 3, 2, 0, 1, 3, 
		"c*18 (b:19 (a:20))\n"},
	{&bstset, "insert", 4, 3, 0, 1, 4, 
		"d*17 (c:18 (b:19 (a:20)))\n"},
	{&bstset, "insert", 5, 4, 0, 1, 5, 
		"e*16 (d:17 (c:18 (b:19 (a:20))))\n"},
	{&bstset, "insert", 6, 5, 0, 1, 6, 
		"f*15 (e:16 (d:17 (c:18 (b:19 (a:20)))))\n"},
	{&bstset, "insert", 7, 6, 0, 1, 7, 
		"g*14 (f:15 (e:16 (d:17 (c:18 (b:19 (a:20))))))\n"},
	{&bstset, "insert", 8, 7, 0, 1, 8, 
		"h*13 (g:14 (f:15 (e:16 (d:17 (c:18 (b:19 (a:20)))))))\n"},
	{&bstset, "insert", 9, 8, 0, 1, 9, 
		"i*12 (h:13 (g:14 (f:15 (e:16 (d:17 (c:18 (b:19 "
			"(a:20))))))))\n"},
	{&bstset, "insert",10,9, 0, 1,10, 
		"j*11 (i:12 (h:13 (g:14 (f:15 (e:16 (d:17 (c:18 (b:19 "
			"(a:20)))))))))\n"},
	{&bstset, "insert",11,10, 0, 1,11, 
		"k*10 (j:11 (i:12 (h:13 (g:14 (f:15 (e:16 (d:17 (c:18 (b:19 "
			"(a:20))))))))))\n"},
	{&bstset, "insert",12,11, 0, 1,12, 
		"l*9 (k:10 (j:11 (i:12 (h:13 (g:14 (f:15 (e:16 (d:17 (c:18 "
			"(b:19 (a:20)))))))))))\n"},
	{&bstset, "insert",13,12, 0, 1,13, 
		"m*8 (l:9 (k:10 (j:11 (i:12 (h:13 (g:14 (f:15 (e:16 (d:17 "
			"(c:18 (b:19 (a:20))))))))))))\n"},
	{&bstset, "insert",17,19, 0, 1, 17, 
		"m*8 (l:9 (k:10 (j:11 (i:12 (h:13 (g:14 (f:15 (e:16 (d:17 "
			"(c:18 (b:19 (a:20))))))))))))\n"
		"(s:2) q*4\n"},
	{&bstset, "insert",18,17, 0, 1, 18, 
		"m*8 (l:9 (k:10 (j:11 (i:12 (h:13 (g:14 (f:15 (e:16 (d:17 "
                        "(c:18 (b:19 (a:20))))))))))))\n"
		"(s:2) r*3 (q:4)\n"},
	{&bstset, "insert",20,18, 0, 1, 20, 
		"m*8 (l:9 (k:10 (j:11 (i:12 (h:13 (g:14 (f:15 (e:16 (d:17 "
                        "(c:18 (b:19 (a:20))))))))))))\n"
		"t*1 (s:2 (r:3 (q:4)))\n"},

	{&bstset, "find", 3, 0, 0, 3, 0,
		"((m:8) l:9 ((k:10) j:11 ((i:12) h:13 ((g:14) f:15 "
			"((e:16) d:17))))) c*18 (b:19 (a:20))\n"
		"t*1 (s:2 (r:3 (q:4)))\n"},
	{&bstset, "find", 5, 0, 0, 5, 0,
		"((m:8) l:9 (((k:10) j:11 (i:12)) h:13 ((g:14) f:15))) "
			"e*16 ((d:17) c:18 (b:19 (a:20)))\n"
		"t*1 (s:2 (r:3 (q:4)))\n"},
	{&bstset, "find",17, 0, 0,17, 0,
		"((m:8) l:9 (((k:10) j:11 (i:12)) h:13 ((g:14) f:15))) "
			"e*16 ((d:17) c:18 (b:19 (a:20)))\n"
		"(t:1 ((s:2) r:3)) q*4\n"},
	{&bstset,"access",10, 5, 0,11,11,
		"((m:8) l:9) k*10 ((j:11 ((i:12) h:13 ((g:14) f:15))) e:16 "
			"((d:17) c:18 (b:19 (a:20))))\n"
		"(t:1 ((s:2) r:3)) q*4\n"},
	{&bstset,"access",15,11, 0, 6, 6,
		"(((m:8) l:9) k:10 ((j:11 (i:12)) h:13 (g:14))) f*15 (e:16 "
			"((d:17) c:18 (b:19 (a:20))))\n"
		"(t:1 ((s:2) r:3)) q*4\n"},
	{&bstset,"access",12, 6, 0, 9, 9,
		"(((m:8) l:9) k:10 (j:11)) i*12 ((h:13 (g:14)) f:15 (e:16 "
			"((d:17) c:18 (b:19 (a:20)))))\n"
		"(t:1 ((s:2) r:3)) q*4\n"},

	{&bstset,"join", 17, 16, 9,16, 0,
		"((t:1 ((s:2) r:3)) q:4) p*5 ((((m:8) l:9) k:10 (j:11)) i:12 "
			"((h:13 (g:14)) f:15 (e:16 ((d:17) c:18 (b:19 "
			"(a:20))))))\n"},
	{&bstset,"split",13,16, 0,16, 9,
		"(l:9 (k:10 (j:11))) i*12 ((h:13 (g:14)) f:15 (e:16 ((d:17) "
			"c:18 (b:19 (a:20)))))\n"
		"((t:1 ((s:2) r:3)) q:4) p*5\n"},

	{&bstset, "remove", 9, 9, 0,11, 0,
		"(l:9) k*10 (j:11 ((h:13 (g:14)) f:15 (e:16 ((d:17) c:18 "
			"(b:19 (a:20))))))\n"
		"((t:1 ((s:2) r:3)) q:4) p*5\n"},
	{&bstset, "remove", 4,11, 0, 3, 0,
		"(((l:9) k:10) j:11 (((h:13 (g:14)) f:15) e:16)) c*18 (b:19 "
			"(a:20))\n"
		"((t:1 ((s:2) r:3)) q:4) p*5\n"},
	{&bstset, "remove", 8, 3, 0, 6, 0, 
		"(((l:9) k:10) j:11 (g:14)) f*15 ((e:16) c:18 (b:19 (a:20)))\n"
		"((t:1 ((s:2) r:3)) q:4) p*5\n"},
	{&bstset, "remove", 7, 6, 0,10, 0, 
		"((l:9) k:10) j*11 (f:15 ((e:16) c:18 (b:19 (a:20))))\n"
		"((t:1 ((s:2) r:3)) q:4) p*5\n"},
	{&bstset, "remove", 3,10, 0, 5, 0, 
		"((((l:9) k:10) j:11) f:15) e*16 (b:19 (a:20))\n"
		"((t:1 ((s:2) r:3)) q:4) p*5\n"},
	{&bstset, "join",16,14,5,14, 0, 
		"(((t:1 ((s:2) r:3)) q:4) p:5) n*7 (((((l:9) k:10) j:11) "
			"f:15) e:16 (b:19 (a:20)))\n"},
	{&bstset, "split", 6,14, 0,14, 5, 
		"e*16 (b:19 (a:20))\n"
		"(((t:1 ((s:2) r:3)) q:4) p:5) n*7 (((l:9) k:10) j:11)\n"},
	{&bstset, "split",19,14,0,20,14,
		"e*16 (b:19 (a:20))\n"
		"((r:3) q:4 (p:5)) n*7 (((l:9) k:10) j:11)\n"},
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
 *  Unit test for SaBstSet data structure.
 */
int main() { runTests(); }
