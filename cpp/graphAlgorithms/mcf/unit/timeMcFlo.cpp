/** @file timeMcFlo.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include <chrono>
#include "stdinc.h"
#include "Wflograph.h"
#include "Rgraph.h"
#include "mcfCycRed.h"
#include "mcfLcap.h"
#include "mcfScale.h"

using namespace chrono;
using namespace grafalgo;

/** usage: timeMcFlo method reps n m mss ec1 ec2 lo hi 
 * 
 *  TimeMcFlo generates a series of random graphs and records the
 *  time needed to compute a min cost max flow using the specified method.
 *  Reps is the number of repetitions, n is the number of vertices,
 *  m is the total number of edges, mss is the number of edges from the
 *  source and the number to the sink, ec1 is the average capacity
 *  for the src/sink edges, ec2 is the average capacity for the other edges,
 *  lo and hi define the range for the edge costs.
 * 
 *  Method is one of cycRed, lcap, mostNeg and scale.
 *  CycRed refers to the cycle-reduction algorithm.
 *  Lcap is the least-augmenting path algorithm, using Dijkstra's algorithm
 *  for the path searches. MostNeg is a variant of lcap in which the
 *  algorithm finds the flow with the largest negative cost; it may not
 *  be a max flow. Scale refers to the capacity-scaling algorithm.
 *
 *  The output is a single line
 *
 *      n m mss ec1 ec2 lo hi avg min max
 *
 *  where avg is the average time (in microseconds) needed to compute
 *  the min cost max flow, min is the minimum time and max is the
 *  maximum time.
 */
int main(int argc, char* argv[]) {
	int i, reps, n, m, mss, ec1, ec2, lo, hi;
	if (argc != 10 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&mss) != 1 ||
	    sscanf(argv[6],"%d",&ec1) != 1 ||
	    sscanf(argv[7],"%d",&ec2) != 1 ||
	    sscanf(argv[8],"%d",&lo) != 1 ||
	    sscanf(argv[9],"%d",&hi) != 1) {
		Util::fatal("usage: timeMcFlo method reps n m mss ec1 ec2 "
			    "lo hi");
		exit(1); // redundant exit to shutup compiler
	}

	Wflograph wfg; 
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	for (i = 1; i <= reps; i++) {
		Rgraph::flograph(wfg,n,m-2*mss,mss);
		Rgraph::setCapacities(wfg,ec1,ec2);
		Rgraph::setCosts(wfg,lo,hi);

		high_resolution_clock::time_point t1, t2;
		if (strcmp(argv[1],"cycRed") == 0) {
			t1 = high_resolution_clock::now();
			(mcfCycRed(wfg));
		} else if (strcmp(argv[1],"lcap") == 0) {
			t1 = high_resolution_clock::now();
			mcfLcap(wfg,false);
		} else if (strcmp(argv[1],"mostNeg") == 0) {
			t1 = high_resolution_clock::now();
			mcfLcap(wfg,true);
		} else if (strcmp(argv[1],"scale") == 0) {
			t1 = high_resolution_clock::now();
			(mcfScale(wfg));
		} else {
			Util::fatal("timeMcFlo: undefined method");
		}
		t2 = high_resolution_clock::now();
		nanoseconds diff = t2 - t1;
		avgTime += diff.count();
		minTime = min(minTime,diff.count());
		maxTime = max(maxTime,diff.count());
	}
	avgTime /= reps;
	cerr << argv[1] << " " << n << " " << m << " " << mss << " "
	     << ec1 << " " << ec2 << " " << lo << " " << hi << " "
	     << avgTime/1000 << " " << minTime/1000 << " "
	     << maxTime/1000 << endl;
}
