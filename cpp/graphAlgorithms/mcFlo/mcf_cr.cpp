/** @file mcf_cr.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "mcf_cr.h"
#include "mflo_d.h"

namespace grafalgo {

/** Find minimum cost, maximum flow in a weighted flow graph using
 *  the cycle reduction algorithm. 
 *  @param wfg1 is the flow graph
 */
mcf_cr::mcf_cr(Graph_wf& wfg1): wfg(&wfg1) {
	pEdge = new edge[wfg->n()+1];
	mark = new int[wfg->n()+1];

	(mflo_d(*wfg)); // parens added to resolve ambiguity

	vertex u;
	while ((u = findCyc()) != 0) augment(u);
}

/** Add flow to a negative-cost cycle.
 *  Adds as much flow as possible to the cycle, reducing the cost
 *  without changing the flow value.
 *  @param z is a vertex on a cycle defined by the pEdge array
 */
void mcf_cr::augment(vertex z) {
	vertex u, v; edge e; flow f;

        // determine residual capacity of cycle
        f = INT_MAX;
        u = z; e = pEdge[u];
        do {
                v = wfg->mate(u,e);
                f = min(f,wfg->res(v,e));
                u = v; e = pEdge[u];
        } while (u != z);

        // add flow to saturate cycle
        u = z; e = pEdge[u];
        do {
                v = wfg->mate(u,e);
                wfg->addFlow(v,e,f);
                u = v; e = pEdge[u];
        } while (u != z);
}

/** Find a negative cost cycle in the residual graph.
 *  @return some vertex on the cycle, or 0 if no negative
 *  cycle is present in the residual graph; The edges in the
 *  cycle are found by traversing the pEdge pointers, starting
 *  at pEdge[returnedVertex].
 */
vertex mcf_cr::findCyc() {

	vertex u,v,last; edge e;
	int c[wfg->n()+1];
	List q(wfg->n());

	for (u = 1; u <= wfg->n(); u++) { 
		pEdge[u] = 0; c[u] = 0; q.addLast(u);
	}

	last = q.last(); // each pass completes when last removed from q
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = wfg->firstAt(u); e != 0; e = wfg->nextAt(u,e)) {
			if (wfg->res(u,e) == 0) continue;
			v = wfg->mate(u,e);
			if (c[v] > c[u] + wfg->cost(u,e)) {
				pEdge[v] = e;
				c[v] = c[u] +  wfg->cost(u,e);
				if (!q.member(v)) q.addLast(v);
			}
		}

		if (u == last) {
			v = cycleCheck();
			if (v != 0) return v;
			last = q.last();
		}
	}
	return 0;
}

/** Check for a cycle in the pEdge pointers.
 *  @return true if the pEdge pointers define a cycle, else false
 */
vertex mcf_cr::cycleCheck() {
	vertex u,v; edge e; int cm;

	for (u = 1; u <= wfg->n(); u++) { mark[u] = 0; }
	u = 1; cm = 1;
	while(u <= wfg->n()) {
		// follow parent pointers from u, marking new vertices
		// seen with the value of cm, so we can recognize a loop
		v = u; 
		while (mark[v] == 0) {
			mark[v] = cm;
			e = pEdge[v];
			if (e == 0) break;
			v = wfg->mate(v,e);
		}
		if (mark[v] == cm && e != 0) return v;
		
		// find next unmarked vertex 
		while (u <= wfg->n() && mark[u] != 0) u++;
		cm++;
	}
	return 0;
}

} // ends namespace
