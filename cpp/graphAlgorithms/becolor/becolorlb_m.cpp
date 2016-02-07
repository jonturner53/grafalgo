/** @file becolorlb_m.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "becolor.h"
#include "List_g.h"
#include "matchb_hk.h"

namespace grafalgo {

/** Compute the matching lower bound on the bounded chromatic index.
 *  @param g is a reference to a weighted digraph, where edge lengths are
 *  used to represent lower bounds on the edge colors
 */
int becolorlb_m(Graph_wd& g) {
	Graph gc(g.n(),g.M());
	edge mEdge[g.n()+1]; for (vertex u = 1; u <= g.n(); u++) mEdge[u] = 0;
	int total = 0; int c;
	for (c = 1; total < g.m(); c++) {
		// construct G_c (by adding edges to previous G_c)
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			if (g.length(e) == c)
				gc.joinWith(g.left(e), g.right(e), e);
		}
		// find max matching in gc and add its size to total
		matchb_hk(gc, mEdge);
		int siz = 0;
		for (vertex u = 1; u <= g.n(); u++) {
			if (mEdge[u] != 0) siz++; mEdge[u] = 0;
		}
		total += siz/2;
	}
	return c-1;
}

} // ends namespace
