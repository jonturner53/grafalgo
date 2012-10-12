#include "augPath.h"

augPath::augPath(Flograph& fg1, int& flow_value) : fg(&fg1) {
// Find maximum flow in fg. Base class constructor initializes
// dynamic data common to all algorithms. Constructors
// for derived class actually implement algorithm.
	pEdge = new edge[fg->n()+1];
}

augPath::~augPath() { delete [] pEdge; }

int augPath::augment() {
// Saturate the augmenting path p.
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

bool augPath::findPath() {
	fatal("augPathC::findPath(): this should never be called");
}
