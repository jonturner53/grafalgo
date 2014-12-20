/** @file hungarian.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "hungarian.h"

using namespace grafalgo;

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum size matching in a bipartite graph using the
 *  Hopcroft-Karp algorithm.
 *  @param graf1 is an undirected graph
 *  @param match is a list in which the result is returned
 *  @param matchSize is an output parameter used to return the size of the
 *  computed matching
 *  @param matchWeight is an output parameter used to return the weight of the
 *  computed matching
 */
hungarian::hungarian(Wgraph& graf1, Glist<edge>& match,
		     int& matchSize, edgeWeight& matchWeight) 
		: graf(&graf1) {
	// divide vertices into two independent sets
	split = new ListPair(graf->n());
	if (!findSplit(*graf,*split))
		Util::fatal("hungarian: graph is not bipartite");

	// construct initial matching
	mEdge = new edge[graf->n()+1];
	for (vertex u = 1; u <= graf->n(); u++) mEdge[u] = 0;
	for (edge e = graf->first(); e != 0; e = graf->next(e)) {
		vertex u = graf->left(e); vertex v = graf->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0)
			mEdge[u] = mEdge[v] = e;
	}

	// add unmatched vertices from in-set to roots
	roots = new Dlist(graf->n());
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u))
		if (mEdge[u] == 0) roots->addLast(u);

	// initialize vertex labels
	lab = new int[graf->n()+1];
	initLabels();

	// augment the matching until no augmenting path remains
	pEdge = new edge[graf->n()+1];
	nextEdge = new edge[graf->n()+1];
	vertex u;
	while ((u = findPath()) != 0) augment(u);

	// add matched edges to output set and compute size and weight
	match.clear(); matchSize = 0;
	for (vertex u = 1; u <= graf->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < graf->mate(u,e)) {
			match.addLast(e); matchSize++;
			matchWeight += graf->weight(e);
		}
	}
	delete split; delete roots;
	delete [] mEdge; delete [] pEdge;
	delete [] level; delete [] nextEdge;
	delete [] lab;
}

/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in the graph.
 *  Uses negated edge weights and the breadth-first scanning algorithm
 *  to compute shortest paths.
 */
void hungarian::initLabels() {
        List q(graf->n());
        for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u)) {
		pEdge[u] = 0; lab[u] = 0;
                for (edge e = graf->firstAt(u); e != 0; e = graf->nextAt(u,e)) {
                        vertex v = graf->mate(u,e);
                        if (lab[v] > lab[u] - graf->weight(e)) {
                                lab[v] = lab[u] - graf->weight(e);
				pEdge[v] = e;
                        }
		}
	}
}

/** Find a least cost augmenting path.
 *  Unmatched edges are "directed" from the "in-side" to the "out-side".
 *  Matched edges are "directed" from the "out-side" to the "in-side".
 *  The cost of a path is the weight of its matched edges minus the
 *  weight of its unmatched edges.
 *  @param return the sink vertex of the path found, or 0 if no such path
 */
vertex hungarian::findPath() {
	int w[graf->n()+1];		// w[u]=current tree path weight to u
	Dheap<int> S(graf->n(),4);	// stores "in-side" vertices only

	for (vertex u = 1; u <= graf->n(); u++) { pEdge[u]=0; w[u] = INT_MAX; }
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u)) {
		w[u] = 0; S.insert(u,0);
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
					if ( w[x] < bestPathWeight) {
						bestSink = x;
						bestPathWeight = w[x];
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
	// update labels for next round
	for (vertex u = 1; u <= graf->n(); u++) lab[u] += min(w[u],wMax);
	return bestSink;
}


/** Flip the edges along an augmenting path
 *  @param u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the pEdge pointers
 */
void hungarian::augment(vertex u) {
	while (u != 0) {
		vertex v = graf->mate(u,pEdge[u]);
		mEdge[u] = mEdge[v] = pEdge[u];
		u = pEdge[v];
	}
}
