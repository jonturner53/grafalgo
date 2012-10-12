#include "stdinc.h"
#include "HashMap.h"
#include "Util.h"

void basicEval(int n) {
	int t1, t2;
	HashMap map(n);
	int *perm = new int[2*n+1];
	Util::genPerm(2*n,perm);

	cout << "putting in random order: ";
	t1 = Util::getTime();
	for (int i = 1; i <= n; i++) {
		map.put(perm[i],i);
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;

	cout << "getting in reverse random order (hits): ";
	t1 = Util::getTime();
	for (int i = 1; i <= n; i++) {
		map.get(perm[(n+1)-i]);
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;

	cout << "getting in random order (misses): ";
	t1 = Util::getTime();
	for (int i = n+1; i <= 2*n; i++) {
		map.get(perm[i]);
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;

	cout << "remapping existing pairs: ";
	t1 = Util::getTime();
	for (int i = 1; i <= n; i++) {
		if (!map.put(perm[i],-i)) {
			cout << "put failed\n";
			return;
		}
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;

	cout << "remove/put pairs: ";
	t1 = Util::getTime();
	for (int i = 1; i <= n; i++) {
		map.remove(perm[i]);
		if (!map.put(perm[i+n],i+n)) {
			cout << "put failed\n";
			return;
		}
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;
}


main() {
	int n = 1000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 2000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 4000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 10000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 20000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 40000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 100000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 200000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 400000;
	cout << "n=" << n << endl;
	basicEval(n);

	n = 1000000;
	cout << "n=" << n << endl;
	basicEval(n);
}
