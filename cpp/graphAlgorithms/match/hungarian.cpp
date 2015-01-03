/** @file hungarian.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "hungarian.h"

namespace grafalgo {

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum weight matching in a bipartite graph using the
 *  hungarian algorithm algorithm.
 *  @param graf1 is an undirected graph
 *  @param match is a list in which the result is returned
 */
hungarian::hungarian(Wgraph& graf1, Glist<edge>& match) : graf(&graf1) {
	// divide vertices into two independent sets
	split = new ListPair(graf->n());
	if (!findSplit(*graf,*split))
		Util::fatal("hungarian: graph is not bipartite");

	mEdge = new edge[graf->n()+1];
	roots = new Dlist(graf->n());
	for (vertex u = 1; u <= graf->n(); u++) {
		mEdge[u] = 0;
		if (split->isIn(u)) roots->addLast(u);
	}

	// initialize vertex labels
	lab = new int[graf->n()+1];
	initLabels();

	// augment the matching until no augmenting path remains
	vertex u; pEdge = new edge[graf->n()+1];
	while ((u = findPath()) != 0) { augment(u); }

	// add matched edges to output set
	match.clear();
	for (vertex u = 1; u <= graf->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < graf->mate(u,e)) match.addLast(e);
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
void hungarian::initLabels() {
	List q(graf->n());
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u)) {
		lab[u] = 0;
		for (edge e = graf->firstAt(u); e != 0; e = graf->nextAt(u,e)) {
			vertex v = graf->mate(u,e);
			if (lab[v] > lab[u] - graf->weight(e))
				lab[v] = lab[u] - graf->weight(e);
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
vertex hungarian::findPath() {
	int w[graf->n()+1];		// w[u]=current tree path weight to u
	Dheap<int> S(graf->n(),4);	// stores "in-set" vertices only

	for (vertex u = 1; u <= graf->n(); u++) { pEdge[u]=0; w[u] = INT_MAX; }
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u)) {
		if (mEdge[u] == 0) { w[u] = 0; S.insert(u,0); }
	}

	vertex bestSink = 0; edgeWeight bestPathWeight = INT_MAX;
	edgeWeight wMax = 0;
	while (!S.empty()) {
		vertex u = S.deletemin(); // u is in "in-set"
		wMax = max(wMax, w[u]);
		for (edge e = graf->firstAt(u); e != 0; e = graf->nextAt(u,e)) {
			if (e == mEdge[u]) continue;
			vertex x = graf->mate(u,e);
			if (w[x] > (w[u]-graf->weight(e)) + (lab[u]-lab[x])) {
				pEdge[x] = e;
				w[x] = (w[u]-graf->weight(e)) + (lab[u]-lab[x]);
				edge ee = mEdge[x];
				if (ee == 0) {
					if (w[x] + lab[x] < bestPathWeight) {
						bestSink = x;
						bestPathWeight = w[x] + lab[x];
					}
					continue;
				}
				vertex y = graf->mate(x,ee);
				pEdge[y] = ee;
				w[y] = w[x]+graf->weight(ee) + (lab[x]-lab[y]);
				if (!S.member(y)) S.insert(y,w[y]);
				else S.changekey(y,w[y]);
			}
		}
	}
	if (bestSink == 0) return 0;

	// update labels for next round
	for (vertex u = 1; u <= graf->n(); u++) lab[u] += min(w[u],wMax);

	// determine true weight of path
	vertex u = bestSink; edgeWeight pathWeight = 0;
	while (true) {
		pathWeight += graf->weight(pEdge[u]);
		u = graf->mate(u,pEdge[u]);
		if (pEdge[u] == 0) break;
		pathWeight -= graf->weight(pEdge[u]);
		u = graf->mate(u,pEdge[u]);
	}
	return (pathWeight > 0 ? bestSink : 0);
}


/** Flip the edges along an augmenting path
 *  @param u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the pEdge pointers
 */
void hungarian::augment(vertex u) {
	while (true) {
		vertex v = graf->mate(u,pEdge[u]);
		mEdge[u] = mEdge[v] = pEdge[u];
		if (pEdge[v] == 0) break;
		u = graf->mate(v,pEdge[v]);
	}
}

} // ends namespace
