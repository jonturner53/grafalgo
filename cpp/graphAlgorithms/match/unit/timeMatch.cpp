/** @file testMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include <chrono>
#include "stdinc.h"
#include "Rgraph.h"
#include "Glist.h"
#include "Wgraph.h"
#include "hopcroftKarp.h"
#include "hungarian.h"
#include "edmondsGabow.h"
#include "fastEdmondsGabow.h"
#include "edmondsGMGbi.h"
#include "maxdMatch.h"
#include "fastMaxdMatch.h"

namespace grafalgo {
extern void flowMatch(Graph&, Glist<edge>&);
extern void flowMatchWt(Wgraph&, Glist<edge>&);
}

using namespace chrono;
using namespace grafalgo;

/** usage: timeMatch method reps n m|d [ lo hi ]
 * 
 *  TimeMatch repeated generates a random graph and computes a matching
 *  using the specified method.
 * 
 *  Methods currently implemented include flowMatch (bipartite/unweighted),
 *  flowMatchWt (bipartite/weighted), hopcroftKarp (bipartite/unweighted),
 *  hungarian (bipartite/weighted), edmondsGabow (general/unweighted),
 *  fastEdmondsGabow (general/unweighted), edmondsGMGbi (bipartite/weighted),
 *  maxdMatch (bipartite/unweighted), fastMaxdMatch (bipartite/unweighted)
 *
 *  Reps is the number of repetitions
 *  N is the number of vertices
 *  For unweighted matchings, d is the vertex degree of a regular graph.
 *  For weighted matchings, m is the number of edges and [lo,hi] is the
 *  range of edge weights.
 *
 *  The output is a single line containing
 *
 *  method n m|d [lo hi] avg min max
 *
 *  where avg is the average time to compute the matching, min is the
 *  minimum time, max is the maximum time
 */
int main(int argc, char *argv[]) {
	int reps, n, md, lo, hi;

	if ((argc != 5 && argc != 7) ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&md) != 1) {
		Util::fatal("usage: timeMatch method reps n m|d [ lo hi ]");
		exit(1); // redundant exit to shutup compiler
	}
	if (argc == 7 &&
	    (sscanf(argv[5],"%d",&lo) != 1 ||
	     sscanf(argv[6],"%d",&hi) != 1)) {
		Util::fatal("usage: timeMatch method reps n m|d [ lo hi ]");
		exit(1); // redundant exit to shutup compiler
	}

	Graph g(n,md); Wgraph wg(n,md); Glist<edge> match(n/2);
	high_resolution_clock::time_point t1, t2;
	nanoseconds diff;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	for (int i = 1; i <= reps; i++) {
		if (strcmp(argv[1],"flowMatch") == 0) {
			Rgraph::bigraph(g,n,n,md);
			t1 = high_resolution_clock::now();
			flowMatch(g,match);
		} else if (strcmp(argv[1],"hopcroftKarp") == 0) {
			Rgraph::bigraph(g,n,n,md);
			t1 = high_resolution_clock::now();
			hopcroftKarp(g,match);
		} else if (strcmp(argv[1],"flowMatchWt") == 0) {
			Rgraph::bigraph(wg,n,n,md);
			Rgraph::setWeights(wg,lo,hi);
			t1 = high_resolution_clock::now();
			flowMatchWt(wg,match);
		} else if (strcmp(argv[1],"hungarian") == 0) {
			Rgraph::bigraph(wg,n,n,md);
			Rgraph::setWeights(wg,lo,hi);
			t1 = high_resolution_clock::now();
			hungarian(wg,match);
		} else if (strcmp(argv[1],"edmondsGabow") == 0) {
			Rgraph::ugraph(g,n,md);
			t1 = high_resolution_clock::now();
			edmondsGabow(g,match);
		} else if (strcmp(argv[1],"fastEdmondsGabow") == 0) {
			Rgraph::ugraph(g,n,md);
			t1 = high_resolution_clock::now();
			fastEdmondsGabow(g,match);
		} else if (strcmp(argv[1],"edmondsGMGbi") == 0) {
			Rgraph::bigraph(wg,n,n,md);
			Rgraph::setWeights(wg,lo,hi);
			t1 = high_resolution_clock::now();
			edmondsGMGbi(wg,match);
		} else if (strcmp(argv[1],"maxdMatch") == 0) {
			Rgraph::regularBigraph(wg,n,md);
			t1 = high_resolution_clock::now();
			maxdMatch(g,match);
		} else if (strcmp(argv[1],"fastMaxdMatch") == 0) {
			Rgraph::regularBigraph(wg,n,md);
			t1 = high_resolution_clock::now();
			fastMaxdMatch(g,match);
		} else { 
			Util::fatal("match: invalid method");
		}
		t2 = high_resolution_clock::now();
		diff = t2 - t1;
		avgTime += diff.count();
		minTime = min(minTime,diff.count());
		maxTime = max(maxTime,diff.count());
		match.clear();
	}
	avgTime /= reps;
	cout << argv[1] << " " << n << " " << md << " ";
	if (argc == 7) 
		cout << lo << " " << hi << " ";
	cout << (avgTime/1000) << " " << (minTime/1000) << " "
	     << (maxTime/1000) << endl;
}
