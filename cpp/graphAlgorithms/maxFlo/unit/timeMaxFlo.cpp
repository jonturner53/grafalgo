/** @file timeMaxFlo.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include <chrono>
#include "stdinc.h"
#include "Flograph.h"
#include "Rgraph.h"
#include "maxCap.h"
#include "capScale.h"
#include "shortPath.h"
#include "dinic.h"
#include "dinicDtrees.h"
#include "prePush.h"
#include "ppFifo.h"

using namespace chrono;
using namespace grafalgo;

/** usage:
 * 	timeMaxFlo method reps n m mss ec1 ec2 
 * 
 *  TimeMaxFlo repeatedly generates a random graph and computes
 *  a maximum flow using the specified method.
 *  Reps is the number of repetitions.
 *  n is the number of vertices, p is the edge probability,
 *  mss is the number of source and sink edges
 *  ec1 is the mean edge capacity for the source/sink edges,
 *  ec2 is the mean edge capacity of the other edges.
 *
 *  The output is a single line containing
 * 
 *      method n m mss ec1 ec2 avg min max
 *
 *  where avg is the average time used to compute a max flow,
 *  min is the minimum time and max is the maximum time
 */
int main(int argc, char* argv[]) {
	int i, reps, n, m, mss, ec1, ec2, floVal;
	if (argc != 8 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&mss) != 1 ||
	    sscanf(argv[6],"%d",&ec1) != 1 ||
	    sscanf(argv[7],"%d",&ec2) != 1) {
		Util::fatal("usage: timeMaxFlo method reps n m mss ec1 ec2");
		exit(1); // redundant exit to shutup compiler
	}

	Flograph fg(n,m,1,2); 
	high_resolution_clock::time_point t1, t2;
	nanoseconds diff;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	for (i = 1; i <= reps; i++) {
		Rgraph::flograph(fg,n,m,mss); Rgraph::edgeCapacity(fg,ec1,ec2);

		if (strcmp(argv[1],"maxCap") == 0) {
			t1 = high_resolution_clock::now();
			maxCap(fg,floVal);
		} else if (strcmp(argv[1],"capScale") == 0) {
			t1 = high_resolution_clock::now();
			capScale(fg,floVal);
		} else if (strcmp(argv[1],"shortPath") == 0) {
			t1 = high_resolution_clock::now();
			shortPath(fg,floVal);
		} else if (strcmp(argv[1],"dinic") == 0) {
			t1 = high_resolution_clock::now();
			dinic(fg,floVal);
		} else if (strcmp(argv[1],"dinicDtrees") == 0) {
			t1 = high_resolution_clock::now();
			dinicDtrees(fg,floVal);
		} else if (strcmp(argv[1],"ppFifo") == 0) {
			t1 = high_resolution_clock::now();
			ppFifo(fg,floVal,false);
		} else if (strcmp(argv[1],"ppFifoBatch") == 0) {
			t1 = high_resolution_clock::now();
			ppFifo(fg,floVal,true);
		} else {
			Util::fatal("maxFloRep: undefined method");
		}
		t2 = high_resolution_clock::now();
		diff = t2 - t1;
		avgTime += diff.count();
		minTime = min(minTime,diff.count());
		maxTime = max(maxTime,diff.count());
	}
	avgTime /= reps;
	cout << argv[1] << " " << n << " " << m << " " << mss << " " 
	     << ec1 << " " << ec2 << " " << (avgTime/1000) << " "
	     << (minTime/1000) << " " << (maxTime/1000) << endl;
}
