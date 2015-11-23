/** @file becolorlb_d.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "becolor.h"

namespace grafalgo {

/** Compute the degree lower bound on the bounded chromatic index.
 *  @param g is a reference to a weighted digraph, where edge lengths are
 *  used to represent lower bounds on the edge colors
 *  @param return a lower bound on the required number of colors
 */
int becolorlb_d(Graph_wd& g) {
	// find largest color bound
	int bmax = 1;
	for (edge e = g.first(); e != 0; e = g.next(e))
		bmax = max(bmax,g.length(e));
	int cnt[bmax+1]; int bound = 0;
	for (vertex u = 1; u <= g.n(); u++) {
		// count number of edges at u with each bound
		for (int i = 0; i <= bmax; i++) cnt[i] = 0;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			cnt[g.length(e)]++;
		}
		// use counts to update bound
		int s = 0;
		for (int i = bmax; i >= 1; i--) {
			s += cnt[i];  // # of edges with bounds >=i
			if (s > 0) bound = max(bound,s+i-1);
		}
	}
	return bound;
}

} // ends namespace
