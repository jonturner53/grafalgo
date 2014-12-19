/** @file checkMaxFloMin.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Mflograph.h"
#include "List.h"

using namespace grafalgo;

/**
 *  usage: checkMaxFloMin
 *
 *  CheckMaxFloMin reads an Flograph from stdin, with a flow followed
 *  by a set of minimum flow requirements. It then checks
 *  that it's a legal maximum flow that respects the min flow requirements.
 *  An error message is output for each violation.
 */
int main() {
	vertex u,v; edge e; int sum;
	Mflograph fg; cin >> fg;

	// verify that capacity constraints and min flow requirements 
	// are respected
	for (e = fg.first(); e != 0; e = fg.next(e)) {
		u = fg.tail(e); v = fg.head(e); string s;
		if (fg.f(u,e) < 0)
			cout << "Negative flow on edge " 
			     << e << "=" << fg.edge2string(e) << endl;
		if (fg.f(u,e) > fg.cap(u,e))
			cout << "Flow exceeds capacity on edge "
			     << e << "=" << fg.edge2string(e) << endl;
		if (fg.f(u,e) < fg.minFlo(e))
			cout << "Flow less than min flow requirement on edge "
			     << e << "=" << fg.edge2string(e) << endl;
	}

	// verify that flow at each node is balanced
	for (u = 1; u <= fg.n(); u++) { 
		if (u == fg.src() || u == fg.snk()) continue;
		sum = 0;
		for (e = fg.firstAt(u); e != 0; e = fg.nextAt(u,e)) {
			sum -= fg.f(u,e);
		}
		if (sum != 0) cout << "Vertex " << u << " is not balanced\n";
	}

	// Verify that the flow is maximum by computing hop-count distance
	// over all edges that are not saturated. If sink ends up with a
	// distance smaller than n, then there is a path to sink with
	// non-zero residual capacity.
	int *d = new int[fg.n()+1];
	for (u = 1; u <= fg.n(); u++) d[u] = fg.n();
	d[fg.src()] = 0;
	List q(fg.n()); q.addLast(fg.src());
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = fg.firstAt(u); e != 0; e = fg.nextAt(u,e)) {
			v = fg.mate(u,e);
			if (fg.res(u,e) > 0 && d[v] > d[u] + 1) {
				d[v] = d[u] + 1; q.addLast(v);
			}
		}
	}
	if (d[fg.snk()] < fg.n()) printf("Not a maximum flow\n");
}
