#include "minFlow.h"

/** Find maximum flow in flow graph with min capacity constraints.
 *  @param fg is the flow graph
 *  @param floVal on return, floVal is the total amount of flow that was
 *  added to the flow graph; if there is no feasible flow for the
 *  given min capacities, -1 is returned.
 *  Normally, fg is expected to have 0 flow on all its edges,
 *  but this method will work correctly even if there is an initial
 *  non-zero flow
 */
minFlow::minFlow(Mflograph& fg1, int& floVal) : fg(&fg1) {
	pEdge = new edge[fg->n()+1];

	// attempt to find a flow that satisfies all min capacities
	// first, add edges with unsatisfied min capacities to a todo list
	UiList todo(fg->m());
	for (edge e = fg->first(); e != 0; e = fg->next(e)) {
		vertex u = fg->tail(e);
		if (fg->f(u,e) < fg->minFlo(e))
			todo.addLast(e);
	}
	floVal = 0;
	while (!todo.empty()) {
		edge e = todo.first();
		vertex u = fg->tail(e); vertex v = fg->head(e);
		if (fg->f(u,e) >= fg->minFlo(e)) {
			todo.removeFirst(); continue;
		}
		if (!findCycle(e)) { floVal = -1; return; }
		floVal += add2cycle(e);
	}

	// now, push additional flow from source to sink
	while(findPath()) {
		floVal += augment(); 
	}
}

minFlow::~minFlow() { delete [] pEdge; }

/** Find an augmenting path from the source to the sink.
 *  If a path is found, the pEdge data structure contains "parent pointers"
 *  that define the path. More precisely, pEdge[u] is the edge on the path
 *  that connects u to its predecessor. So we can construct the path by
 *  following the pEdge values from the sink back to the source.
 *  @return true if a path found, else false
 */ 
bool minFlow::findPath() {
	vertex u,v; edge e;
	UiList queue(fg->n());

	for (u = 1; u <= fg->n(); u++) pEdge[u] = 0;
	queue.addLast(fg->src());
	while (!queue.empty()) {
		u = queue.first(); queue.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && pEdge[v] == 0 && 
			    v != fg->src()) {
				pEdge[v] = e;
				if (v == fg->snk()) return true;
				queue.addLast(v);
			}
		}
	}
	return false;
}

/** Saturate the augmenting path defined by the pEdge values.
 *  When augment is called, pEdge should contain pointers that
 *  define a sequence of edges from the sink back to the source.
 *  The method adds enough flow to the path defined by this edge
 *  sequence to saturate the path.
 *  @return the amount of flow added to the path.
 */
int minFlow::augment() {
	vertex u, v; edge e; flow f;

	// determine residual capacity of path
	f = BIGINT;
	u = fg->snk(); e = pEdge[u];
	while (u != fg->src()) {
		v = fg->mate(u,e);
		f = min(f,fg->res(v,e));
		u = v; e = pEdge[u];
	}
	// add flow to saturate path
	u = fg->snk(); e = pEdge[u];
	while (u != fg->src()) {
		v = fg->mate(u,e);
		fg->addFlow(v,e,f);
		u = v; e = pEdge[u];
	}
	return f;
}

/** Find a cycle that passes through a given edge.
 *  This method searches for a simple cycle that includes the
 *  given edge e. For the purposes of this method,
 *  the source and sink are viewed as a single vertex.
 *  If a cycle is found, then on return the pEdge values will
 *  define a path with positive residual capacity from
 *  head(e) to tail(e). Combining this path with e gives
 *  the desired cycle.
 *  @param e is an edge
 *  @return true if a cycle is found, else false
 */
bool minFlow::findCycle(edge e) {
	vertex u = fg->tail(e); vertex v = fg->head(e);
	for (vertex x = 1; x <= fg->n(); x++) pEdge[x] = 0;

	UiList queue(fg->n()); queue.addLast(v);
	while (!queue.empty()) {
		vertex x = queue.first(); queue.removeFirst();
		for (edge ex = fg->firstAt(x); ex != 0; ex = fg->nextAt(x,ex)) {
			vertex y = fg->mate(x,ex);
			if (fg->res(x,ex) > 0 && pEdge[y] == 0 && y != v) {
				pEdge[y] = ex;
				if (y == u) return true;
				queue.addLast(y);
			}
		}
		// if search reaches sink, continue searching from source
		if (x != fg->snk() || pEdge[fg->src()] != 0) continue;
		pEdge[fg->src()] = -1; // special value to indicate src/snk link
		if (u == fg->src()) return true;
		x = fg->src();
		for (edge ex = fg->firstAt(x); ex != 0; ex = fg->nextAt(x,ex)) {
			vertex y = fg->mate(x,ex);
			if (fg->res(x,ex) > 0 && pEdge[y] == 0 && y != v) {
				pEdge[y] = ex;
				if (y == u) return true;
				queue.addLast(y);
			}
		}
	}
	return false;
}

/** Add flow to a cycle.
 *  This method adds flow to the cycle defined by the edge e and
 *  the path defined by pEdge. For the purposes of this method,
 *  the source and sink are viewed as a single node.
 *  @param e is an edge
 *  @return the amount of flow added to the cycle
 */
int minFlow::add2cycle(edge e) {
	vertex u = fg->tail(e); vertex v = fg->head(e);

	// determine residual capacity of cycle
	flow f = fg->res(u,e);
	vertex x = (pEdge[u] != -1 ? u : fg->snk());
	edge px = pEdge[x];
	while (x != v) {
		vertex y = fg->mate(x,px);
		f = min(f,fg->res(y,px));
		x = (pEdge[y] != -1 ? y : fg->snk());
		px = pEdge[x];
	}
	// add flow to saturate cycle
	fg->addFlow(u,e,f);
	x = (pEdge[u] != -1 ? u : fg->snk());
	px = pEdge[x];
	while (x != v) {
		vertex y = fg->mate(x,px);
		fg->addFlow(y,px,f);
		x = (pEdge[y] != -1 ? y : fg->snk());
		px = pEdge[x];
	}
	return f;
}
