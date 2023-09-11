/** @file evalGcolor.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include <chrono>
#include "stdinc.h"
#include "Graph_g.h"
#include "Rgraph.h"
#include "egcolor_bl.h"
#include "egcolor_tl.h"
#include "egcolor_mc.h"
#include "egcolor_r.h"
#include "egcolor_fc.h"
#include "egcolor_rm.h"
#include "egcolor_gm.h"
#include "egcolor_menu.h"

using namespace chrono;
using namespace grafalgo;

/** usage: evalGcolor reps n1 n2 g1 d2 colorBound method
 * 
 *  EvalGolor repeated generates a random graph and computes an edge coloring
 *  using the specified method.
 * 
 *  Methods currently implemented include basicLayers, thinLayers, minColor,
 *  recolor, fewColors
 *
 *  Reps is the number of repetitions, n1 is the number of inputs
 *  n2 is the number of outputs, g1 is the input group count, d2 is the
 *  output degree, colorBound is an upper bound on the number
 *  of colors required.
 *
 *  The output is a single line containing
 *
 *  n1 n2 g1 d2 colorBound avgc minc maxc avgt mint maxt method
 *
 *  where avgc is the average number of colors used, minc is the
 *  minimum number, maxc is the maximum number; avgt is the average time
 *  to compute the coloring, mint is the minimum time, maxt the maximum time
 */
int main(int argc, char *argv[]) {
	int reps, n1, n2, d2, g1, colorBound; char *method;

	if (argc != 8 ||
	    sscanf(argv[1],"%d",&reps) != 1 ||
	    sscanf(argv[2],"%d",&n1) != 1 ||
	    sscanf(argv[3],"%d",&n2) != 1 ||
	    sscanf(argv[4],"%d",&g1) != 1 ||
	    sscanf(argv[5],"%d",&d2) != 1 ||
	    sscanf(argv[6],"%d",&colorBound) != 1) {
		Util::fatal("usage: evalGcolor reps n1 n2 d1 g1 colorBound "
			    "method");
		exit(1); // redundant exit to shutup compiler
	}
	method = argv[7];

	Graph_g g(n1+n2,n2*d2); int color[n2*d2+1];
	high_resolution_clock::time_point t1, t2;
	nanoseconds diff;
	int avgc = 0, minc = n2*d2, maxc = 0;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	for (int i = 1; i <= reps; i++) {
		Rgraph::groupGraph(g,n1,n2,g1,d2,colorBound);
		if (strcmp(method,"basicLayers") == 0) {
			t1 = high_resolution_clock::now();
			egcolor_bl(g,color);
		} else if (strcmp(method,"thinLayers") == 0) {
			t1 = high_resolution_clock::now();
			egcolor_tl(g,color);
		} else if (strcmp(method,"minColor") == 0) {
			t1 = high_resolution_clock::now();
			egcolor_mc(g,color);
		} else if (strcmp(method,"recolor") == 0) {
			t1 = high_resolution_clock::now();
			egcolor_r(g,color);
		} else if (strcmp(method,"fewColors") == 0) {
			t1 = high_resolution_clock::now();
			egcolor_fc(g,color);
		} else if (strcmp(method,"rmenu") == 0) {
			t1 = high_resolution_clock::now();
			egcolor_rm(g,color);
		} else if (strcmp(method,"gmenu") == 0) {
			t1 = high_resolution_clock::now();
			egcolor_gm(g,color);
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
		avgc += c; minc = min(c,minc); maxc = max(c,maxc);
	}
	avgTime /= reps; avgc /= reps;
	cout << n1 << " " << n2 << " " << g1 << " " << d2 << " " << colorBound
	     << " " << avgc << " " << minc << " " << maxc << " "
	     << (avgTime/1000) << " " << (minTime/1000) << " " << (maxTime/1000)
	     << " " << method << endl;
}
