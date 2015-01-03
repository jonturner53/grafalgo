/** @file testMcFlo.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wflograph.h"
#include "mcfCycRed.h"
#include "mcfLcap.h"
#include "mcfScale.h"

using namespace grafalgo;

bool checkMcFlo(Wflograph&);

/** usage: testMcFlo method [ show verify ]
 * 
 *  TestMcFlo reads a Wflograph from stdin, computes a min cost maximum flow
 *  using the method specified by the argument and then prints the
 *  Wflograph with the computed flow.
 *
 *  Method is one of cycRed, lcap, mostNeg, scale
 */
int main(int argc, char *argv[]) {
	Wflograph wfg; cin >> wfg;
	
	if (argc < 2) Util::fatal("usage: mcFlo method [ show verify ]");

	if (strcmp(argv[1],"cycRed") == 0)
		(mcfCycRed(wfg));
	else if (strcmp(argv[1],"lcap") == 0)
		mcfLcap(wfg,false);
	else if (strcmp(argv[1],"mostNeg") == 0)
		mcfLcap(wfg,true);
	else if (strcmp(argv[1],"scale") == 0)
		(mcfScale(wfg));
	else
		Util::fatal("mcFlo: undefined method");

	cout << "flow value is " << wfg.totalFlow()
	     << " and flow cost is " << wfg.totalCost() << endl;
	bool show = false; bool verify = false;
	for (int i = 2; i < argc; i++) {
		     if (strcmp(argv[i],"show") == 0) show = true;
		else if (strcmp(argv[i],"verify") == 0) verify = true;
	}
	if (show) cout << wfg << endl;
	if (verify) checkMcFlo(wfg);
}

bool checkMcFlo(Wflograph& wfg) {
	vertex u,v,w; edge e; int s;

	// Check that capacity constraints are respected.
	for (e = wfg.first(); e != 0; e = wfg.next(e)) {
		u = wfg.tail(e); v = wfg.head(e);
		if (wfg.f(u,e) < 0)
			printf("Negative flow on edge %d=(%d,%d)\n",e,u,v);
		if (wfg.f(u,e) > wfg.cap(u,e))
			printf("Flow exceeds capacity on edge %d=(%d,%d)\n",
				e,u,v);
	}

	// Make sure each vertex is balanced.
	for (u = 1; u <= wfg.n(); u++) { 
		if (u == wfg.src() || u == wfg.snk()) continue;
		s = 0;
		for (e = wfg.firstAt(u); e != 0; e = wfg.nextAt(u,e)) {
			if (u == wfg.head(e))
				s += wfg.f(wfg.tail(e),e);
			else
				s -= wfg.f(u,e);
		}
		if (s != 0)
			printf("Vertex %d is not balanced\n",u);
	}

	// Check that there is no augmenting path.
	int *d = new int[wfg.n()+1];
	for (u = 1; u <= wfg.n(); u++) d[u] = wfg.n();
	d[wfg.src()] = 0;
	List q(wfg.n()); q.addLast(wfg.src());
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = wfg.firstAt(u); e != 0; e = wfg.nextAt(u,e)) {
			v = wfg.mate(u,e);
			if (wfg.res(u,e) > 0 && d[v] > d[u] + 1) {
				d[v] = d[u] + 1;
				q.addLast(v);
			}
		}
	}
	if (d[wfg.snk()] < wfg.n()) printf("Not a maximum flow\n");

	// Check that there are no negative cost cycles in residual graph.
	// Note: speed this up using bfs from pseudo-source
	int** cst = new int*[wfg.n()+1];
	for (u = 1; u <= wfg.n(); u++) {
		cst[u] = new int[wfg.n()+1];
	}
	for (u = 1; u <= wfg.n(); u++) {
		for (v = 1; v <= wfg.n(); v++) {
			if (u == v) cst[u][v] = 0;
			else cst[u][v] = INT_MAX;
		}
	}
	for (u = 1; u <= wfg.n(); u++) {
		for (e = wfg.firstAt(u); e != 0; e = wfg.nextAt(u,e)) {
			v = wfg.mate(u,e);
			if (wfg.res(u,e) > 0)
				cst[u][v] = min(cst[u][v],wfg.cost(u,e));
		}
	}
	for (v = 1; v <= wfg.n(); v++) {
		if (cst[v][v] < 0) {
			printf("Vertex %2d on a negative cost cycle\n",v);
			exit(0);
		}
		for (u = 1; u <= wfg.n(); u++) {
			for (w = 1; w <= wfg.n(); w++) {
				if (cst[u][v] != INT_MAX &&
				    cst[v][w] != INT_MAX &&
				    cst[u][w] > cst[u][v] + cst[v][w]) {
					cst[u][w] = cst[u][v] + cst[v][w];
				}
			}
		}
	}
}
