// flowMatch(graf,match) - max matching on bipartite graphs
//
// This file contains two versions of flowMatch(graf,match), the algorithm for
// computing a maximum matching in a bipartite graph using max flows.
// If the first argument is an unweighted graph, a maximum size
// matching is returned in match. If the first argument is a weighted
// graph, a maximum weight matching is returned.
//
// Think about rewriting this as a class.

#include "stdinc.h"
#include "Wgraph.h"
#include "UiList.h"
#include "UiDlist.h"
#include "Wflograph.h"
#include "Dheap.h"
#include "dinic.h"
#include "lcap.h"

bool findCut(const Graph&, UiList&);
void makFlograph(const Graph&, const UiList&, Flograph&);

void flowMatch(Graph& graf, UiDlist& match, int& size)  {
// Find a maximum size matching in the bipartite graph graf and
// return it as a list of edges.
	vertex u,v; edge e;

	Flograph fg(graf.n()+2,graf.n()+graf.m(),graf.n()+1,graf.n()+2);
	UiList cut(graf.n());

	if (!findCut(graf,cut)) fatal("flowMatch: graph is not bipartite");
	makFlograph(graf,cut,fg);

	flow floVal;
	dinic(fg,floVal);
	size = floVal;

	for (e = 1; e <= graf.m(); e++) {
		if (fg.f(graf.left(e),e) != 0) match.addLast(e);
	}
}

// Find a maximum weight matching in the bipartite graph graf and
// return it as a list of edges.
void flowMatch(Wgraph& graf, UiDlist& match, int& size, int& weight) {
	vertex u,v; edge e;

	Wflograph fg(graf.n()+2,graf.n()+graf.m(),graf.n()+1,graf.n()+2);
	UiList cut(graf.n());

	if (!findCut(graf,cut)) fatal("flowMatch: graph is not bipartite");
	makFlograph(graf,cut,fg);
	for (e = 1; e <= graf.m(); e++)  fg.setCost(e,-graf.weight(e));
	for (e = graf.m()+1; e <= fg.m(); e++) fg.setCost(e,0);

	flow flowVal; floCost flowCost;
	lcap(fg,flowVal,flowCost,true);
	size = flowVal; weight = -flowCost;

	for (e = 1; e <= graf.m(); e++) {
		if (fg.f(graf.left(e),e) != 0) match.addLast(e);
	}
}

bool findCut(const Graph& graf, UiList& cut) {
// Return true if graf is bipartite, else false.
// If graf is bipartite, return a set of vertices cut that defines
// a cut that is crossed by all edges in graf.
	vertex u, v, w; edge e;
	enum stype { unreached, odd, even};
	stype state[graf.n()+1];
	UiList q(graf.n());

	for (u = 1; u <= graf.n(); u++) state[u] = unreached;
	u = 1;
	while (u <= graf.n()) {
		state[u] = even;
		q.addLast(u); cut.addLast(u);
		while (!q.empty()) {
			v = q.first(); q.removeFirst();
			for (e = graf.firstAt(v); e!=0; e = graf.nextAt(v,e)) {
				w = graf.mate(v,e);
				if (state[w] == state[v]) return false;
				if (state[w] == unreached) {
					state[w] = state[v]==even ? odd : even;
					if (state[w] == even) cut.addLast(w);
					q.addLast(w);
				}
			}
		}
		// find next unreached vertex
		for (u++; u <= graf.n() && state[u] != unreached; u++) {}
	}
	return true;
}

// Create Flograph corresponding to graf. Do this, so that corresponding
// edges have same edge numbers in fg and graf.
void makFlograph(const Graph& graf, const UiList& cut, Flograph& fg) {
	vertex u, v; edge e, ee;

	for (e = 1; e <= graf.m(); e++) {
		if (cut.member(graf.left(e))) u = graf.left(e);
		else u = graf.right(e);
		v = graf.mate(u,e);
		edge ee = fg.join(u,v);
		fg.setCapacity(ee,1);
	}
	for (u = 1; u <= graf.n(); u++) {
		if (cut.member(u)) e = fg.join(fg.src(),u);
		else e = fg.join(u,fg.snk());
		fg.setCapacity(e,1);
	}
}
