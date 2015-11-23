/** @file mcf_s.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Graph_wf.h"
#include "List_d.h"
#include "Heap_d.h"
#include "mflo_d.h"
#include "mcf_s.h"

namespace grafalgo {

/** Find minimum cost maximum flow in a weighted flow graph using the
 *  scaling algorithm.
 *  Assumes that the original graph has no negative cost cycles.
 */
mcf_s::mcf_s(Graph_wf& wfg1) : wfg(&wfg1) {
	lab = new int[wfg->n()+1]; excess = new int[wfg->n()+1];
	pEdge = new edge[wfg->n()+1];
	slist = new List_d(wfg->n()); tlist = new List_d(wfg->n());

	for (vertex u = 1; u <= wfg->n(); u++) 
		lab[u] = excess[u] = pEdge[u] = 0;

	// Initialize scaling factor
	flow maxcap = 0;
	for (edge e = wfg->first(); e != 0; e = wfg->next(e)) {
		maxcap = max(maxcap,wfg->cap(wfg->tail(e),e));
		wfg->setFlow(e,0);
	}
	for (Delta = 1; 2*Delta <= maxcap; Delta <<= 1) {}

	// Determine a max flow so that we can initialize excess
	// values at s and t
	(mflo_d(*wfg));	// parens added to resolve ambiguity
	excess[wfg->src()] = wfg->totalFlow();
	excess[wfg->snk()] = -wfg->totalFlow();

	// reset flow to 0
	for (edge e = wfg->first(); e != 0; e = wfg->next(e)) {
		wfg->setFlow(e,0);
	}
	initLabels();
	while (Delta > 0) {
		newPhase();
		vertex t;
		while ((t = findpath()) != 0) augment(t);
		Delta /= 2;
	}
	delete [] lab; delete [] excess; delete[] pEdge;
	delete slist; delete tlist;
}

/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in the graph.
 *  Uses the breadth-first scanning algorithm to compute shortest
 *  paths.
 */
void mcf_s::initLabels() {
        int pass; vertex last;
	vertex *p = new vertex[wfg->n()+1];
        List q(wfg->n());

        for (vertex v = 1; v <= wfg->n(); v++) {
		p[v] = 0; lab[v] = 0; q.addLast(v);
	}

        pass = 0; last = wfg->n();

        while (!q.empty()) {
		vertex v = q.first(); q.removeFirst();
                for (edge e = wfg->firstOut(v); e != 0; e = wfg->nextOut(v,e)) {
                        vertex w = wfg->mate(v,e);
                        if (lab[w] > lab[v] + wfg->cost(v,e)) {
                                lab[w] = lab[v] + wfg->cost(v,e); p[w] = v;
                                if (!q.member(w)) q.addLast(w);
                        }
                }
                if (v == last && !q.empty()) { pass++; last = q.last(); }
                if (pass == wfg->n())
			Util::fatal("initLabels: negative cost cycle");
        }
}

/** Do start of phase processing.
 */
void mcf_s::newPhase() {
	// If any edge violates labeling condition, add Delta units of
	// flow to it. This eliminates it from the residual graph for
	// the current scaling factor.
	for (edge e = wfg->first(); e != 0; e = wfg->next(e)) {
		vertex u = wfg->tail(e); vertex v = wfg->head(e);
		if (wfg->res(u,e) >= Delta) {
			if (wfg->cost(u,e) + (lab[u] - lab[v]) < 0) {
				wfg->addFlow(u,e,Delta);
				excess[u] -= Delta; excess[v] += Delta;
			}
		}
		if (wfg->res(v,e) >= Delta) {
			if (wfg->cost(v,e) + (lab[v] - lab[u]) < 0) {
				wfg->addFlow(v,e,Delta);
				excess[v] -= Delta; excess[u] += Delta;
			}
		}
	}

	// identify candidate sources and sinks
	slist->clear(); tlist->clear();
	for (vertex u = 1; u <= wfg->n(); u++) {
		if (excess[u] >= Delta) {
			slist->addLast(u);
		} else if (excess[u] <= -Delta) {
			tlist->addLast(u);
		}
	}
	return;
}


/** Find a least cost augmenting path from some source and update the labels.
 *  @return the "sink" vertex for the computed path; on return, the pEdge
 *  vector defines the path from the sink back to some source
 */
vertex mcf_s::findpath() {
	int *dist = new int[wfg->n()+1];
	Heap_d<floCost> border(wfg->n(),2);

	for (vertex u = 1; u <= wfg->n(); u++) {
		pEdge[u] = 0; dist[u] = INT_MAX;
	}
	// search from all sources in parallel
	for (vertex s = slist->first(); s != 0; s = slist->next(s)) {
		dist[s] = 0; border.insert(s,0);
	}
	int dmax = 0; vertex t = 0;
	while (!border.empty()) {
		vertex u = border.deletemin(); dmax = max(dmax,dist[u]);
		if (t == 0 && tlist->member(u)) t = u;
		for (edge e = wfg->firstAt(u); e != 0; e = wfg->nextAt(u,e)) {
			if (wfg->res(u,e) < Delta) continue;
			vertex v = wfg->mate(u,e);
			if (dist[v] > dist[u]+wfg->cost(u,e)+(lab[u]-lab[v])) {
				pEdge[v] = e;
				dist[v] = dist[u] +
					  wfg->cost(u,e) + (lab[u]-lab[v]);
				if (!border.member(v)) border.insert(v,dist[v]);
				else border.changekey(v,dist[v]);
			}
		}
	}
	if (t != 0) { // adjust labels
		for (vertex u = 1; u <= wfg->n(); u++)
			lab[u] += min(dist[u],dmax);
	}
	delete [] dist;
	return t;
}

/** Augment the flow along a path
 *  @param t is the sink vertex for the path; the path is defined
 *  by the pEdge array
 */
void mcf_s::augment(vertex t) {
	vertex s = t; flow f = -excess[t];
	for (edge e = pEdge[s]; e != 0; e = pEdge[s]) {
		vertex v = wfg->mate(s,e);
		f = min(f,wfg->res(v,e));
		s = v;
	}
	f = min(f,excess[s]);
	s = t; 
	for (edge e = pEdge[s]; e != 0; e = pEdge[s]) {
		vertex v = wfg->mate(s,e);
		wfg->addFlow(v,e,f);
		s = v;
	}
	excess[s] -= f; excess[t] += f;
	if (excess[s] < Delta) slist->remove(s);
	if (excess[t] > -Delta) tlist->remove(t);
	return;
}

} // ends namespace
