/** @file augPath.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Adt.h"
#include "augPath.h"

namespace grafalgo {

/** Find maximum flow in a flow graph.
 *  Base class constructor initializes dynamic data common to all algorithms.
 *  Derived class constructors define local data then invoke main routine.
 */
augPath::augPath(Flograph& fg1) : fg(&fg1) {
	pEdge = new edge[fg->n()+1];
}

augPath::~augPath() { delete [] pEdge; }

/** Main routine for all augmenting path variants.
 *  @return the maximum flow value
 */
int augPath::main() {
	int flo = 0;
	while (findPath()) flo += augment();
	return flo;
}

/** Saturate the augmenting path defined by the pEdge array. */
int augPath::augment() {
	vertex u, v; edge e; flow f;

	// determine residual capacity of path
	f = INT_MAX;
	v = fg->snk(); e = pEdge[v];
	while (v != fg->src()) {
		u = fg->mate(v,e);
		f = min(f,fg->res(u,e));
		v = u; e = pEdge[v];
	}
	// add flow to saturate path
	v = fg->snk(); e = pEdge[v];
	while (v != fg->src()) {
		u = fg->mate(v,e);
		fg->addFlow(u,e,f);
		v = u; e = pEdge[v];
	}
	return f;
}

} // ends namespace grafalgo
