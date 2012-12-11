#include "cycRed.h"

using namespace grafalgo;

// Find minimum cost, maximum flow in wfg using
// the cycle reduction algorithm. 
cycRed::cycRed(Wflograph& wfg1, flow& floVal, cost& floCost) : wfg(&wfg1) {
	vertex u;

	pEdge = new edge[wfg->n()+1];
	mark = new int[wfg->n()+1];

	dinicDtrees x(*wfg,floVal);

	while ((u = findCyc()) != 0) augment(u);

	floCost = 0;
	for (edge e = 1; e <= wfg->m(); e++) {
		vertex u = wfg->tail(e);
		floCost += wfg->f(u,e)*wfg->cost(u,e);
	}
}

void cycRed::augment(vertex z) {
// Add flow to cycle defined by pEdge pointers that includes z.
	vertex u, v; edge e; flow f;

        // determine residual capacity of cycle
        f = Util::BIGINT32;
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

vertex cycRed::findCyc() {
// Find a negative cost cycle in the residual graph.
// If a cycle is found, return some vertex on the cycle,
// else 0. In the case there is a cycle, you can traverse
// the cycle by following pEdge pointers from the returned vertex.

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

vertex cycRed::cycleCheck() {
// If there is a cycle defined by the pEdge pointers, return
// some vertex on the cycle, else null.
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
