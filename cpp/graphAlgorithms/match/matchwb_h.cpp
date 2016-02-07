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
 *  hungarian algorithm.
 *  @param[in] g is a graph
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if u is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching with minimum cost
 *  among all matchings of the same size
 */
matchwb_h::matchwb_h(const Graph_w& g, edge *matchingEdge)
		     : gp(&g), mEdge(matchingEdge) {
	// divide vertices into two independent sets
	split = new ListPair(gp->n());
	if (!findSplit(*gp,*split))
		Util::fatal("matchwb_h: graph is not bipartite");

	roots = new List_d(gp->n());
	for (vertex u = 1; u <= gp->n(); u++) {
		if (split->isIn(u) && mEdge[u] == 0) roots->addLast(u);
	}

	// initialize vertex labels
	lab = new int[gp->n()+1];
	initLabels();

	// augment the matching until no augmenting path remains
	vertex u; pEdge = new edge[gp->n()+1];
	while ((u = findPath()) != 0) { augment(u); }

	delete split; delete roots; delete [] pEdge; delete [] lab;
}

/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in the "in-set"
 *  of the bipartite graph. Edges are treated as directed from the
 *  in-set to the out-set.
 */
void matchwb_h::initLabels() {
	List q(gp->n());
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u)) {
		lab[u] = 0;
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			vertex v = gp->mate(u,e);
			if (lab[v] > lab[u] - gp->weight(e))
				lab[v] = lab[u] - gp->weight(e);
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
	int w[gp->n()+1];		// w[u]=current tree path weight to u
	Heap_d<int> S(gp->n(),4);	// stores "in-set" vertices only

	for (vertex u = 1; u <= gp->n(); u++) { pEdge[u]=0; w[u] = INT_MAX; }
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u)) {
		if (mEdge[u] == 0) { w[u] = 0; S.insert(u,0); }
	}

	vertex bestSink = 0; edgeWeight bestPathWeight = INT_MAX;
	edgeWeight wMax = 0;
	while (!S.empty()) {
		vertex u = S.deletemin(); // u is in "in-set"
		wMax = max(wMax, w[u]);
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			if (e == mEdge[u]) continue;
			vertex x = gp->mate(u,e);
			if (w[x] > (w[u]-gp->weight(e)) + (lab[u]-lab[x])) {
				pEdge[x] = e;
				w[x] = (w[u]-gp->weight(e)) + (lab[u]-lab[x]);
				edge ee = mEdge[x];
				if (ee == 0) {
					if (w[x] + lab[x] < bestPathWeight) {
						bestSink = x;
						bestPathWeight = w[x] + lab[x];
					}
					continue;
				}
				vertex y = gp->mate(x,ee);
				pEdge[y] = ee;
				w[y] = w[x]+gp->weight(ee) + (lab[x]-lab[y]);
				if (!S.member(y)) S.insert(y,w[y]);
				else S.changekey(y,w[y]);
			}
		}
	}
	if (bestSink == 0) return 0;

	// update labels for next round
	for (vertex u = 1; u <= gp->n(); u++) lab[u] += min(w[u],wMax);

	// determine true weight of path
	vertex u = bestSink; edgeWeight pathWeight = 0;
	while (true) {
		pathWeight += gp->weight(pEdge[u]);
		u = gp->mate(u,pEdge[u]);
		if (pEdge[u] == 0) break;
		pathWeight -= gp->weight(pEdge[u]);
		u = gp->mate(u,pEdge[u]);
	}
	return (pathWeight > 0 ? bestSink : 0);
}


/** Flip the edges along an augmenting path
 *  @param u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the pEdge pointers
 */
void matchwb_h::augment(vertex u) {
	while (true) {
		vertex v = gp->mate(u,pEdge[u]);
		mEdge[u] = mEdge[v] = pEdge[u];
		if (pEdge[v] == 0) break;
		u = gp->mate(v,pEdge[v]);
	}
}

} // ends namespace
