#include "stdinc.h"
#include "SelfAdjBsts.h"
#include "Util.h"
#include "Utest.h"

void basicTests() {
	int n = 13;
	SelfAdjBsts st(n);
	int *perm = new int[n+1];

	Util::genPerm(n,perm);
	for (int i = 1; i <= n; i++) {
		st.setkey(perm[i],i);
	}
	string s;
	cout << st.toString(s);
	sset r1 = perm[1];
	cout << "inserting in key order\n";
	for (int i = 2; i <= n; i++) {
		st.insert(perm[i],r1);
		cout << st.toString(s) << endl;
	}
	cout << "removing in key order\n";
	for (int i = 1; i < n; i++) {
		st.remove(perm[i],r1);
		cout << st.toString(s) << endl;
	}
	cout << "inserting in random order\n";
	r1 = perm[n/2];
	int j = 0;
	for (int i = 1; i <= n; i++) {
		int j = (j+5) % n;
		if (j+1 == n/2) continue;
		st.insert(perm[j+1],r1);
		cout << st.toString(s) << endl;
	}

	cout << "removing in node order\n";
	for (int i = 1; i < n; i++) {
		st.remove(i,r1);
		cout << st.toString(s) << endl;
	}
	
/*
        Utest::assertEqual(st.toString(s), "(a*)\n(b*)\n(c*)\n(d*)\n(e*)\n"
                                             "(f*) (g*) (h*) (i*)\n(j*)"
                                             "(k*) (l*) (m*)",
                                             "initial trees not correct");
*/
}

main() {
	basicTests();
}
