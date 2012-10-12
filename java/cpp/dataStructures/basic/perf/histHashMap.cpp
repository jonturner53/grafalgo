#include "stdinc.h"
#include "HashMap.h"
#include "Util.h"

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
	int64_t cyc0 = cycCnt(); uint32_t t0 = Util::getTime();
	usleep(20000);
	int64_t cyc1 = cycCnt(); uint32_t t1 = Util::getTime();
	result = (int) ((cyc1-cyc0)/(t1-t0));
	return result;
}

/** Build histogram of time to search hash table */
void computeHistogram(int n, int ticksPerUs) {
	int repCnt = 10;
	HashMap map(n);
	uint64_t keys[n+1];

	int *hist = new int[250];
	for (int i = 0; i < 250; i++) hist[i] = 0;

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
	int binSize = ticksPerUs/100;
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
		int diff = (t1-t0)/repCnt;
		int k = diff/binSize;
		hist[min(249,k)]++;
		delete [] samples;
	}
	for (int i = 248; i >= 0; i--) hist[i] += hist[i+1];
	for (int i = 0; i < 250; i++) {
		cout << 5*(2*i+1) << " " << hist[i] << endl;
	}
	delete [] hist;
}

main(int argc, char *argv[]) {
	int ticksPerUs = calibrate();
	int n = (1 << 20)-1;
	if (argc == 2) sscanf(argv[1],"%d",&n);
	computeHistogram(n,ticksPerUs);
}
