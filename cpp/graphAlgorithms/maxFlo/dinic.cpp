#include "dinic.h"


dinic::dinic(Flograph& fg1, int& floVal) : augPath(fg1,floVal) {
        level = new int[fg->n()+1];
        nextEdge = new edge[fg->n()+1];

	floVal = 0;
        while (newPhase()) {
        	while (findPath(fg->src())) floVal += augment();
        }
	delete [] level; delete [] nextEdge;
}

dinic::dinic(Flograph& fg1, int& floVal, string& stats) : augPath(fg1,floVal) {
        level = new int[fg->n()+1];
        nextEdge = new edge[fg->n()+1];

	floVal = 0;
	numPhase = 0; numPaths = 0; avgPathLength = 0;
	phaseTime = 0; pathTime = 0;
	uint32_t t1, t2, t3;
	t1 = Util::getTime();
        while (newPhase()) {
		t2 = Util::getTime(); phaseTime += (t2-t1);
		numPhase++;
        	while (findPath(fg->src())) {
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

	delete [] level; delete [] nextEdge;
}

bool dinic::newPhase() {
// Prepare for new phase. Return true if there is a source/sink path.
	vertex u,v; edge e;
	UiList q(fg->n());

	for (u = 1; u <= fg->n(); u++) {
		level[u] = fg->n(); nextEdge[u] = fg->firstAt(u);
	}
	q.addLast(fg->src()); level[fg->src()] = 0;
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && level[v] == fg->n()) {
				level[v] = level[u] + 1; 
				if (v == fg->snk()) return true;
				q.addLast(v);
			}
		}
	}
	return false;
}

bool dinic::findPath(vertex u) {
// Find a shortest path with unused residual capacity.
        vertex v; edge e;

	for (e = nextEdge[u]; e != 0; e = fg->nextAt(u,e)) {
		v = fg->mate(u,e);
		if (fg->res(u,e) == 0 || level[v] != level[u] + 1) continue;
		if (v == fg->snk() || findPath(v)) {
			pEdge[v] = e; nextEdge[u] = e; return true;
		}
	}
	nextEdge[u] = Null; return false;
}
