#include "stdinc.h"
#include "Util.h"

int64_t i386_clock64(void)
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

main() {

	for (int i = 1; i <= 20; i++) {
		int64_t cyc0 = i386_clock64(); uint32_t t0 = Util::getTime();
		usleep(20000);
		int64_t cyc1 = i386_clock64(); uint32_t t1 = Util::getTime();
		cout << (cyc1-cyc0) << " cycles, " << (t1-t0) << " us,"
		     << (cyc1-cyc0)/(t1-t0) << " cycles/us\n";
	}
}
