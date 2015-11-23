/** @file mflo_pp.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "mflo_pp.h"

namespace grafalgo {

/** Find maximum flow in g using the preflow-push method.
 *  @param g1 is a flow graph, possibly with a non-zero initial flow.
 *  The base clase constructor initializes data used by all
 *  variants.
 */
mflo_pp::mflo_pp(Graph_f& g1) : g(&g1) {
	excess = new int[g->n()+1];
	nextedge = new edge[g->n()+1];

	// initialization
	for (vertex u = 1; u <= g->n(); u++) {
		nextedge[u] = g->firstAt(u); excess[u] = 0;
	}
	vertex s = g->src();
        for (edge e = g->firstOut(s); e != 0; e = g->nextAt(s,e)) {
		flow ff = g->res(s,e); g->addFlow(s,e,ff);
                vertex v = g->head(e);
                if (v != g->snk()) excess[v] += ff;
        }
	d = new int[g->n()+1];

	// constructor of derived class initializes additional data
	// structures, then calls either maxFlowIncr() or maxFlowBatch()
}

mflo_pp::~mflo_pp() { delete [] d; delete [] excess; delete [] nextedge; }


/** Compute maximum flow using incremental relabeling.  */
void mflo_pp::maxFlowIncr() {
	initdist();
	vertex s = g->src();
        for (edge e = g->firstOut(s); e != 0; e = g->nextAt(s,e)) {
		vertex v = g->head(e);
		if (excess[v] > 0) addUnbal(v);
	}
	vertex u = removeUnbal();
	while (u != 0) {
		if (!balance(u)) {
			d[u] = 1 + minlabel(u);
			nextedge[u] = g->firstAt(u);
			addUnbal(u);
		}
		u = removeUnbal();
	}
	return;
}

/** Compute maximum flow using batch relabeling.  */
void mflo_pp::maxFlowBatch() {
	initdist();
	vertex s = g->src();
        for (edge e = g->firstOut(s); e != 0; e = g->nextAt(s,e)) {
		vertex v = g->head(e);
		if (excess[v] > 0) addUnbal(v);
	}
	vertex u = removeUnbal();
     	while (u != 0) {
     		do {
			balance(u);
			u = removeUnbal();
		} while (u != 0);
                initdist();
                for (u = 1; u <= g->n(); u++) {
			if (u == g->src() || u == g->snk()) continue;
                        nextedge[u] = g->firstAt(u);
                        if (excess[u] > 0) addUnbal(u);
                }
		u = removeUnbal();
        }
	return;
}
/** Compute exact distance labels and return in distance vector.
 *  For vertices that can't reach sink, compute labels to source.
 */
void mflo_pp::initdist() {
	vertex u,v; edge e;
	List queue(g->n());

	for (u = 1; u < g->n(); u++) d[u] = 2*g->n();

	// compute distance labels for vertices that have path to sink
	d[g->snk()] = 0;
	queue.addLast(g->snk());
	while (!queue.empty()) {
		u = queue.first(); queue.removeFirst();
		for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			v = g->mate(u,e);
			if (g->res(v,e) > 0 && d[v] > d[u] + 1) {
				d[v] = d[u] + 1;
				queue.addLast(v);
			}
		}
	}

	if (d[g->src()] < g->n()) 
		Util::fatal("initdist: path present from source to sink");

	// compute distance labels for remaining vertices
	d[g->src()] = g->n();
	queue.addLast(g->src());
	while (!queue.empty()) {
		u = queue.first(); queue.removeFirst();
		for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			v = g->mate(u,e);
			if (g->res(v,e) > 0 && d[v] > d[u] + 1) {
				d[v] = d[u] + 1;
				queue.addLast(v);
			}
		}
	}
}

/** Find smallest label on an adjacent vertex through an edge with
 *  positive residual capacity.
 *  @param u is a vertex
 *  @return the smallest label on a neighbor of u for which the
 *  connecting edge positive residual capacity
 */
int mflo_pp::minlabel(vertex u) {
	int small; edge e;

	small = 2*g->n();
	for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e))
		if (g->res(u,e) > 0)
			small = min(small,d[g->mate(u,e)]);
	return small;
}

/** Add a vertex to set of unbalanced vertices.
 *  This method must be defined in the derived class, as each
 *  derived class may use a different representation for the
 *  set of unbalanced vertices.
 *  @param u is the vertex to be added to the unbalanced set
 */
void mflo_pp::addUnbal(vertex u) {
	Util::fatal("mflo_pp::addUnbal: execution should never reach here");
}

/** Remove a vertex from the set of unbalanced vertices.
 *  This method must be defined in the derived class, as each
 *  derived class may use a different representation for the
 *  set of unbalanced vertices.
 *  @return an unbalanced vertex or 0 if there are none; this method
 *  removes the returned vertex from the data structure that represents
 *  the unbalanced vertices; if the caller is unable to make the vertex
 *  balanced, it must add the vertex back to the unbalanced set.
 */
vertex mflo_pp::removeUnbal() {
	Util::fatal("mflo_pp::removeUnbal: execution should never reach here");
	return 0;
}

/** Attempt to balance vertex, by pushing flow through admissible edges.
 *  @param u is a vertex
 *  @return true if u was successfully balanced
 */
bool mflo_pp::balance(vertex u) {
	if (excess[u] <= 0) return true;
	while (true) {
		edge e = nextedge[u];
		if (e == 0) return false; 
		vertex v = g->mate(u,e);
		if (g->res(u,e) > 0 && d[u] == d[v]+1 && nextedge[v] != 0) {
			flow x = min(excess[u],g->res(u,e));
			g->addFlow(u,e,x);
			excess[u] -= x; excess[v] += x;
			if (v != g->src() && v != g->snk()) addUnbal(v);
			if (excess[u] <= 0) return true;
		}
		nextedge[u] = g->nextAt(u,e);
	}
}

} // ends namespace
