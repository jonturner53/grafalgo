/** @file prePush.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "prePush.h"

namespace grafalgo {

/** Find maximum flow in fg using the preflow-push method.
 *  @param fg1 is a flow graph, possibly with a non-zero initial flow.
 *  The base clase constructor initializes data used by all
 *  variants.
 */
prePush::prePush(Flograph& fg1) : fg(&fg1) {
	excess = new int[fg->n()+1];
	nextedge = new edge[fg->n()+1];

	// initialization
	for (vertex u = 1; u <= fg->n(); u++) {
		nextedge[u] = fg->firstAt(u); excess[u] = 0;
	}
	vertex s = fg->src();
        for (edge e = fg->firstOut(s); e != 0; e = fg->nextAt(s,e)) {
		flow ff = fg->res(s,e); fg->addFlow(s,e,ff);
                vertex v = fg->head(e);
                if (v != fg->snk()) excess[v] += ff;
        }
	d = new int[fg->n()+1];

	// constructor of derived class initializes additional data
	// structures, then calls either maxFlowIncr() or maxFlowBatch()
}

prePush::~prePush() { delete [] d; delete [] excess; delete [] nextedge; }


/** Compute maximum flow using incremental relabeling.  */
void prePush::maxFlowIncr() {
	initdist();
	vertex s = fg->src();
        for (edge e = fg->firstOut(s); e != 0; e = fg->nextAt(s,e)) {
		vertex v = fg->head(e);
		if (excess[v] > 0) addUnbal(v);
	}
	vertex u = removeUnbal();
	while (u != 0) {
		if (!balance(u)) {
			d[u] = 1 + minlabel(u);
			nextedge[u] = fg->firstAt(u);
			addUnbal(u);
		}
		u = removeUnbal();
	}
	return;
}

/** Compute maximum flow using batch relabeling.  */
void prePush::maxFlowBatch() {
	initdist();
	vertex s = fg->src();
        for (edge e = fg->firstOut(s); e != 0; e = fg->nextAt(s,e)) {
		vertex v = fg->head(e);
		if (excess[v] > 0) addUnbal(v);
	}
	vertex u = removeUnbal();
     	while (u != 0) {
     		do {
			balance(u);
			u = removeUnbal();
		} while (u != 0);
                initdist();
                for (u = 1; u <= fg->n(); u++) {
			if (u == fg->src() || u == fg->snk()) continue;
                        nextedge[u] = fg->firstAt(u);
                        if (excess[u] > 0) addUnbal(u);
                }
		u = removeUnbal();
        }
	return;
}
/** Compute exact distance labels and return in distance vector.
 *  For vertices that can't reach sink, compute labels to source.
 */
void prePush::initdist() {
	vertex u,v; edge e;
	List queue(fg->n());

	for (u = 1; u < fg->n(); u++) d[u] = 2*fg->n();

	// compute distance labels for vertices that have path to sink
	d[fg->snk()] = 0;
	queue.addLast(fg->snk());
	while (!queue.empty()) {
		u = queue.first(); queue.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (fg->res(v,e) > 0 && d[v] > d[u] + 1) {
				d[v] = d[u] + 1;
				queue.addLast(v);
			}
		}
	}

	if (d[fg->src()] < fg->n()) 
		Util::fatal("initdist: path present from source to sink");

	// compute distance labels for remaining vertices
	d[fg->src()] = fg->n();
	queue.addLast(fg->src());
	while (!queue.empty()) {
		u = queue.first(); queue.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (fg->res(v,e) > 0 && d[v] > d[u] + 1) {
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
int prePush::minlabel(vertex u) {
	int small; edge e;

	small = 2*fg->n();
	for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e))
		if (fg->res(u,e) > 0)
			small = min(small,d[fg->mate(u,e)]);
	return small;
}

/** Add a vertex to set of unbalanced vertices.
 *  This method must be defined in the derived class, as each
 *  derived class may use a different representation for the
 *  set of unbalanced vertices.
 *  @param u is the vertex to be added to the unbalanced set
 */
void prePush::addUnbal(vertex u) {
	Util::fatal("prePush::addUnbal: execution should never reach here");
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
vertex prePush::removeUnbal() {
	Util::fatal("prePush::removeUnbal: execution should never reach here");
	return 0;
}

/** Attempt to balance vertex, by pushing flow through admissible edges.
 *  @param u is a vertex
 *  @return true if u was successfully balanced
 */
bool prePush::balance(vertex u) {
	if (excess[u] <= 0) return true;
	while (true) {
		edge e = nextedge[u];
		if (e == 0) return false; 
		vertex v = fg->mate(u,e);
		if (fg->res(u,e) > 0 && d[u] == d[v]+1 && nextedge[v] != 0) {
			flow x = min(excess[u],fg->res(u,e));
			fg->addFlow(u,e,x);
			excess[u] -= x; excess[v] += x;
			if (v != fg->src() && v != fg->snk()) addUnbal(v);
			if (excess[u] <= 0) return true;
		}
		nextedge[u] = fg->nextAt(u,e);
	}
}

} // ends namespace
