/** @file prePush.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "prePush.h"

/** Find maximum flow using the preflow-push method.
 *  This base clase constructor initializes data used by all
 *  variants.
 *  @param fg1 is a reference to the flograph for which a max flow is
 *  required; on return, the flow fields of the flow graph contain
 *  the max flow
 *  @param floVal is a reference to an integer in which the value of
 *  the resulting flow is returned
 */
prePush::prePush(Flograph& fg1, int& floVal) : fg(&fg1) {

	excess = new int[fg->n()+1];
	nextedge = new edge[fg->n()+1];

	// initialization
	for (vertex u = 1; u <= fg->n(); u++) {
		nextedge[u] = fg->firstAt(u); excess[u] = 0;
	}
	vertex s = fg->src();
        for (edge e = fg->firstOut(s); e != 0; e = fg->nextAt(s,e)) {
                vertex v = fg->head(e);
                fg->addFlow(s,e,fg->cap(s,e));
                if (v != fg->snk()) excess[v] = fg->cap(s,e);
        }
	d = new int[fg->n()+1];
	satCount = nonSatCount = newDistCount = relabCount = 0;
	initdist();
	// constructor of derived class takes over from here
}

prePush::~prePush() { delete [] d; delete [] excess; delete [] nextedge; }

void prePush::newUnbal(vertex u) {
	Util::fatal("prePush::newUnbal: execution should never reach here");
}

/** Attempt to balance a vertex by pushing flow through admissible edges.
 *  @param u is a vertex with positive excess
 *  @return true if u is balanced on return, else false
 */
bool prePush::balance(vertex u) {
	if (excess[u] <= 0) return true;
	while (true) {
		edge e = nextedge[u];
		if (e == 0) return false; 
		vertex v = fg->mate(u,e);
		if (fg->res(u,e) > 0 && d[u] == d[v]+1 && nextedge[v] != 0) {
			flow x = min(excess[u],fg->res(u,e));
			if (x == fg->res(u,e)) satCount++;
			else nonSatCount++;
			fg->addFlow(u,e,x);
			excess[u] -= x; excess[v] += x;
			if (v != fg->src() && v != fg->snk()) newUnbal(v);
			if (excess[u] <= 0) return true;
		}
		nextedge[u] = fg->nextAt(u,e);
	}
}

/** Compute exact distance labels for vertices.
 *  On return, the vector d[] contains distance labels for all vertices
 */
void prePush::initdist() {
	vertex u,v; edge e;
	List queue(fg->n());

	newDistCount++;
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

/** Find smallest label at a "reachable" neighbor
 *  @param u is a vertex
 *  @return the smallest label at a neighbor v of u for which (u,v) has
 *  positive residual capacity
 */
int prePush::minlabel(vertex u) {
	int small; edge e;

	small = 2*fg->n();
	for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e))
		if (fg->res(u,e) > 0)
			small = min(small,d[fg->mate(u,e)]);
	return small;
}

/** Compute the value of the flow.
 *  @return the total flow leaving the source
 */
int prePush::flowValue() {
	int fv = 0; vertex s = fg->src();
        for (edge e = fg->firstAt(s); e != 0; e = fg->nextAt(s,e))
		fv += fg->f(s,e);
	return fv;
}
