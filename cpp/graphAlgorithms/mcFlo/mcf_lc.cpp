/** @file mcf_lc.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "mcf_lc.h"

namespace grafalgo {

/** Find minimum cost, flow in weighted flow graph using the least-cost
 *  augmenting path algorithm.
 *  @param wfg1 is a flow graph; the final flow is returned in its edges'
 *  flow field
 *  @param mostNeg is a flag; if it is true, the algorithm finds a
 *  flow with the largest negative cost (this may not be a max value flow);
 *  otherwise, it finds a min cost, max flow. 
 */
mcf_lc::mcf_lc(Graph_wf& wfg1, bool mostNeg) : wfg(&wfg1) {

	lab = new int[wfg->n()+1];
	pEdge = new edge[wfg->n()+1];

	initLabels();
	while (findpath()) {
		flow nuFlo; floCost pathCost;
		pathRcapCost(nuFlo,pathCost);
		if (mostNeg && pathCost >= 0) break;
		augment(nuFlo);
	}
	delete [] lab; delete [] pEdge;
}


/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in the graph.
 *  Uses the breadth-first scanning algorithm to compute shortest
 *  paths.
 */
void mcf_lc::initLabels() {
        int pass;
	vertex u, v,last; edge e;
        List q(wfg->n());

        for (u = 1; u <= wfg->n(); u++) {
		pEdge[u] = 0; lab[u] = 0; q.addLast(u);
	}
        pass = 0; last = q.last();
        while (!q.empty()) {
		u = q.first(); q.removeFirst();
                for (e = wfg->firstOut(u); e != 0; e = wfg->nextOut(u,e)) {
                        v = wfg->head(e);
                        if (lab[v] > lab[u] + wfg->cost(u,e)) {
                                lab[v] = lab[u] + wfg->cost(u,e); pEdge[v] = e;
                                if (!q.member(v)) q.addLast(v);
                        }
                }
                if (u == last && !q.empty()) { pass++; last = q.last(); }
                if (pass == wfg->n())
			Util::fatal("initLabels: negative cost cycle");
        }
}

/** Find a least cost augmenting path.
 *  @param return true if a path was found, else false.
 */
bool mcf_lc::findpath() {
	vertex u,v; edge e;
	int c[wfg->n()+1]; Heap_d<int> S(wfg->n(),4);

	for (u = 1; u <= wfg->n(); u++) { pEdge[u] = 0; c[u] = INT_MAX; }
	c[wfg->src()] = 0; S.insert(wfg->src(),0);
	while (!S.empty()) {
		u = S.deletemin();
		for (e = wfg->firstAt(u); e != 0; e = wfg->nextAt(u,e)) {
			if (wfg->res(u,e) == 0) continue;
			v = wfg->mate(u,e);
			if (c[v] > c[u] + wfg->cost(u,e) + (lab[u] - lab[v])) {
				pEdge[v] = e;
				c[v] = c[u] + wfg->cost(u,e) + (lab[u]-lab[v]);
				if (!S.member(v)) S.insert(v,c[v]);
				else S.changekey(v,c[v]);
			}
		}
	}
	// update labels for next round
	for (u = 1; u <= wfg->n(); u++) lab[u] += c[u];
	return (pEdge[wfg->snk()] != 0 ? true : false);
}

/** Determine residual capacity and cost of augmenting path defined by pEdge.
 *  @param rcap is an output parameter used to return the capacity of the
 *  augmenting path defined by pEdge.
 *  @param pc is an output parameter used to return the cost of the path
 */
void mcf_lc::pathRcapCost(flow& rcap, floCost& pc) {
        vertex u, v; edge e;

	rcap = INT_MAX; pc = 0;
        u = wfg->snk(); e = pEdge[u];
        while (u != wfg->src()) {
                v = wfg->mate(u,e);
                rcap = min(rcap,wfg->res(v,e)); pc += wfg->cost(v,e);
                u = v; e = pEdge[u];
        }
}

/** Add flow to the path defined by pEdge.
 *  @param f is the amount of flow to add to the path
 */
void mcf_lc::augment(flow& f) {
        vertex u, v; edge e;

        u = wfg->snk(); e = pEdge[u];
        while (u != wfg->src()) {
                v = wfg->mate(u,e);
                wfg->addFlow(v,e,f);
                u = v; e = pEdge[u];
        }
}

} // ends namespace
