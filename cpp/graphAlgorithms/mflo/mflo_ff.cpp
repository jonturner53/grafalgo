/** @file mflo_ff.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Adt.h"
#include "mflo_ff.h"

namespace grafalgo {

/** Find maximum flow in a flow graph.
 *  Base class constructor initializes dynamic data common to all algorithms.
 *  Derived class constructors define local data then invoke main routine.
 */
mflo_ff::mflo_ff(Graph_f& g1) : g(&g1) {
	pEdge = new edge[g->n()+1];
}

mflo_ff::~mflo_ff() { delete [] pEdge; }

/** Main routine for all augmenting path variants.
 *  @return the maximum flow value
 */
int mflo_ff::main() {
	int flo = 0;
	while (findPath()) flo += augment();
	return flo;
}

/** Saturate the augmenting path defined by the pEdge array. */
int mflo_ff::augment() {
	vertex u, v; edge e; flow f;

	// determine residual capacity of path
	f = INT_MAX;
	v = g->snk(); e = pEdge[v];
	while (v != g->src()) {
		u = g->mate(v,e);
		f = min(f,g->res(u,e));
		v = u; e = pEdge[v];
	}
	// add flow to saturate path
	v = g->snk(); e = pEdge[v];
	while (v != g->src()) {
		u = g->mate(v,e);
		g->addFlow(u,e,f);
		v = u; e = pEdge[v];
	}
	return f;
}

} // ends namespace grafalgo
