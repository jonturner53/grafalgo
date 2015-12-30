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
#include "matchb_gmg.h"
#include "mdmatch.h"
#include "mdmatch_f.h"
#include "p2matchb_t.h"
#include "pmatchb_hkt.h"
#include "pmatch_egt.h"

namespace grafalgo {
extern bool findSplit(const Graph&, ListPair&);
extern void matchb_f(Graph&, List_g<edge>&);
extern void matchwb_f(Graph_w&, List_g<edge>&);
}

using namespace grafalgo;

bool checkMatch(Graph&, List_g<edge>&);
bool checkMatch(Graph_w&, List_g<edge>&);
bool checkMatch(Graph&, List_d&, List_g<edge>&);

/** usage: testMatch method
 * 
 *  TestMatch reads a graph from stdin, computes a matching
 *  using the method specified by the argument and then prints the
 *  resulting matching.
 * 
 *  Methods currently implemented include matchb_hk (bipartite/unweighted),
 *  matchwb_h (bipartite/weighted), match_eg (general/unweighted),
 *  match_egf (general/unweighted), matchb_gmg (bipartite/weighted),
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

	if (strcmp(argv[1],"matchb_f") == 0) {
		Graph g; cin >> g; List_g<edge> match(g.n()/2);
		matchb_f(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"matchb_hk") == 0) {
		Graph g; cin >> g; List_g<edge> match(g.n()/2);
		matchb_hk(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"matchwb_f") == 0) {
		Graph_w g; cin >> g; List_g<edge> match(g.n()/2);
		matchwb_f(g,match);
		int size = match.length();
		edgeWeight totalWeight = g.weight(match);
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"matchwb_h") == 0) {
		Graph_w g; cin >> g; List_g<edge> match(g.n()/2);
		matchwb_h(g,match);
		int size = match.length();
		edgeWeight totalWeight = g.weight(match);
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"match_eg") == 0) {
		Graph g; cin >> g; List_g<edge> match(g.n()/2);
		match_eg(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"match_egf") == 0) {
		Graph g; cin >> g; List_g<edge> match(g.n()/2);
		match_egf(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"matchb_gmg") == 0) {
		Graph_w g; cin >> g; List_g<edge> match(g.n()/2);
		matchb_gmg(g,match);
		int size = match.length();
		edgeWeight totalWeight = g.weight(match);
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"mdmatch") == 0) {
		Graph g; cin >> g; List_g<edge> match(g.n()/2);
		mdmatch(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"mdmatch_f") == 0) {
		Graph g; cin >> g; List_g<edge> match(g.n()/2);
		mdmatch_f(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"p2matchb_t") == 0) {
		Graph g; cin >> g; List_d vset(g.n()); cin >> vset;
		List_g<edge> match(g.n()/2); 
		p2matchb_t(g, vset, match);
		int size = match.length();
		cout << size << " edges in matching, ";
		int count = 0;
		for (grafalgo::index x = match.first(); x != 0;
				     x = match.next(x)) {
			edge e = match.value(x);
			if (vset.member(g.left(e))) count++;
			if (vset.member(g.right(e))) count++;
		}
		cout << count << " vertices matched from given set\n";
			
		if (show) {
			cout << g << vset << "\n" 
			     << "[" << g.elist2string(match) << "]\n";
		}
		if (verify) checkMatch(g,vset,match);
	} else if (strcmp(argv[1],"pmatchb_hkt") == 0) {
		Graph g; cin >> g; List_d vset(g.n());
		List_g<edge> match(g.n()/2); 
		int priority[g.n()+1];
		for (vertex u = 1; u <= g.n(); u++)
			priority[u] = Util::randint(1,min(10,g.n()));
		pmatchb_hkt(g, priority, match);
		int size = match.length();
		cout << size << " edges in matching, ";
		int count[11];
		for (int i = 1; i <= 10; i++) count[i] = 0;
		for (grafalgo::index x = match.first(); x != 0;
				     x = match.next(x)) {
			edge e = match.value(x);
			count[priority[g.left(e)]]++;
			count[priority[g.right(e)]]++;
		}
		cout <<  "counts for 10 priority classes: ";
		for (int i = 1; i <= 10; i++) cout << count[i] << " ";
		cout << endl;
			
		if (show) {
			cout << g;
			for (vertex u = 1; u <= g.n(); u++)
				cout << priority[u] << " ";
			cout << "\n[" << g.elist2string(match) << "]\n";
		}
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"pmatch_egt") == 0) {
		Graph g; cin >> g; List_d vset(g.n());
		List_g<edge> match(g.n()/2); 
		int priority[g.n()+1];
		for (vertex u = 1; u <= g.n(); u++)
			priority[u] = Util::randint(1,min(10,g.n()));
		pmatch_egt(g, priority, match);
		int size = match.length();
		cout << size << " edges in matching, ";
		int count[11];
		for (int i = 1; i <= 10; i++) count[i] = 0;
		for (grafalgo::index x = match.first(); x != 0;
				     x = match.next(x)) {
			edge e = match.value(x);
			count[priority[g.left(e)]]++;
			count[priority[g.right(e)]]++;
		}
		cout <<  "counts for 10 priority classes: ";
		for (int i = 1; i <= 10; i++) cout << count[i] << " ";
		cout << endl;
			
		if (show) {
			cout << g;
			for (vertex u = 1; u <= g.n(); u++)
				cout << priority[u] << " ";
			cout << "\n[" << g.elist2string(match) << "]\n";
		}
		if (verify) checkMatch(g,match);
	} else { 
		Util::fatal("testMatch: invalid method");
	}
}

/** Verify a matching in a graph
 *  @param g is a graph
 *  @param match is a list of edges in g
 *  @return true if match is a valid maximal matching of g;
 *  does not verify maximum size, just maximality
 */
bool checkMatch(Graph& g, List_g<edge>& match) {
	bool status = true;

	// verify validity of edge numbers
	for (grafalgo::index x = match.first(); x != 0; x = match.next(x)) {
		edge e = match.value(x);
		if (!g.validEdge(e)) {
			cout << "edge number " << e << " is invalid\n";
			status = false;
		}
	}

	if (!status) return false;

	// check for multiple edges at each vertex
	bool mark[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) mark[u] = false;
	for (grafalgo::index x = match.first(); x != 0; x = match.next(x)) {
		edge e = match.value(x);
		if (mark[g.left(e)]) {
			cout << "multiple matching edges at " << g.left(e)
			     << endl;
			status = false;
		}
		if (mark[g.right(e)]) {
			cout << "multiple matching edges at " << g.right(e)
			     << endl;
			status = false;
		}
		mark[g.left(e)] = mark[g.right(e)] = true;
	}

	// verify maximality (no edge can be added directly)
	for (vertex u = 1; u <= g.n(); u++) {
		if (mark[u]) continue;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			vertex v = g.mate(u,e);
			if (!mark[v] && u < v) {
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
bool checkMatch(Graph_w& g, List_g<edge>& match) {
	bool status = true;

	// verify validity of edge numbers
	for (grafalgo::index x = match.first(); x != 0; x = match.next(x)) {
		edge e = match.value(x);
		if (!g.validEdge(e)) {
			cout << "edge number " << e << " is invalid\n";
			status = false;
		}
	}

	if (!status) return false;

	// check for multiple edges at each vertex
	bool mark[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) mark[u] = false;
	for (grafalgo::index x = match.first(); x != 0; x = match.next(x)) {
		edge e = match.value(x);
		if (mark[g.left(e)]) {
			cout << "multiple matching edges at " << g.left(e)
			     << endl;
			status = false;
		}
		if (mark[g.right(e)]) {
			cout << "multiple matching edges at " << g.right(e)
			     << endl;
			status = false;
		}
		mark[g.left(e)] = mark[g.right(e)] = true;
	}

	// verify maximality (no positive weight edge can be added directly)
	for (vertex u = 1; u <= g.n(); u++) {
		if (mark[u]) continue;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			vertex v = g.mate(u,e);
			if (!mark[v] && g.weight(e) > 0 && u < v) {
				cout << g.edge2string(e) << " can be "
					"added to matching\n";
				status = false;
			}
		}
	}
	return status;
}

/** Verify a vset matching in a graph
 *  @param g is a graph
 *  @param vset is a list of vertices in g
 *  @param match is a list of edges in g
 *  @return true if match is a valid maximal matching of g;
 *  does not verify maximum size, just maximality
 */
bool checkMatch(Graph& g, List_d& vset, List_g<edge>& match) {
	bool status = true;

	// verify validity of edge numbers
	for (grafalgo::index x = match.first(); x != 0; x = match.next(x)) {
		edge e = match.value(x);
		if (!g.validEdge(e)) {
			cout << "edge number " << e << " is invalid\n";
			status = false;
		}
	}
	if (!status) return false;

	// check validity of vset
	for (vertex u = match.first(); u != 0; u = match.next(u)) {
		if (u < 1 || u > g.n()) {
			cout << "vertex number " << u << " is invalid\n";
			status = false;
		}
	}
	if (!status) return false;

	// check for multiple edges at each vertex
	bool mark[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) mark[u] = false;
	for (grafalgo::index x = match.first(); x != 0; x = match.next(x)) {
		edge e = match.value(x);
		if (mark[g.left(e)]) {
			cout << "multiple matching edges at " << g.left(e)
			     << endl;
			status = false;
		}
		if (mark[g.right(e)]) {
			cout << "multiple matching edges at " << g.right(e)
			     << endl;
			status = false;
		}
		mark[g.left(e)] = mark[g.right(e)] = true;
	}
	// check that no more vertices in vset can be trivially matched
	for (vertex u = vset.first(); u != 0; u = vset.next(u)) {
		if (mark[u]) continue;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			if (!mark[g.mate(u,e)]) {
				cout << "vertex " << g.index2string(u)
				     << " could be matched, but is not\n";
				status = false;
			}
		}
	}

	return status;
}
