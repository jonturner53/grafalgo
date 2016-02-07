/** @file testMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "List_d.h"
#include "Graph_w.h"
#include "matchb_hk.h"
#include "matchwb_h.h"
#include "match_eg.h"
#include "match_egf.h"
#include "matchwb_egmg.h"
#include "mdmatch.h"
#include "mdmatch_f.h"
#include "pmatchb_hkt.h"
#include "pmatch_egt.h"

namespace grafalgo {
extern bool findSplit(const Graph&, ListPair&);
extern void matchb_f(const Graph&, edge*);
extern void matchwb_f(const Graph_w&, edge*);
}

using namespace grafalgo;

bool checkMatch(Graph&, edge*);
bool checkMatch(Graph_w&, edge*);
bool checkMatch(Graph&, List_d&, edge*);

/** usage: testMatch method
 * 
 *  TestMatch reads a graph from stdin, computes a matching
 *  using the method specified by the argument and then prints the
 *  resulting matching.
 * 
 *  Methods currently implemented include matchb_hk (bipartite/unweighted),
 *  matchwb_h (bipartite/weighted), match_eg (general/unweighted),
 *  match_egf (general/unweighted), matchwb_egmg (bipartite/weighted),
 *  mdmatch (bipartite/unweighted), mdmatch_f (bipartite/unweighted)
 *  pmatchb_hkt (bipartite/unweighted), pmatch_egt (general/unweighted)
 */
int main(int argc, char *argv[]) {
	if (argc < 2) Util::fatal("usage: testMatch method");

	bool show = false; bool verify = false;
	for (int i = 2; i < argc; i++) {
		     if (strcmp(argv[i],"show") == 0) show = true;
		else if (strcmp(argv[i],"verify") == 0) verify = true;
	}

	Graph g; Graph_w wg; edge *mEdge; int *priority;
	if (strncmp(argv[1],"matchw",6) == 0) {
		cin >> wg; 
		mEdge = new edge[wg.n()+1];
		for (vertex u = 1; u <= wg.n(); u++) mEdge[u] = 0;
	} else if (strncmp(argv[1],"match",5) == 0) {
		cin >> g; 
		mEdge = new edge[g.n()+1];
		for (vertex u = 1; u <= g.n(); u++) mEdge[u] = 0;
	} else if (strncmp(argv[1],"pmatch",6) == 0) {
		cin >> g;
		mEdge = new edge[g.n()+1];
		for (vertex u = 1; u <= g.n(); u++) mEdge[u] = 0;
		priority = new int[g.n()+1];
		for (vertex u = 1; u <= g.n(); u++)
			priority[u] = Util::randint(1,min(10,g.n()));
	}
	if (strcmp(argv[1],"matchb_f") == 0) {
		matchb_f(g,mEdge);
	} else if (strcmp(argv[1],"matchb_hk") == 0) {
		matchb_hk(g,mEdge);
	} else if (strcmp(argv[1],"matchwb_f") == 0) {
		matchwb_f(wg,mEdge);
	} else if (strcmp(argv[1],"matchwb_h") == 0) {
		matchwb_h(wg,mEdge);
	} else if (strcmp(argv[1],"match_eg") == 0) {
		match_eg(g,mEdge);
	} else if (strcmp(argv[1],"match_egf") == 0) {
		match_egf(g,mEdge);
	} else if (strcmp(argv[1],"matchwb_egmg") == 0) {
		matchwb_egmg(wg,mEdge);
	} else if (strcmp(argv[1],"mdmatch") == 0) {
		mdmatch(g,mEdge);
	} else if (strcmp(argv[1],"mdmatch_f") == 0) {
		mdmatch_f(g,mEdge);
	} else if (strcmp(argv[1],"pmatchb_hkt") == 0) {
		pmatchb_hkt(g, priority, mEdge);
	} else if (strcmp(argv[1],"pmatch_egt") == 0) {
		pmatch_egt(g, priority, mEdge);
	} else { 
		Util::fatal("testMatch: invalid method");
	}
	if (strncmp(argv[1],"matchw",6) == 0) {
		int size = 0; int wt = 0;
		for (vertex u = 1; u <= wg.n(); u++) {
			if (mEdge[u] != 0) {
				size++; wt += wg.weight(mEdge[u]);
			}
		}
		cout << size/2 << " edges in matching with total weight "
		     << wt/2 << "\n";
		if (show) {
			cout << wg << "[";
			for (vertex u = 1; u <= wg.n(); u++) {
				edge e = mEdge[u];
				if (e != 0 && u < g.mate(u,e)) {
					if (u > 1) cout << " ";
					cout << g.edge2string(e);
				}
			}
		}
		if (verify) checkMatch(wg,mEdge);
	} else if (strncmp(argv[1],"match",5) == 0) {
		int size = 0;
		for (vertex u = 1; u <= g.n(); u++)
			if (mEdge[u] != 0) size++;
		size /= 2;
		cout << size << " edges in matching\n";
		if (show) {
			cout << g << "[";
			for (vertex u = 1; u <= g.n(); u++) {
				edge e = mEdge[u];
				if (e != 0 && u < g.mate(u,e)) {
					if (u > 1) cout << " ";
					cout << g.edge2string(e);
				}
			}
			cout << "]\n";
		}
		if (verify) checkMatch(g,mEdge);
	} else if (strncmp(argv[1],"pmatch",6) == 0) {
		int size = 0; int count[11];
		for (int i = 1; i <= 10; i++) count[i] = 0;
		for (vertex u = 1; u <= g.n(); u++) {
			edge e = mEdge[u];
			if (e != 0) {
				size++;
				count[priority[g.left(e)]]++;
				count[priority[g.right(e)]]++;
			}
		}
		size /= 2;
		cout << size << " edges in matching, ";
		cout <<  "counts for 10 priority classes: ";
		for (int i = 1; i <= 10; i++) cout << count[i]/2 << " ";
		cout << endl;
			
		if (show) {
			cout << g;
			for (vertex u = 1; u <= g.n(); u++)
				cout << priority[u] << " ";
			cout << "\n[";
			for (vertex u = 1; u <= g.n(); u++) {
				edge e = mEdge[u];
				if (e != 0 && u < g.mate(u,e)) {
					if (u > 1) cout << " ";
					cout << g.edge2string(e);
				}
			}
			cout << "]\n";
		}
		if (verify) checkMatch(g,mEdge);
	}
}

/** Verify a matching in a graph
 *  @param[in] g is a graph
 *  @param[in,out] mEdge[u] is the matching edge incident to u or 0 if u
 *  is unmatched
 *  @return true if match is a valid maximal matching of g;
 *  does not verify maximum size, just maximality
 */
bool checkMatch(Graph& g, edge *mEdge) {
	bool status = true;

	// verify validity of edge numbers
	for (vertex u = 1; u <= g.n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && !g.validEdge(e)) {
			cout << "edge number " << e << " is invalid\n";
			status = false;
		}
	}

	if (!status) return false;

	// check for inconsistency in mEdge values
	for (vertex u = 1; u <= g.n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && e != mEdge[g.mate(u,e)]) {
			cout << "inconsistent matching edges "
			     << g.edge2string(e) << " "
			     << g.edge2string(mEdge[g.mate(u,e)]) << endl;
			status = false;
		}
	}

	// verify maximality (no edge can be added directly)
	for (vertex u = 1; u <= g.n(); u++) {
		if (mEdge[u] != 0) continue;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			vertex v = g.mate(u,e);
			if (mEdge[v] == 0 && u < v) {
				cout << g.edge2string(e) << " can be "
					"added to matching\n";
				status = false;
			}
		}
	}
	return status;
}

/** Verify a weighted matching in a graph
 *  @param g is a weighted graph
 *  @param match is a list of edges in g
 *  @return true if match is a valid maximal matching of g;
 *  does not verify maximum size, just maximality
 */
bool checkMatch(Graph_w& g, edge *mEdge) {
	bool status = true;

	// verify validity of edge numbers
	for (vertex u = 1; u <= g.n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && !g.validEdge(e)) {
			cout << "edge number " << e << " is invalid\n";
			status = false;
		}
	}

	if (!status) return false;
	// check for inconsistency in mEdge values
	for (vertex u = 1; u <= g.n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && e != mEdge[g.mate(u,e)]) {
			cout << "inconsistent matching edges "
			     << g.edge2string(e) << " "
			     << g.edge2string(mEdge[g.mate(u,e)]) << endl;
			status = false;
		}
	}

	// verify maximality (no positive weight edge can be added directly)
	for (vertex u = 1; u <= g.n(); u++) {
		if (mEdge[u] != 0) continue;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			vertex v = g.mate(u,e);
			if (mEdge[v] == 0 && g.weight(e) > 0 && u < v) {
				cout << g.edge2string(e) << " can be "
					"added to matching\n";
				status = false;
			}
		}
	}
	return status;
}
