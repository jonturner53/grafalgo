/** @file augPath.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Adt.h"
#include "augPath.h"

using namespace grafalgo;

/** Find maximum flow in a flow graph.
 *  Base class constructor initializes dynamic data common to all algorithms.
 *  Constructors for derived classes actually implement specific algorithms.
 *  @param fg1 is a reference to the graph on which we're finding a max flow.
 *  @param flow_value is a reference to an integer in which the flow value
 *  is returned.
 */
augPath::augPath(Flograph& fg1, int& flow_value) : fg(&fg1) {
	pEdge = new edge[fg->n()+1];
}

augPath::~augPath() { delete [] pEdge; }

/** Saturate the current augmenting path.
 *  The pedge array defines a tree that includes a source/sink path.
 *  @return the amount of flow added to the augmenting path.
 */
int augPath::augment() {
	vertex u, v; edge e; flow f;

	// determine residual capacity of path
	f = Util::BIGINT32;
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
