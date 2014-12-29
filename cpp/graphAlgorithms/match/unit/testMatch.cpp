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

extern void flowMatch(Graph&, Glist<edge>&);
extern void flowMatchWt(Wgraph&, Glist<edge>&);

using namespace grafalgo;

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
	if (argc != 2) Util::fatal("usage: match method");

	if (strcmp(argv[1],"flowMatch") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		flowMatch(g,match);
		int size = match.length();
		if (size <= 30)
			cout << g << "[" << g.elist2string(match) << "]\n";
		cout << size << " edges in matching\n";
	} else if (strcmp(argv[1],"hopcroftKarp") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		hopcroftKarp(g,match);
		int size = match.length();
		if (size <= 30)
			cout << g << "[" << g.elist2string(match) << "]\n";
		cout << size << " edges in matching\n";
	} else if (strcmp(argv[1],"flowMatchWt") == 0) {
		Wgraph wg; cin >> wg; Glist<edge> match(wg.n()/2);
		flowMatchWt(wg,match);
		int size = match.length();
		edgeWeight totalWeight = wg.weight(match);
		if (size <= 30)
			cout << wg << "[" << wg.elist2string(match) << "]\n";
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
	} else if (strcmp(argv[1],"hungarian") == 0) {
		Wgraph wg; cin >> wg; Glist<edge> match(wg.n()/2);
		hungarian(wg,match);
		int size = match.length();
		edgeWeight totalWeight = wg.weight(match);
		if (size <= 30)
			cout << wg << "[" << wg.elist2string(match) << "]\n";
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
	} else if (strcmp(argv[1],"edmondsGabow") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		edmondsGabow(g,match);
		int size = match.length();
		if (size <= 30)
			cout << g << "[" << g.elist2string(match) << "]\n";
		cout << size << " edges in matching\n";
	} else if (strcmp(argv[1],"fastEdmondsGabow") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		fastEdmondsGabow(g,match);
		int size = match.length();
		if (size <= 30)
			cout << g << "[" << g.elist2string(match) << "]\n";
		cout << size << " edges in matching\n";
	} else if (strcmp(argv[1],"edmondsGMGbi") == 0) {
		Wgraph wg; cin >> wg; Glist<edge> match(wg.n()/2);
		edmondsGMGbi(wg,match);
		int size = match.length();
		edgeWeight totalWeight = wg.weight(match);
		if (size <= 30)
			cout << wg << "[" << wg.elist2string(match) << "]\n";
		cout << size << " edges in matching with total weight "
		     << totalWeight << "\n";
	} else if (strcmp(argv[1],"maxdMatch") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		maxdMatch(g,match);
		int size = match.length();
		if (size <= 30)
			cout << g << "[" << g.elist2string(match) << "]\n";
		cout << size << " edges in matching\n";
	} else if (strcmp(argv[1],"fastMaxdMatch") == 0) {
		Graph g; cin >> g; Glist<edge> match(g.n()/2);
		fastMaxdMatch(g,match);
		int size = match.length();
		if (size <= 30)
			cout << g << "[" << g.elist2string(match) << "]\n";
		cout << size << " edges in matching\n";
	} else { 
		Util::fatal("match: invalid method");
	}
}
