#include "stdinc.h"
#include "HashSet.h"
#include "Util.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n = 10; string s1;
	HashSet set(n);
	int *perm = new int[2*n+1];
	Util::genPerm(2*n,perm);

	// adding n keys
	for (int i = 1; i <= n; i++) {
		set.insert(perm[i]);
		Utest::assertTrue(set.member(perm[i]),
			"inserted key not a member of set");
	}
	cout << "set of 10: " << set << endl;
	Utest::assertTrue(set.size() == n,
		"set size does not match number of inserted keys");
	// checking that sample of non-keys are not in set
	for (int i = n+1; i <= 2*n; i++) {
		Utest::assertTrue(!set.member(perm[i]),
			"key that was not inserted is a member of set");
	}

	// removing keys
	for (int i = 1; i <= n; i++) {
		set.remove(perm[i]);
		Utest::assertTrue(!set.member(perm[i]),
			"removed key is still member of set");
	}
	cout << "passed basic tests\n";
}

int main() {
	basicTests();
}
