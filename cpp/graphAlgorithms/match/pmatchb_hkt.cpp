/** @file pmatchb_hkt.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "pmatchb_hkt.h"

namespace grafalgo {

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum priority matching in a bipartite graph using Turner's
 *  adaptation of the Hopcroft-Karp algorithm for maximum size matching.
 *  @param g is a bipartite undirected graph
 *  @param priority[i] is priority assigned to vertex i
 *  @param match is a list in which the matching is returned
 */
pmatchb_hkt::pmatchb_hkt(Graph& g, int* priority, List_g<edge>& match) {
	// divide vertices into two independent sets
	ListPair split(g.n());
	if (!findSplit(g,split))
		Util::fatal("pmatchb_hkt: graph is not bipartite");
	// identify priority values actually used
	bool p[g.n()+1]; // p[i]==true means some vertex has priority i
	for (int i = 1; i <= g.n(); i++) p[i] = false;
	for (vertex u = 1; u <= g.n(); u++) p[priority[u]] = true;

	// build initial flow graph and find max flow
	Graph_f fg(g.n()+2, g.M() + g.n());
	vertex s = fg.n()-1; fg.setSrc(s);
	vertex t = fg.n();   fg.setSnk(t);
	// first, core edges
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.left(e); vertex v = g.right(e);
		if (split.isOut(u)) { vertex w = u; u = v; v = w; }
		fg.joinWith(u,v,e); fg.setCapacity(e,1);
	}
	// now, source/sink edges
	for (vertex u = split.firstIn(); u != 0; u = split.nextIn(u)) {
		edge e = fg.join(s,u); fg.setCapacity(e,1);
	}
	for (vertex v = split.firstOut(); v != 0; v = split.nextOut(v)) {
		edge e = fg.join(v,t); fg.setCapacity(e,1);
	}
	(mflo_d(fg));
	// record which vertices are now "matched" and remove source/sink edges
	bool matched[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) matched[u] = false;
	for (edge e = fg.firstAt(s); e != 0; e = fg.firstAt(s)) {
		matched[fg.mate(s,e)] = (fg.f(s,e) != 0); fg.remove(e);
	}
	for (edge e = fg.firstAt(t); e != 0; e = fg.firstAt(t)) {
		matched[fg.mate(t,e)] = (fg.f(t,e) != 0); fg.remove(e);
	}
	
	// for each priority, modify source/sink edges add more flow
	// (repeat for each side)
	for (int i = 1; i <= g.n(); i++) {
		if (!p[i]) continue;
		// add new source/sink edges to/from left vertices
		for (vertex u = split.firstIn(); u != 0; u = split.nextIn(u)) {
			if (priority[u] == i && !matched[u]) {
				edge e = fg.join(s,u); fg.setCapacity(e,1);
			} else if (priority[u] > i && matched[u]) {
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
			matched[fg.mate(s,e)] = (fg.f(s,e) == 0); fg.remove(e);
		}
		for (edge e = fg.firstAt(t); e != 0; e = fg.firstAt(t)) {
			matched[fg.mate(t,e)] = (fg.f(t,e) != 0); fg.remove(e);
		}
	}

	// copy flow back into matching list
	match.clear(); 
	for (vertex u = split.firstIn(); u != 0; u = split.nextIn(u)) {
		if (!matched[u]) continue;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e))
			if (fg.f(u,e) != 0) { match.addLast(e);  break; }
	}
}

} // ends namespace
