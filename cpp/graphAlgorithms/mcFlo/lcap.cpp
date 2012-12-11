#include "lcap.h"

using namespace grafalgo;

lcap::lcap(Wflograph& wfg1, flow& flowVal, floCost& flowCost, bool mostNeg) : wfg(&wfg1) {
// Find minimum cost, flow in wfg using the least-cost augmenting path
// algorithm.  If the mostNeg flag is true, the algorithm finds a
// flow with the largest negative cost. Otherwise, it finds a min
// cost, max flow.  Returns flow value in floVal and cost in floCost.

	lab = new int[wfg->n()+1];
	pEdge = new edge[wfg->n()+1];

	initLabels();
	flowVal = flowCost = 0;
	while (findpath()) {
		flow nuFlo; floCost pathCost;
		pathRcapCost(nuFlo,pathCost);
		if (mostNeg && pathCost >= 0) break;
		augment(nuFlo);
		flowVal += nuFlo; flowCost += nuFlo*pathCost;
	}
	delete [] lab; delete [] pEdge;
}


void lcap::initLabels() {
// Compute values for labels that give non-negative transformed costs.
// The labels are the least cost path distances from an imaginary
// vertex with a length 0 edge to every vertex in the graph.
// Uses the breadth-first scanning algorithm to compute shortest
// paths.
        int pass;
	vertex u, v,last; edge e;
        List q(wfg->n());

        for (u = 1; u <= wfg->n(); u++) {
		pEdge[u] = 0; lab[u] = 0; q.addLast(u);
	}
        pass = 0; last = q.last();
        while (!q.empty()) {
		u = q.first(); q.removeFirst();
                for (e = wfg->firstAt(u); e != 0; e = wfg->nextAt(u,e)) {
                        v = wfg->head(e);
			if (v == u) continue;
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

bool lcap::findpath() {
// Find a least cost augmenting path.
	vertex u,v; edge e;
	int c[wfg->n()+1]; Dheap S(wfg->n(),4);

	for (u = 1; u <= wfg->n(); u++) { pEdge[u] = 0; c[u] = Util::BIGINT32; }
	c[wfg->src()] = 0; S.insert(wfg->src(),0);
	while (!S.empty()) {
		u = S.deletemin();
		for (e = wfg->firstAt(u); e != 0; e = wfg->nextAt(u,e)) {
			if (wfg->res(u,e) == 0) continue;
			v = wfg->mate(u,e);
			if (c[v] > c[u] + wfg->cost(u,e) + (lab[u] - lab[v])) {
				pEdge[v] = e;
				c[v] = c[u] +  wfg->cost(u,e) + (lab[u] - lab[v]);
				if (!S.member(v)) S.insert(v,c[v]);
				else S.changekey(v,c[v]);
			}
		}
	}
	// update labels for next round
	for (u = 1; u <= wfg->n(); u++) lab[u] += c[u];
	return (pEdge[wfg->snk()] != 0 ? true : false);
}

void lcap::pathRcapCost(flow& rcap, floCost& pc) {
// Return the residual capacity and cost of the path defined by pEdge
// in rcap and pc.
        vertex u, v; edge e;

	rcap = Util::BIGINT32; pc = 0;
        u = wfg->snk(); e = pEdge[u];
        while (u != wfg->src()) {
                v = wfg->mate(u,e);
                rcap = min(rcap,wfg->res(v,e)); pc += wfg->cost(v,e);
                u = v; e = pEdge[u];
        }
}

void lcap::augment(flow& f) {
// Add f units of flow to the path defined by pEdge.
        vertex u, v; edge e;

        u = wfg->snk(); e = pEdge[u];
        while (u != wfg->src()) {
                v = wfg->mate(u,e);
                wfg->addFlow(v,e,f);
                u = v; e = pEdge[u];
        }
}
