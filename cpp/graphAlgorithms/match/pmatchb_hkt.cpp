/** @file pmatchb_hkt.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "pmatchb_hkt.h"
#include "matchb_hk.h"

namespace grafalgo {

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum priority matching in a bipartite graph using Turner's
 *  adaptation of the Hopcroft-Karp algorithm for maximum size matching.
 *  @param[in] g is a graph
 *  @param[in] priority[u] is priority assigned to vertex u
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if u is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching
 */
pmatchb_hkt::pmatchb_hkt(Graph& g, int* priority, edge *matchingEdge) {
	// partition vertices by priority
	Dlists pclass(g.n()); vertex classId[g.n()+1];
	for (int i = 1; i <= g.n(); i++) classId[i] = 0;
	for (vertex u = 1; u <= g.n(); u++) {
		int i = priority[u]; classId[i] = pclass.join(classId[i],u);
	}
	// Create initial maximal (not maximum) priority matching
	for (int i = 1; i <= g.n(); i++) {
		if (classId[i] == 0) continue;
		for (vertex u = pclass.first(classId[i]); u != 0;
			    u = pclass.next(u)) {
			if (matchingEdge[u] != 0) continue;
			edge beste = 0; int bestp = g.n()+1;
			for (edge e = g.firstAt(u); e!=0; e = g.nextAt(u,e)) {
				vertex v = g.mate(u,e);
				if (matchingEdge[v]==0 && priority[v] < bestp) {
					beste = e; bestp = priority[v];
				}
			}
			if (beste != 0) {
				matchingEdge[u] = beste;
				matchingEdge[g.mate(u,beste)] = beste;
			}
		}
	}
	matchb_hk(g,matchingEdge); // extend to max size matching

	// divide vertices into two independent sets
	ListPair split(g.n());
	if (!findSplit(g,split))
		Util::fatal("pmatchb_hkt: graph is not bipartite");

/*
Can we reduce the overhead? Currently, spending lots of time building 
source/sink edges and recording matched vertices. Suppose we just start
with matching and maintain list of left/right roots. At start of phase,
do bfs from one set of roots to compute level values. During phase,
use dfs from roots, using eligible edges. This eliminates most of the
overhead. Not sure it's worth the trouble.
*/

	// build flow graph core and set initial flows to correspond to
	// initial matching
	Graph_f fg(g.n()+2, g.M() + g.n());
	vertex s = fg.n()-1; fg.setSrc(s);
	vertex t = fg.n();   fg.setSnk(t);
	// first, core edges
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.left(e); vertex v = g.right(e);
		if (split.isOut(u)) { vertex w = u; u = v; v = w; }
		fg.joinWith(u,v,e); fg.setCapacity(e,1);
		if (matchingEdge[u] == e) fg.setFlow(e,1);
	}
	bool matched[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) matched[u] = (matchingEdge[u] != 0);
	
	// for each priority, modify source/sink edges add more flow
	// (repeat for each side)
	for (int i = 1; i <= g.n(); i++) {
		if (classId[i] == 0) continue;
		// add new source/sink edges to/from left vertices
		for (vertex u = split.firstIn(); u != 0; u = split.nextIn(u)) {
			if (priority[u] == i && matched[u]) {
				edge e = fg.join(s,u); fg.setCapacity(e,1);
			} else if (priority[u] > i && !matched[u]) {
				edge e = fg.join(u,t); fg.setCapacity(e,1);
			}
		}
		(mflo_d(fg)); // augment flow
		// record newly matched/unmatched vertices and remove s/s edges
		for (edge e = fg.firstAt(s); e != 0; e = fg.firstAt(s)) {
			matched[fg.mate(s,e)] = (fg.f(s,e) != 0); fg.remove(e);
		}
		for (edge e = fg.firstAt(t); e != 0; e = fg.firstAt(t)) {
			matched[fg.mate(t,e)] = (fg.f(t,e) == 0); fg.remove(e);
		}
		// add new source/sink edges to/from right vertices
		for (vertex v = split.firstOut(); v!=0; v = split.nextOut(v)) {
			if (priority[v] == i && !matched[v]) {
				edge e = fg.join(v,t); fg.setCapacity(e,1);
			} else if (priority[v] > i && matched[v]) {
				edge e = fg.join(s,v); fg.setCapacity(e,1);
			}
		}
		(mflo_d(fg)); // augment flow
		// record newly matched/unmatched vertices and remove s/s edges
		for (edge e = fg.firstAt(s); e != 0; e = fg.firstAt(s)) {
			matched[fg.mate(s,e)] = (fg.f(s,e) != 0); fg.remove(e);
		}
		for (edge e = fg.firstAt(t); e != 0; e = fg.firstAt(t)) {
			matched[fg.mate(t,e)] = (fg.f(t,e) == 0); fg.remove(e);
		}
/*
		if (classId[i] == 0) continue;
		// add new source/sink edges to/from left vertices
		for (vertex u = split.firstIn(); u != 0; u = split.nextIn(u)) {
			if (priority[u] == i && matchingEdge[u] == 0) {
				edge e = fg.join(s,u); fg.setCapacity(e,1);
			} else if (priority[u] > i && matchingEdge[u] != 0) {
				edge e = fg.join(u,t); fg.setCapacity(e,1);
			}
		}
		(mflo_d(fg)); // augment flow
		// record newly matched/unmatched vertices and remove s/s edges
		for (vertex u = 1; u <= g.n(); u++) matchingEdge[u] = 0;
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			vertex u = g.left(e); vertex v = g.right(e);
			if (split.isOut(u)) { vertex w = u; u = v; v = w; }
			if (fg.f(u,e) == 1)
				matchingEdge[u] = matchingEdge[v] = e;
		}
		for (edge e = fg.firstAt(s); e != 0; e = fg.firstAt(s))
			fg.remove(e);
		for (edge e = fg.firstAt(t); e != 0; e = fg.firstAt(t))
			fg.remove(e);
		// add new source/sink edges to/from right vertices
		for (vertex v = split.firstOut(); v!=0; v = split.nextOut(v)) {
			if (priority[v] == i && matchingEdge[v] == 0) {
				edge e = fg.join(v,t); fg.setCapacity(e,1);
			} else if (priority[v] > i && matchingEdge[v] != 0) {
				edge e = fg.join(s,v); fg.setCapacity(e,1);
			}
		}
		(mflo_d(fg)); // augment flow
		// record newly matched/unmatched vertices and remove s/s edges
		for (vertex u = 1; u <= g.n(); u++) matchingEdge[u] = 0;
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			vertex u = g.left(e); vertex v = g.right(e);
			if (split.isOut(u)) { vertex w = u; u = v; v = w; }
			if (fg.f(u,e) == 1)
				matchingEdge[u] = matchingEdge[v] = e;
		}
		for (edge e = fg.firstAt(s); e != 0; e = fg.firstAt(s))
			fg.remove(e);
		for (edge e = fg.firstAt(t); e != 0; e = fg.firstAt(t))
			fg.remove(e);
*/
	}
	// record matched/unmatched vertices
	for (vertex u = 1; u <= g.n(); u++) matchingEdge[u] = 0;
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.left(e); vertex v = g.right(e);
		if (split.isOut(u)) { vertex w = u; u = v; v = w; }
		if (fg.f(u,e) == 1)
			matchingEdge[u] = matchingEdge[v] = e;
	}
}

} // ends namespace
