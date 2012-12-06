#include "stdinc.h"
#include "UiDlist.h"
#include "Util.h"

void perfTest(int n) {
	UiDlist lst(n);
	int perm[n+1];
	Util::genPerm(n,perm);

	cout << "perfTest " << n << endl;

	uint32_t t0 = Util::getTime();
	for (int i = 1; i <= n; i++) lst.addLast(i);
	uint32_t t1= Util::getTime();
	double addBack = ((double) t1 - (double) t0)/n;
	cout << "appending to end: " << addBack << " us per operation\n";

	t0= Util::getTime();
	for (int i = 1; i <= n; i++) lst.removeFirst();
	t1= Util::getTime();
	double removeFront = ((double) t1 - (double) t0)/n;
	cout << "removing from front: " << removeFront << " us per operation\n";

	t0 = Util::getTime();
	for (int i = 1; i <= n; i++) lst.addLast(perm[i]);
	t1= Util::getTime();
	double addBackRand = ((double) t1 - (double) t0)/n;
	cout << "appending to end in random order: " << addBack
	     << " us per operation\n";

	t0= Util::getTime();
	for (int i = 1; i <= n; i++) lst.removeFirst();
	t1= Util::getTime();
	removeFront = ((double) t1 - (double) t0)/n;
	cout << "removing from front: " << removeFront << " us per operation\n";

	for (int i = 1; i <= n; i++) lst.addLast(perm[i]);
	t0= Util::getTime();
	for (int i = 1; i <= n; i++) lst.remove(i);
	t1= Util::getTime();
	double removeByValue = ((double) t1 - (double) t0)/n;
	cout << "removing by value: " << removeByValue << " us per operation\n";

	for (int i = 1; i <= n; i++) lst.addFirst(i);
	int sum = 0;
	t0= Util::getTime();
	for (int i = lst.first(); i != 0; i = lst.next(i)) sum += i;
	t1= Util::getTime();
	double sumInOrder = ((double) t1 - (double) t0)/n;
	cout << "summing in order: " << sumInOrder << " us per operation "
	     << sum << "\n";

	if (n <= 10000) {
		sum = 0;
		t0= Util::getTime();
		for (int i = 1; i <= n; i++) sum += lst.get(perm[i]);
		t1= Util::getTime();
		double sumRandom = ((double) t1 - (double) t0)/n;
		cout << "summing in random order: " << sumRandom
		     << " us per operation " << sum << "\n";
	}

	lst.clear();
	for (int i = 1; i <= n/2; i++) lst.addLast(perm[i]);
	t0 = Util::getTime();
	sum = 0;
	for (int i = 1; i <= n; i++) sum += lst.member(i);
	t1 = Util::getTime();
	double memberTest = ((double) t1 - (double) t0)/n;
	cout << sum << " " << t0 << " " << t1 << endl;
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
