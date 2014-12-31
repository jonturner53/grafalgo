/** @file testMaxFlo.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Flograph.h"
#include "Mflograph.h"
#include "maxCap.h"
#include "capScale.h"
#include "shortPath.h"
#include "dinic.h"
#include "dinicDtrees.h"
#include "prePush.h"
#include "ppFifo.h"
#include "ppHiLab.h"

namespace grafalgo {
extern bool maxFloMin(Mflograph&, string);
}

using namespace grafalgo;

bool checkMaxFlo(Flograph&);
bool checkMaxFloMin(Mflograph&);

/** usage: testMaxFlo method [ show verify ]
 * 
 *  TestMaxFlo reads a flograph from stdin, computes a maximum flow
 *  using the method specified by the argument and then prints the
 *  flograph with the max flow.
 *
 *  The method can be one of shortPath, maxCap, capScale, dinic,
 *  dinicDtrees, ppFifo, ppFifoBatch, ppHiLab or ppHiLabBatch.
 * 
 *  If the show argument is present (the string "show"), the flograph
 *  is printed along with the final flow. If the verify argument is present,
 *  the final flow is checked for correctness.
 */ 
int main(int argc, char *argv[]) {
	if (argc < 2) Util::fatal("usage: maxFlo method [ show verify ]");

	bool show = false; bool verify = false;
	for (int i = 2; i < argc; i++) {
		     if (strcmp(argv[i],"show") == 0) show = true;
		else if (strcmp(argv[i],"verify") == 0) verify = true;
	}

	if (strcmp(argv[1],"maxCap") == 0) {
		Flograph fg; cin >> fg;
		(maxCap(fg)); // parens added to resolve ambiguity
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"capScale") == 0) {
		Flograph fg; cin >> fg;
		(capScale(fg));
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"shortPath") == 0) {
		Flograph fg; cin >> fg;
		(shortPath(fg));
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"dinic") == 0) {
		Flograph fg; cin >> fg;
		(dinic(fg));
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"dinicDtrees") == 0) {
		Flograph fg; cin >> fg;
		(dinicDtrees(fg));
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"ppFifo") == 0) {
		Flograph fg; cin >> fg;
		ppFifo(fg,false);
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"ppFifoBatch") == 0) {
		Flograph fg; cin >> fg;
		ppFifo(fg,true);
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"ppHiLab") == 0) {
		Flograph fg; cin >> fg;
		ppHiLab(fg,false);
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"ppHiLabBatch") == 0) {
		Flograph fg; cin >> fg;
		ppHiLab(fg,true);
		cout << "total flow of " << fg.totalFlow() << endl;
		if (show) cout << fg << endl;
		if (verify) checkMaxFlo(fg);
	} else if (strcmp(argv[1],"maxFloMin") == 0) {
		Mflograph mfg; cin >> mfg;
		if (maxFloMin(mfg,string("ppFifo"))) {
			cout << "total flow of " << mfg.totalFlow() << endl;
			if (show) cout << mfg << endl;
			if (verify) checkMaxFloMin(mfg);
		} else {
			cout << "could not satisfy min flow constraints\n";
		}
	} else if (strcmp(argv[1],"maxFloMinDinic") == 0) {
		Mflograph mfg; cin >> mfg;
		if (maxFloMin(mfg,string("dinic"))) {
			cout << "total flow of " << mfg.totalFlow() << endl;
			if (show) cout << mfg << endl;
			if (verify) checkMaxFloMin(mfg);
		} else {
			cout << "could not satisfy min flow constraints\n";
		}
	} else {
		Util::fatal("maxFlo: undefined method");
	}
}

bool checkMaxFlo(Flograph& fg) {
	vertex u,v; edge e; int sum;

	// verify that capacity constraints are respected
	for (e = fg.first(); e != 0; e = fg.next(e)) {
		u = fg.tail(e); v = fg.head(e);
		if (fg.f(u,e) < 0)
			cout << "Negative flow on edge " 
			     << e << "=" << fg.edge2string(e) << endl;
		if (fg.f(u,e) > fg.cap(u,e))
			cout << "Flow exceeds capacity on edge "
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
	if (d[fg.snk()] < fg.n()) cout << "Not a maximum flow\n";
	delete [] d;
	return true;
}

bool checkMaxFloMin(Mflograph &fg) {
	vertex u,v; edge e;

	// verify that min flow requirements are respected
	for (e = fg.first(); e != 0; e = fg.next(e)) {
		u = fg.tail(e); v = fg.head(e);
		if (fg.f(u,e) < fg.minFlo(e))
			cout << "Flow less than min flow requirement on edge "
			     << e << "=" << fg.edge2string(e) << endl;
	}

	return checkMaxFlo(fg);
/*
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
*/
	return true;
}
