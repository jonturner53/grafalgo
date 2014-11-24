/** @file minCapFlow.cpp
 * 
 *  @author Jon Turner
 *  @date 2013
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "minCapFlow.h"

/** Find maximum flow in flow graph with min capacity constraints.
 *  @param fg is the flow graph
 *  @param floVal is a reference used to return the value of the added flow;
 *  if there is no feasible flow for the given min capacities, -1 is returned.
 *  Normally, fg is expected to have 0 flow on all its edges,
 *  but this method will work correctly even if there is an initial
 *  non-zero flow. This method may modify the edge numbers in fg1.
 *  It will have all the same edges, but they may be identified by
 *  different edge numbers, upon return.
 */
minCapFlow::minCapFlow(Mflograph& fg1, int& floVal) {
	pEdge = new edge[fg1.n()+1];

	// Create separate flow graph for use in first phase
	// Just like fg1, but with extra sink-to-source edge
	Mflograph fg2(fg1.n(),fg1.m()+1, fg1.src(), fg1.snk());
	fg2.copyFrom(fg1);
	int tcap = 0;
	for (edge e = fg2.first(); e != 0; e = fg2.next(e))
		tcap += fg2.cap(fg2.tail(e),e);
	edge snkSrcEdge = fg2.join(fg2.snk(),fg2.src());
	if (snkSrcEdge == 0)
		Util::fatal("minCapFlow: internal error, can't create "
			    "sink/source edge");
	fg2.setCapacity(snkSrcEdge,tcap); fg2.setMinFlo(snkSrcEdge,0);
	fg = &fg2;

	// attempt to find a flow that satisfies all min capacities
	// first, add edges with unsatisfied min capacities to a todo list
	List todo(fg->m());
	for (edge e = fg->first(); e != 0; e = fg->next(e)) {
		vertex u = fg->tail(e);
		if (fg->f(u,e) < fg->minFlo(e))
			todo.addLast(e);
	}
	while (!todo.empty()) {
		edge e = todo.first();
		vertex u = fg->tail(e);
		if (fg->f(u,e) >= fg->minFlo(e)) {
			todo.removeFirst(); continue;
		}
		if (!findCycle(e)) { floVal = -1; return; }
		add2cycle(e);
	}
	floVal = fg2.f(fg2.snk(),snkSrcEdge);

	// Transfer flow from fg2 to fg1
	fg2.remove(snkSrcEdge);
	fg1.copyFrom(fg2);
	fg = &fg1;

	// now, push additional flow from source to sink
	while(findPath()) {
		floVal += augment(); 
	}
}

minCapFlow::~minCapFlow() { delete [] pEdge; }

/** Find an augmenting path from the source to the sink.
 *  If a path is found, the pEdge data structure contains "parent pointers"
 *  that define the path. More precisely, pEdge[u] is the edge on the path
 *  that connects u to its predecessor. So we can construct the path by
 *  following the pEdge values from the sink back to the source.
 *  @return true if a path found, else false
 */ 
bool minCapFlow::findPath() {
	vertex u,v; edge e;
	List queue(fg->n());

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
int minCapFlow::augment() {
	vertex u, v; edge e; flow f;

	// determine residual capacity of path
	f = INT_MAX;
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
 *  This method searches for a simple cycle with positive
 *  residual capacity in *fg that includes the given edge e.
 *  If a cycle is found, then on return the pEdge values will
 *  define a path with positive residual capacity from
 *  head(e) to tail(e). Combining this path with e gives
 *  the desired cycle.
 *  @param e is an edge
 *  @return true if a cycle is found, else false
 */
bool minCapFlow::findCycle(edge e) {
	vertex u = fg->tail(e); vertex v = fg->head(e);
	for (vertex x = 1; x <= fg->n(); x++) pEdge[x] = 0;

	List queue(fg->n()); queue.addLast(v);
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
	}
	return false;
}

/** Add flow to a cycle.
 *  This method adds flow to the cycle defined by the edge e and
 *  the path defined by pEdge.
 *  @param e is an edge
 *  @return the amount of flow added to the cycle
 */
int minCapFlow::add2cycle(edge e) {
	vertex u = fg->tail(e); vertex v = fg->head(e);

	// determine residual capacity of cycle
	flow f = fg->res(u,e);
	vertex x = u; edge px = pEdge[x];
	while (x != v) {
		vertex y = fg->mate(x,px);
		f = min(f,fg->res(y,px));
		x = y; px = pEdge[x];
	}
	// add flow to saturate cycle
	fg->addFlow(u,e,f);
	x = u; px = pEdge[x];
	while (x != v) {
		vertex y = fg->mate(x,px);
		fg->addFlow(y,px,f);
		x = y; px = pEdge[x];
	}
	return f;
}
