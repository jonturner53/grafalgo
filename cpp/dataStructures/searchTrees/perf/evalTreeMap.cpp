#include "stdinc.h"
#include "TreeMap.h"
#include "Util.h"

void basicEval(int n) {
	int t1, t2;
	TreeMap map(n);
	int *perm = new int[2*n];
	Util::genPerm(2*n,perm);

	cout << "putting in random order: ";
	t1 = Util::getTime();
	for (int i = 0; i < n; i++) {
		map.put(1+perm[i],i);
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;

	cout << "getting in reverse random order (hits): ";
	t1 = Util::getTime();
	for (int i = 0; i < n; i++) {
		map.get(1+perm[n-(i+1)]);
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;

	cout << "getting in random order (misses): ";
	t1 = Util::getTime();
	for (int i = n; i < 2*n; i++) {
		map.get(1+perm[i]);
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;

	cout << "remapping existing pairs: ";
	t1 = Util::getTime();
	for (int i = 0; i < n; i++) {
		map.put(1+perm[i],-(i+1));
	}
	t2 = Util::getTime();
	cout << t2-t1 << " " << ((double) (t2-t1))/n << endl;

	cout << "remove/put pairs: ";
	t1 = Util::getTime();
	for (int i = 0; i < n; i++) {
		map.remove(1+perm[i]);
		map.put(1+perm[i+n],i+n);
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
