/** @file evalBecolor.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include <chrono>
#include "stdinc.h"
#include "Rgraph.h"
#include "becolor_g.h"
#include "becolor_ap.h"

namespace grafalgo {
extern int becolorlb_d(Graph_wd&);
extern int becolorlb_m(Graph_wd&);
extern int becolorlb_f(Graph_wd&);
extern void becolor_ss(Graph_wd&, int*);
extern void becolor_rm(Graph_wd&, int*);
extern void becolor_mdm(Graph_wd&, int*);
}

using namespace chrono;
using namespace grafalgo;

/** usage: evalBecolor reps n d colorBound method
 * 
 *  EvalBecolor repeated generates a random graph and computes a
 *  bounded edge coloring using the specified method.
 * 
 *  Methods currently implemented include strictSplit, greedy, repMatch,
 *  maxDegMatch and augPath
 *
 *  Reps is the number of repetitions, n is the number of inputs (and outputs)
 *  d is the vertex detree, colorBound is an upper bound on the number
 *  of colors required.
 *
 *  The output is a single line containing
 *
 *  n d colorBound avgc minc maxc avgx minx maxx avgt mint maxt method
 *
 *  where avgc is the average number of colors used, minc is the
 *  minimum number, maxc is the maximum number; avgx is the average
 *  number of colors in excess of the lower bound, minx is min number,
 *  maxx is max number; avgt is the average time to compute the coloring,
 *  mint is the minimum time, maxt the maximum time
 */
int main(int argc, char *argv[]) {
	int reps, n, d, colorBound; char *method;

	if (argc != 6 ||
	    sscanf(argv[1],"%d",&reps) != 1 ||
	    sscanf(argv[2],"%d",&n) != 1 ||
	    sscanf(argv[3],"%d",&d) != 1 ||
	    sscanf(argv[4],"%d",&colorBound) != 1) {
		Util::fatal("usage: evalBecolor reps n d colorBound method");
		exit(1); // redundant exit to shutup compiler
	}
	method = argv[5];

	Graph_wd g(2*n,n*d); int color[n*d+1];
	high_resolution_clock::time_point t1, t2;
	nanoseconds diff;
	int totc = 0, minc = 2*d, maxc = 0;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	int totx = 0; int minx = d; int maxx = 0;
	for (int i = 1; i <= reps; i++) {
		Rgraph::becolor(g,n,n,d,colorBound,.25);
		if (strcmp(method,"strictSplit") == 0) {
			t1 = high_resolution_clock::now();
			becolor_ss(g,color);
		} else if (strcmp(method,"greedy") == 0) {
			t1 = high_resolution_clock::now();
			becolor_g(g,color);
		} else if (strcmp(method,"repMatch") == 0) {
			t1 = high_resolution_clock::now();
			becolor_rm(g,color);
		} else if (strcmp(method,"maxDegMatch") == 0) {
			t1 = high_resolution_clock::now();
			becolor_mdm(g,color);
		} else if (strcmp(method,"augPath") == 0) {
			t1 = high_resolution_clock::now();
			becolor_ap(g,color);
		} else { 
			Util::fatal("match: invalid method");
		}
		t2 = high_resolution_clock::now();
		diff = t2 - t1;
		avgTime += diff.count();
		minTime = min(minTime,diff.count());
		maxTime = max(maxTime,diff.count());
		int c = 0;
		for (edge e = g.first(); e != 0; e = g.next(e))
			c = max(c,color[e]);
		totc += c; minc = min(c,minc); maxc = max(c,maxc);
		int lb = max(becolorlb_d(g),max(becolorlb_m(g),becolorlb_f(g)));
		int x = c - lb; // difference between c and lower bound
		totx += x; minx = min(x,minx); maxx = max(x,maxx);
	}
	avgTime /= reps;
	double avgc = ((double) totc)/reps; double avgx = ((double) totx)/reps;
	cout << n << " " << d << " " << colorBound << " "
	     << avgc << " " << minc << " " << maxc << " "
	     << avgx << " " << minx << " " << maxx << " "
	     << (avgTime/1000) << " " << (minTime/1000) << " " << (maxTime/1000)
	     << " " << method << endl;
}
