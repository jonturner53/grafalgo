#include "stdinc.h"
#include "HashMap.h"
#include "Util.h"
#include <vector>

int64_t cycCnt(void)
{
 uint32_t hi, lo;
 uint64_t v64;

 /* rdtsc: Loads the time-stamp counter value into %edx:%eax */
 asm volatile ("cpuid; rdtsc; movl %%edx, %0; movl %%eax, %1" /* Read the counter */
     : "=r" (hi), "=r" (lo)                  /* output */
     :                                       /* input (none) */
     : "%edx", "%eax");                      /* Let gcc know whch registers are used */

 v64 = ((uint64_t)hi << 32) + (uint64_t)lo;

 return (int64_t)v64;
}

int calibrate() {
	int result;
	for (int i = 1; i <= 5; i++) {
		int64_t cyc0 = cycCnt(); uint32_t t0 = Util::getTime();
		usleep(20000);
		int64_t cyc1 = cycCnt(); uint32_t t1 = Util::getTime();
		cout << (cyc1-cyc0) << " cycles, " << (t1-t0) << " us,"
		     << (cyc1-cyc0)/(t1-t0) << " cycles/us\n";
		result = (int) ((cyc1-cyc0)/(t1-t0));
	}
	return result;
}

void perfTest(int n, int ticksPerUs) {
	int repCnt = 10;
	HashMap map(n);
	uint64_t keys[n+1];

	cout << "perfTest " << n << endl;

	// fill table with pairs having random keys
	int miss = 0;
	for (int i = 1; i <= n; ) {
		keys[i] = random(); keys[i] *= random();
		if (map.put(keys[i],1)) i++;
		else miss++;
	}
	if (miss > 0)
		cout << "put failed " << miss << " times during initial "
			"insert operations\n";

	vector<int> loadDist(20);
	int b = map.loadStats(loadDist);
	cout << "initial load distribution: ";
	for (int i = 0; i < b; i++) cout << loadDist[i] << " ";
	cout << endl;
		
	// next do random searches on full table, starting with
	// keys that are in table, then arbitrary keys (mostly
	// not in table)
	int cnt = 0; int badCnt = 0;
	double minTime = BIGINT; double maxTime = 0; double avgTime = 0;
	for (int i = 1; i <= n; i++) {
		int *samples = new int[repCnt+1];
		for (int j = 1; j <= repCnt; j++) {
			samples[j] = randint(1,n);
		}
		int64_t t0 = cycCnt();
		for (int j = 1; j <= repCnt; j++) {
			int k = samples[j];
			map.get(keys[k]);
		}
		int64_t t1 = cycCnt();
		int64_t diff = t1 - t0; 
		if (diff > 2*repCnt*ticksPerUs) { badCnt++; continue; }
		cnt++;
		double insertTime = ((double) diff)/repCnt;
		minTime = min(minTime,insertTime);
		maxTime = max(maxTime,insertTime);
		avgTime += insertTime;
		delete [] samples;
	}
	avgTime /= cnt;
	avgTime *= (1000.0/ticksPerUs);
	minTime *= (1000.0/ticksPerUs);
	maxTime *= (1000.0/ticksPerUs);
	cout << "time for get operations on random keys in table: "
	     << minTime << " " << avgTime << " " << maxTime << endl;
	if (badCnt > 0) cout << badCnt << " rejected samples\n";

	cnt = 0; badCnt = 0; minTime = BIGINT; maxTime = 0; avgTime = 0;
	for (int i = 1; i <= n; i++) {
		uint64_t *newKeys = new uint64_t[repCnt+1];
		for (int j = 1; j <= repCnt; j++) {
			newKeys[j] = random(); newKeys[j] *= random();
		}
		int64_t t0 = cycCnt();
		for (int j = 1; j <= repCnt; j++) {
			map.get(newKeys[j]);
		}
		int64_t t1 = cycCnt();
		int64_t diff = t1 - t0;
		if (diff > 2*repCnt*ticksPerUs) { badCnt++; continue; }
		cnt++;
		double insertTime = ((double) diff)/repCnt;
		minTime = min(minTime,insertTime);
		maxTime = max(maxTime,insertTime);
		avgTime += insertTime;
		delete [] newKeys;
	}
	avgTime /= cnt;
	avgTime *= (1000.0/ticksPerUs);
	minTime *= (1000.0/ticksPerUs);
	maxTime *= (1000.0/ticksPerUs);
	cout << "time for get operations on random keys : "
	     << minTime << " " << avgTime << " " << maxTime << endl;
	if (badCnt > 0) cout << badCnt << " rejected samples\n";

	// now, do remove/insert operation pairs
	cnt = 0; badCnt = 0; minTime = BIGINT; maxTime = 0; avgTime = 0;
	for (int i = 1; i <= n; i++) {
		int *samples = new int[repCnt+1];
		uint64_t *newKeys = new uint64_t[repCnt+1];
		for (int j = 1; j <= repCnt; j++) {
			samples[j] = randint(1,n);
			newKeys[j] = random(); newKeys[j] *= random();
		}
		int64_t t0 = cycCnt();
		for (int j = 1; j <= repCnt; j++) {
			int k = samples[j];
			map.remove(keys[k]);
			map.put(newKeys[j],1);
			keys[k] = newKeys[j];
		}
		int64_t t1= cycCnt();
		int64_t diff = t1 - t0;
		if (diff > 4*repCnt*ticksPerUs) { badCnt++; continue; } 
		cnt++;
		double insertTime = ((double) diff)/repCnt;
		minTime = min(minTime,insertTime);
		maxTime = max(maxTime,insertTime);
		avgTime += insertTime;
		delete [] samples;
		delete [] newKeys;
	}
	b = map.loadStats(loadDist);
	cout << "final load distribution: ";
	for (int i = 0; i < b; i++) cout << loadDist[i] << " ";
	cout << endl;

	avgTime /= cnt;
	avgTime *= (1000.0/ticksPerUs);
	minTime *= (1000.0/ticksPerUs);
	maxTime *= (1000.0/ticksPerUs);
	cout << "time for random remove/put operations: "
	     << minTime << " " << avgTime << " " << maxTime << endl;
	if (badCnt > 0) cout << badCnt << " rejected samples\n";
}

main() {
	int ticksPerUs = calibrate();
	perfTest(1 << 8,ticksPerUs);
	perfTest(1 << 9,ticksPerUs);
	perfTest(1 << 10,ticksPerUs);
	perfTest(1 << 11,ticksPerUs);
	perfTest(1 << 12,ticksPerUs);
	perfTest(1 << 13,ticksPerUs);
	perfTest(1 << 14,ticksPerUs);
	perfTest(1 << 15,ticksPerUs);
	perfTest(1 << 16,ticksPerUs);
	perfTest(1 << 17,ticksPerUs);
	perfTest(1 << 18,ticksPerUs);
	perfTest(1 << 19,ticksPerUs);
	perfTest((1 << 20)-1,ticksPerUs);
}
