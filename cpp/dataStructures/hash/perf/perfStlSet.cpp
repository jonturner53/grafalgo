#include "stdinc.h"
#include <set>
#include "Util.h"

void perfTest(int n) {
	set<int> sett;
	int perm[n+1];
	Util::genPerm(n,perm);

	cout << "perfTest " << n << endl;

	uint32_t t0 = Util::getTime();
	for (int i = 1; i <= n; i++) sett.insert(i);
	uint32_t t1= Util::getTime();
	double addBack = ((double) t1 - (double) t0)/n;
	cout << "inserting: " << addBack << " us per operation\n";

	t0= Util::getTime();
	for (int i = 1; i <= n; i++) sett.erase(sett.begin());
	t1= Util::getTime();
	double removeFront = ((double) t1 - (double) t0)/n;
	cout << "removing from front: " << removeFront << " us per operation\n";

	t0 = Util::getTime();
	for (int i = 1; i <= n; i++) sett.insert(perm[i]);
	t1= Util::getTime();
	double addBackRand = ((double) t1 - (double) t0)/n;
	cout << "inserting in random order: " << addBack
	     << " us per operation\n";

	t0= Util::getTime();
	for (int i = 1; i <= n; i++) sett.erase(sett.begin());
	t1= Util::getTime();
	removeFront = ((double) t1 - (double) t0)/n;
	cout << "removing from front: " << removeFront << " us per operation\n";

	set<int>::iterator p;
	if (n <= 10000) {
		for (int i = 1; i <= n; i++) sett.insert(perm[i]);
		t0= Util::getTime();
		for (int i = 1; i <= n; i++) { sett.erase(i); }
		t1= Util::getTime();
		double removeByValue = ((double) t1 - (double) t0)/n;
		cout << "removing by value: " << removeByValue
		     << " us per operation\n";
	}

	for (int i = 1; i <= n; i++) sett.insert(perm[i]);
	int sum = 0;
	t0= Util::getTime();
	for (p = sett.begin(); p != sett.end(); p++) sum += *p;
	t1= Util::getTime();
	double sumInOrder = ((double) t1 - (double) t0)/n;
	cout << "summing in order: " << sumInOrder << " us per operation "
	     << sum << "\n";

	sett.clear();
        for (int i = 1; i <= n/2; i++) sett.insert(perm[i]);
        t0= Util::getTime();
	sum = 0;
        for (int i = 1; i <= n; i++)
		sum += (sett.find(i) != sett.end() ? 1 : 0);
        t1= Util::getTime();
        double memberTest = ((double) t1 - (double) t0)/n;
        cout << "membership testing: " << memberTest << " us per operation "
	     << sum << "\n";

	cout << endl;
}

main() {
	perfTest(100);
	perfTest(1000);
	perfTest(10000);
	perfTest(100000);
	perfTest(1000000);
}
