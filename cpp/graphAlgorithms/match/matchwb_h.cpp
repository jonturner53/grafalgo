/** @file matchwb_h.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "matchwb_h.h"

namespace grafalgo {

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum weight matching in a bipartite graph using the
 *  matchwb_h algorithm algorithm.
 *  @param g1 is an undirected graph
 *  @param match is a list in which the result is returned
 */
matchwb_h::matchwb_h(Graph_w& g1, List_g<edge>& match) : g(&g1) {
	// divide vertices into two independent sets
	split = new ListPair(g->n());
	if (!findSplit(*g,*split))
		Util::fatal("matchwb_h: graph is not bipartite");

	mEdge = new edge[g->n()+1];
	roots = new List_d(g->n());
	for (vertex u = 1; u <= g->n(); u++) {
		mEdge[u] = 0;
		if (split->isIn(u)) roots->addLast(u);
	}

	// initialize vertex labels
	lab = new int[g->n()+1];
	initLabels();

	// augment the matching until no augmenting path remains
	vertex u; pEdge = new edge[g->n()+1];
	while ((u = findPath()) != 0) { augment(u); }

	// add matched edges to output set
	match.clear();
	for (vertex u = 1; u <= g->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < g->mate(u,e)) match.addLast(e);
	}
	delete split; delete roots;
	delete [] mEdge; delete [] pEdge; delete [] lab;
}

/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in the "in-set"
 *  of the bipartite graph. Edges are treated as directed from the
 *  in-set to the out-set.
 */
void matchwb_h::initLabels() {
	List q(g->n());
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u)) {
		lab[u] = 0;
		for (edge e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			vertex v = g->mate(u,e);
			if (lab[v] > lab[u] - g->weight(e))
				lab[v] = lab[u] - g->weight(e);
		}
	}
}

/** Find a least cost augmenting path.
 *  Unmatched edges are "directed" from the "in-set" to the "out-set".
 *  Matched edges are "directed" from the "out-set" to the "in-set".
 *  The cost of a path is the weight of its matched edges minus the
 *  weight of its unmatched edges.
 *  @param return the sink vertex of the path found, or 0 if no such path
 */
vertex matchwb_h::findPath() {
	int w[g->n()+1];		// w[u]=current tree path weight to u
	Heap_d<int> S(g->n(),4);	// stores "in-set" vertices only

	for (vertex u = 1; u <= g->n(); u++) { pEdge[u]=0; w[u] = INT_MAX; }
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u)) {
		if (mEdge[u] == 0) { w[u] = 0; S.insert(u,0); }
	}

	vertex bestSink = 0; edgeWeight bestPathWeight = INT_MAX;
	edgeWeight wMax = 0;
	while (!S.empty()) {
		vertex u = S.deletemin(); // u is in "in-set"
		wMax = max(wMax, w[u]);
		for (edge e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			if (e == mEdge[u]) continue;
			vertex x = g->mate(u,e);
			if (w[x] > (w[u]-g->weight(e)) + (lab[u]-lab[x])) {
				pEdge[x] = e;
				w[x] = (w[u]-g->weight(e)) + (lab[u]-lab[x]);
				edge ee = mEdge[x];
				if (ee == 0) {
					if (w[x] + lab[x] < bestPathWeight) {
						bestSink = x;
						bestPathWeight = w[x] + lab[x];
					}
					continue;
				}
				vertex y = g->mate(x,ee);
				pEdge[y] = ee;
				w[y] = w[x]+g->weight(ee) + (lab[x]-lab[y]);
				if (!S.member(y)) S.insert(y,w[y]);
				else S.changekey(y,w[y]);
			}
		}
	}
	if (bestSink == 0) return 0;

	// update labels for next round
	for (vertex u = 1; u <= g->n(); u++) lab[u] += min(w[u],wMax);

	// determine true weight of path
	vertex u = bestSink; edgeWeight pathWeight = 0;
	while (true) {
		pathWeight += g->weight(pEdge[u]);
		u = g->mate(u,pEdge[u]);
		if (pEdge[u] == 0) break;
		pathWeight -= g->weight(pEdge[u]);
		u = g->mate(u,pEdge[u]);
	}
	return (pathWeight > 0 ? bestSink : 0);
}


/** Flip the edges along an augmenting path
 *  @param u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the pEdge pointers
 */
void matchwb_h::augment(vertex u) {
	while (true) {
		vertex v = g->mate(u,pEdge[u]);
		mEdge[u] = mEdge[v] = pEdge[u];
		if (pEdge[v] == 0) break;
		u = g->mate(v,pEdge[v]);
	}
}

} // ends namespace
