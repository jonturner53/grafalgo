#include "dinicDtrees.h"

dinicDtrees::dinicDtrees(Flograph& fg1, int& floVal) : fg(&fg1) {
	level  = new int[fg->n()+1]; nextEdge = new int[fg->n()+1];
	upEdge = new int[fg->n()+1]; dt = new Dtrees(fg->n());

	for (vertex u = 1; u <= fg->n(); u++) {
		dt->addcost(u,Util::BIGINT32);
		level[u] = nextEdge[u] = upEdge[u] = 0;
	}

	floVal = 0;
        while (newPhase()) {
                while (findPath()) floVal += augment();
        }
	delete [] level; delete[] upEdge; delete [] nextEdge; delete dt;
}

dinicDtrees::dinicDtrees(Flograph& fg1, int& floVal, string& stats) : fg(&fg1) {
	level  = new int[fg->n()+1]; nextEdge = new int[fg->n()+1];
	upEdge = new int[fg->n()+1]; dt = new Dtrees(fg->n());

	for (vertex u = 1; u <= fg->n(); u++) {
		dt->addcost(u,Util::BIGINT32);
		level[u] = nextEdge[u] = upEdge[u] = 0;
	}

	floVal = 0;
	numPhase = numPaths = 0; avgPathLength = 0; phaseTime = pathTime = 0;
	uint32_t t1, t2, t3;
	t1 = Util::getTime();
        while (newPhase()) {
		t2 = Util::getTime(); phaseTime += (t2-t1);
		numPhase++;
                while (findPath()) {
			t3 = Util::getTime(); pathTime += (t3-t2);
			numPaths++; avgPathLength += level[fg->snk()];

                        floVal += augment();
			t2 = Util::getTime();
                }
		t3 = Util::getTime(); pathTime += (t3-t2);
		t1 = Util::getTime();
        }
	t2 = Util::getTime(); phaseTime += (t2-t1);
	avgPathLength /= numPaths;
	stringstream ss;
	ss << numPhase << " " << numPaths << " " << avgPathLength
	   << " " << phaseTime << " " << pathTime;
	stats = ss.str();

	delete [] level; delete[] upEdge; delete [] nextEdge; delete dt;
}

bool dinicDtrees::findPath() {
// Find an augmenting path.
        vertex u, v; edge e;

	while (nextEdge[fg->src()] != 0) {
		u = dt->findroot(fg->src()); e = nextEdge[u];
		while (1) { // look for forward path
			if (u == fg->snk()) return true;
			if (e == 0) { nextEdge[u] = 0; break; }
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && level[v] == level[u] + 1
			    && nextEdge[v] != 0) {
				dt->addcost(u,fg->res(u,e) - dt->nodeCost(u));
				dt->link(u,v); upEdge[u] = e;
				nextEdge[u] = e;
				u = dt->findroot(fg->src()); e = nextEdge[u];
			} else {
				e = fg->nextAt(u,e);
			}
		}
		// prune dead-end
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (u != dt->parent(v) || e != upEdge[v]) continue;
			dt->cut(v); upEdge[v] = 0;
			fg->addFlow(v,e,
				(fg->cap(v,e)-dt->nodeCost(v)) - fg->f(v,e));
			dt->addcost(v,Util::BIGINT32 - dt->nodeCost(v));
		}
	}
	return false;
}

int dinicDtrees::augment() {
// Add flow to the source-sink path defined by the path in the
// dynamic trees data structure
	vertex u; edge e;

	NodeCostPair p = dt->findcost(fg->src());
	int flo = p.c;
	dt->addcost(fg->src(),-flo);
	for (p = dt->findcost(fg->src()); p.c==0; p = dt->findcost(fg->src())) {
		u = p.x; e = upEdge[u];
		fg->addFlow(u,e,fg->cap(u,e) - fg->f(u,e));
		dt->cut(u);
		dt->addcost(u,Util::BIGINT32);
		upEdge[u] = 0;
	}
	return flo;
}

bool dinicDtrees::newPhase() {
// Prepare for a new phase. Return the number of edges in the source/sink
// path, or 0 if none exists.
	vertex u, v; edge e;
	List q(fg->n());
	for (u = 1; u <= fg->n(); u++) {
		nextEdge[u] = fg->firstAt(u);
		if (dt->parent(u) != 0) { // cleanup from previous phase
			e = upEdge[u];
			fg->addFlow(u,e,
				(fg->cap(u,e)-dt->nodeCost(u)) - fg->f(u,e));
			dt->cut(u);
			dt->addcost(u,Util::BIGINT32 - dt->nodeCost(u));
			upEdge[u] = 0;
		}
		level[u] = fg->n();
	}
	q.addLast(fg->src()); level[fg->src()] = 0;
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && level[v] == fg->n()) {
				level[v] = level[u] + 1; q.addLast(v);
				if (v == fg->snk()) return true;
			}
		}
	}
	return false;
}
