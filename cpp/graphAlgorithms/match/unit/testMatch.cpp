/** @file testMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Dlist.h"
#include "Wgraph.h"
#include "hopcroftKarp.h"
#include "hungarian.h"
#include "edmondsGabow.h"
#include "fastEdmondsGabow.h"
#include "edmondsGMGbi.h"
#include "maxdMatch.h"
#include "fastMaxdMatch.h"

namespace grafalgo {
extern bool findSplit(const Graph&, ListPair&);
extern void flowMatch(Graph&, Glist<edge>&);
extern void flowMatchWt(Wgraph&, Glist<edge>&);
}

using namespace grafalgo;

bool checkMatch(Graph&, Glist<edge>&);
bool checkMatch(Wgraph&, Glist<edge>&);

/** usage: testMatch method
 * 
 *  TestMatch reads a graph from stdin, computes a matching
 *  using the method specified by the argument and then prints the
 *  resulting matching.
 * 
 *  Methods currently implemented include hopcroftKarp (bipartite/unweighted),
 *  hungarian (bipartite/weighted), edmondsGabow (general/unweighted),
 *  fastEdmondsGabow (general/unweighted), edmondsGMGbi (bipartite/weighted),
 *  maxdMatch (bipartite/unweighted), fastMaxdMatch (bipartite/unweighted)
 */
int main(int argc, char *argv[]) {
	if (argc < 2) Util::fatal("usage: match method");

	bool show = false; bool verify = false;
	for (int i = 2; i < argc; i++) {
		     if (strcmp(argv[i],"show") == 0) show = true;
		else if (strcmp(argv[i],"verify") == 0) verify = true;
	}

	if (strcmp(argv[1],"flowMatch") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		flowMatch(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"hopcroftKarp") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		hopcroftKarp(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"flowMatchWt") == 0) {
		Wgraph g; cin >> g; Glist<edge> match(g.n()/2);
		flowMatchWt(g,match);
		int size = match.length();
		edgeWeight totalWeight = g.weight(match);
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"hungarian") == 0) {
		Wgraph g; cin >> g; Glist<edge> match(g.n()/2);
		hungarian(g,match);
		int size = match.length();
		edgeWeight totalWeight = g.weight(match);
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"edmondsGabow") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		edmondsGabow(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"fastEdmondsGabow") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		fastEdmondsGabow(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"edmondsGMGbi") == 0) {
		Wgraph g; cin >> g; Glist<edge> match(g.n()/2);
		edmondsGMGbi(g,match);
		int size = match.length();
		edgeWeight totalWeight = g.weight(match);
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"maxdMatch") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		maxdMatch(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else if (strcmp(argv[1],"fastMaxdMatch") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		fastMaxdMatch(g,match);
		int size = match.length();
		cout << size << " edges in matching\n";
		if (show) cout << g << "[" << g.elist2string(match) << "]\n";
		if (verify) checkMatch(g,match);
	} else { 
		Util::fatal("match: invalid method");
	}
}

/** Verify a matching in a graph
 *  @param g is a graph
 *  @param match is a list of edges in g
 *  @return true if match is a valid maximal matching of g;
 *  does not verify maximum size, just maximality
 */
bool checkMatch(Graph& g, Glist<edge>& match) {
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
bool checkMatch(Wgraph& g, Glist<edge>& match) {
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
