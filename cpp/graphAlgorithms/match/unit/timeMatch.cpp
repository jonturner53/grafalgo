/** @file time.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include <chrono>
#include "stdinc.h"
#include "Rgraph.h"
#include "List_g.h"
#include "Graph_w.h"
#include "matchb_hk.h"
#include "matchwb_h.h"
#include "match_eg.h"
#include "match_egf.h"
#include "matchwb_egmg.h"
#include "mdmatch.h"
#include "mdmatch_f.h"
#include "pmatchb_hkt.h"
#include "pmatch_egt.h"

namespace grafalgo {
extern void matchb_f(const Graph&, edge*);
extern void matchwb_f(const Graph_w&, edge*);
}

using namespace chrono;
using namespace grafalgo;

/** usage: timeMatch method reps n m|d [ k | lo hi ]
 * 
 *  TimeMatch repeated generates a random graph and computes a matching
 *  using the specified method.
 * 
 *  Methods currently implemented include matchb_f (bipartite/unweighted),
 *  matchwb_f (bipartite/weighted), matchb_hk (bipartite/unweighted),
 *  matchwb_h (bipartite/weighted), match_eg (general/unweighted),
 *  match_egf (general/unweighted), matchb_egmg (bipartite/weighted),
 *  mdmatch (bipartite/unweighted), mdmatch_f (bipartite/unweighted)
 *  pmatchb_hkt (bipartite/unweighted), pmatch_egt (general/unweighted)
 *
 *  Reps is the number of repetitions
 *  N is the number of vertices
 *  For unweighted matchings, d is the vertex degree of a regular graph.
 *  For weighted matchings, m is the number of edges and [lo,hi] is the
 *  range of edge weights.
 *  For priority matchings, k is the number of distinct priority classes
 *
 *  The output is a single line containing
 *
 *  method n m|d [k | lo hi] avg min max
 *
 *  where avg is the average time to compute the matching, min is the
 *  minimum time, max is the maximum time
 */
int main(int argc, char *argv[]) {
	int reps, n, md, k, lo, hi;

	if ((argc < 5 && argc > 7) ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&md) != 1) {
		Util::fatal("usage: timeMatch method reps n m|d [ k | lo hi ]");
		exit(1); // redundant exit to shutup compiler
	}
	if (argc == 6 &&
	    (sscanf(argv[5],"%d",&k) != 1)) {
		Util::fatal("usage: timeMatch method reps n m|d [ k | lo hi ]");
		exit(1); // redundant exit to shutup compiler
	}
	if (argc == 7 &&
	    (sscanf(argv[5],"%d",&lo) != 1 ||
	     sscanf(argv[6],"%d",&hi) != 1)) {
		Util::fatal("usage: timeMatch method reps n m|d [ k | lo hi ]");
		exit(1); // redundant exit to shutup compiler
	}

	Graph g(n,md); Graph_w wg(n,md); 
	edge mEdge[2*n+1];
	high_resolution_clock::time_point t1, t2;
	nanoseconds diff;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	for (int i = 1; i <= reps; i++) {
		for (vertex u = 1; u <= 2*n; u++) mEdge[u] = 0;
		if (strcmp(argv[1],"matchb_f") == 0) {
			Rgraph::bigraph(g,n,n,md);
			t1 = high_resolution_clock::now();
			matchb_f(g,mEdge);
		} else if (strcmp(argv[1],"matchb_hk") == 0) {
			Rgraph::bigraph(g,n,n,md);
			t1 = high_resolution_clock::now();
			matchb_hk(g,mEdge);
		} else if (strcmp(argv[1],"matchwb_f") == 0) {
			Rgraph::bigraph(wg,n,n,md);
			Rgraph::setWeights(wg,lo,hi);
			t1 = high_resolution_clock::now();
			matchwb_f(wg,mEdge);
		} else if (strcmp(argv[1],"matchwb_h") == 0) {
			Rgraph::bigraph(wg,n,n,md);
			Rgraph::setWeights(wg,lo,hi);
			t1 = high_resolution_clock::now();
			matchwb_h(wg,mEdge);
		} else if (strcmp(argv[1],"match_eg") == 0) {
			Rgraph::ugraph(g,n,md);
			t1 = high_resolution_clock::now();
			match_eg(g,mEdge);
		} else if (strcmp(argv[1],"match_egf") == 0) {
			Rgraph::ugraph(g,n,md);
			t1 = high_resolution_clock::now();
			match_egf(g,mEdge);
		} else if (strcmp(argv[1],"matchwb_egmg") == 0) {
			Rgraph::bigraph(wg,n,n,md);
			Rgraph::setWeights(wg,lo,hi);
			t1 = high_resolution_clock::now();
			matchwb_egmg(wg,mEdge);
		} else if (strcmp(argv[1],"mdmatch") == 0) {
			Rgraph::regularBigraph(wg,n,md);
			t1 = high_resolution_clock::now();
			mdmatch(g,mEdge);
		} else if (strcmp(argv[1],"mdmatch_f") == 0) {
			Rgraph::regularBigraph(wg,n,md);
			t1 = high_resolution_clock::now();
			mdmatch_f(g,mEdge);
		} else if (strcmp(argv[1],"pmatchb_hkt") == 0) {
			Rgraph::bigraph(g,n,n,md);
			int priority[g.n()+1];
			for (vertex u = 1; u <= g.n(); u++)
				priority[u] = Util::randint(1,min(k,g.n()));
			t1 = high_resolution_clock::now();
			pmatchb_hkt(g, priority,mEdge);
		} else if (strcmp(argv[1],"pmatchb_egt") == 0) {
			Rgraph::bigraph(g,n,n,md);
			int priority[g.n()+1];
			for (vertex u = 1; u <= g.n(); u++)
				priority[u] = Util::randint(1,min(k,g.n()));
			t1 = high_resolution_clock::now();
			pmatch_egt(g, priority,mEdge);
		} else if (strcmp(argv[1],"pmatch_egt") == 0) {
			Rgraph::ugraph(g,n,md);
			int priority[g.n()+1];
			for (vertex u = 1; u <= g.n(); u++)
				priority[u] = Util::randint(1,min(k,g.n()));
			t1 = high_resolution_clock::now();
			pmatch_egt(g, priority,mEdge);
		} else { 
			Util::fatal("match: invalid method");
		}
		t2 = high_resolution_clock::now();
		diff = t2 - t1;
		avgTime += diff.count();
		minTime = min(minTime,diff.count());
		maxTime = max(maxTime,diff.count());
	}
	avgTime /= reps;
	cout << argv[1] << " " << n << " " << md << " ";
	if (argc == 6) 
		cout << k << " ";
	if (argc == 7) 
		cout << lo << " " << hi << " ";
	cout << (avgTime/1000) << " " << (minTime/1000) << " "
	     << (maxTime/1000) << endl;
}
