// WORK IN PROGRESS - convert to implement the scaling algorithm
// Coding started, but not yet complete.

// usage: scale
//
// Scale reads a Wflograph from stdin, and computes a minimum cost
// maximum flow between vertices 1 and n using the scaling algorithm
//
// This program is not bullet-proof. Caveat emptor.

#include "stdinc.h"
#include "Wflograph.h"
#include "UiList.h"
#include "Dheap.h"
#include "dinic.h"

void scale(flograph&);
void initLabels(flograph&, int*);
void findpath(flograph&, int*, list&);

main() {
	Wflograph wfg;
	wfg.get(stdin); lcap(wfg); wfg.put(stdout);
}

class scale {
        flograph* wfg;            // graph we're finding flow on
        int*    lab;            // lab[u]=distance label for transformed costs
        int*    excess;         // excess[u]=excess flow entering u
	list*	slist;		// Source vertices
	list*	tlist;		// Sink vertices
	int	Delta;		// Current scaling factor
	vertex	cs;		// current source vertex

        int     findpath(vertex,list&); // find augmenting path
        void    augment(list&); // add flow to augmenting path
        int     newphase();     // prepare for a new phase
        int     initLabels();   // assign initial values to labels
public: scale(flograph*);	// main program
};

scale::scale(flograph& wfg1) {
void scale(flograph& wfg) {
// Find minimum cost maximum flow in wfg using the scaling algorithm.
// Assumes that the original graph has no negative cost cycles.
	int flo;

        vertex u; edge e; 
	flow maxcap;
	list p(wfg.m);

        wfg = &wfg1;
	lab = new int[wfg.n+1]; excess = new int[wfg.n+1];
	slist = new UiList(wfg.n); tlist = new UiList(wfg.n);

	for (u = 1; u <= wfg.n; u++) lab[u] = excess[u] = 0;

	// Initialize scaling factor
	maxcap = 0;
	for (e = 1; e <= wfg.m; e++) 
		maxcap = max(maxcap,wfg.cap(wfg.tail(e),e));
	for (Delta = 1; 2*Delta <= maxcap; Delta <<= 1) {}

	// Determine a max flow so that we can initialize excess
	// values at s and t
	dinic(wfg,flo);
	for (e = wfg->firstAt(1); e != 0; e = wfg->nextAt(1,e)) 
		excess[1] += wfg->f(1,e);
	excess[wfg->n] = -excess[1];
	for (e = wfg->firstAt(1); e != 0; e = wfg->nextAt(1,e)) {
		u = wfg->tail(e); wfg->addflow(u,e,-(wfg->f(u,e)));
	}

	initLabels();

	while (newphase()) {
		while (findpath(u,p))  {
			augment(p);
		}
		Delta /= 2;
	}
	delete [] lab; delete [] excess;
	delete slist; delete tlist;
}

void initLabels() {
// Compute values for labels that give non-negative transformed costs.
// The labels are the least cost path distances from an imaginary
// vertex with a length 0 edge to every vertex in the graph.
// Uses the breadth-first scanning algorithm to compute shortest
// paths.
        int pass;
	vertex v, w,last; edge e;
	vertex *p = new vertex[wfg.n+1];
        UiList q(wfg.n);

        for (v = 1; v <= wfg.n; v++) {
		p[v] = 0; lab[v] = 0; q &= v;
	}

        pass = 0; last = wfg.n;

        while (!empty()) {
		v = q.first(); q.removeFirst();
                for (e = wfg.firstAt(v); e != 0; e = wfg.nextAt(v,e)) {
                        w = wfg.head(e);
			if (w == v) continue;
                        if (lab[w] > lab[v] + wfg.cost(v,e)) {
                                lab[w] = lab[v] + wfg.cost(v,e); p[w] = v;
                                if (!q.member(w)) q.addLast(w);
                        }
                }
                if (v == last && !q.empty()) { pass++; last = q.last(); }
                if (pass == wfg.n) fatal("initLabels: negative cost cycle");
        }
}

void newPhase() {
// Do start of phase processing.

	// identify unbalanced vertices
	slist.clear(); tlist.clear();
	for (u = 2; u < wfg->n; u++) {
		if (excess[u] > 0) slist &= u;
		else if (excess[u] < 0) tlist &= u;
	}
	// Put source and sink at end of lists.
	slist &= 1; tlist &= wfg->n;


	// If any edge violates labeling condition, add Delta units of
	// flow to it. This eliminates it from the residual graph for
	// the current scaling factor.

	vertex u,v; edge e;

	for (e = 1; e <= wfg.m; e++) {
		u = wfg.tail(e); v = wfg.head(e);
		if (wfg.res(u,e) >= Delta) {
			if (wfg.cost(u,e) + lab[u] - lab[v] < 0) {
				wfg.addflow(u,e,Delta);
				excess[u] -= Delta; excess[v] += Delta;
			}
		}
		if (wfg.res(v,e) >= Delta) {
			if (wfg.cost(v,e) + lab[v] - lab[u] < 0) {
				wfg.addflow(v,e,Delta);
				excess[v] -= Delta; excess[u] += Delta;
			}
		}
	}
}


void findpath(flograph& wfg, int Delta, int* lab, list& p) {
// Find a least cost augmenting path and update the labels.
	vertex u,v; edge e;
	edge *pathedge = new edge[wfg.n+1];
	int *c = new int[wfg.n+1];
	Dheap S(wfg.n,2);

	for (u = 1; u <= wfg.n; u++) { pathedge[u] = 0; c[u] = BIGINT; }
	c[1] = 0; S.insert(1,0);
	while (!S.empty()) {
		u = S.deletemin();
		for (e = wfg.first(u); e != 0; e = wfg.next(u,e)) {
			if (wfg.res(u,e) < Delta) continue;
			v = wfg.mate(u,e);
			if (c[v] > c[u] + wfg.cost(u,e) + (lab[u] - lab[v])) {
				pathedge[v] = e;
				c[v] = c[u] +  wfg.cost(u,e) + (lab[u]-lab[v]);
				if (!S.member(v)) S.insert(v,c[v]);
				else S.changekey(v,c[v]);
			}
		}
	}
	p.clear();
	for (u = wfg.n; pathedge[u] != 0; u = wfg.mate(u,pathedge[u])) {
		p.push(pathedge[u]);
	}
	for (u = 1; u <= wfg.n; u++) {
		lab[u] += c[u];
	}
	delete [] pathedge; delete [] c;
	return;
}

void augment(Wflograph& wfg,p) {
// Augment the flow wfg along the path p.
	vertex u; edge e;
	
	f = BIGINT;
	u = 1;
	for (e = p(1); e != 0; e = p.suc(e)) {
		f = min(f,wfg.res(u,e)); u = wfg.mate(u,e);
	}
	u = 1;
	for (e = p(1); e != 0; e = p.suc(e)) {
		wfg.addflow(u,e,f); u = wfg.mate(u,e);
	}
	return;
}

