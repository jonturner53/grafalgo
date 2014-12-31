/** @file testSpt.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wdigraph.h"

namespace grafalgo {
extern bool dijkstra(Wdigraph&, vertex, edge*, edgeLength*);
extern bool bfScan(Wdigraph&, vertex, edge*, edgeLength*);
}

using namespace grafalgo;

bool checkSpt(Wdigraph&, vertex, edge*, edgeLength*);

/** usage: testSpt method [src] [ show verify ]
 * 
 *  testSpt reads a graph from stdin, computes a shortest path tree (from src)
 *  using the method specified by the argument; src is a vertex number;
 *  if omitted, vertex 1 is used as the source
 *
 *  The total length of the edges in the shortest path tree are printed.
 * 
 *  If the show argument is present (the string "show"), the graph is output,
 *  along with the vertex distances and the edges in the tree.
 * 
 *  If the verify argument is present (the string "verify), the tree is
 *  checked for correctness, potentially producing error messages
 */
int main(int argc, char *argv[]) {
	Wdigraph dig; cin >> dig;
	
	if (argc < 2)
		Util::fatal("usage: spt method [src] [show verify]");
	vertex s = 1;
	if (argc >= 3 && sscanf(argv[2],"%d",&s) != 1) s = 1;

	edge pEdge[dig.n()+1]; edgeLength d[dig.n()+1];

	if (strcmp(argv[1],"dijkstra") == 0)
		dijkstra(dig,s,pEdge,d);
	else if (strcmp(argv[1],"bfScan") == 0)
		bfScan(dig,s,pEdge,d);
	else
		Util::fatal("spt: undefined method");

	edgeLength sum = 0;
	for (vertex u = 1; u <= dig.n(); u++) sum += d[u];
	cout << "distance sum is " << sum << endl;

	bool show = false; bool verify = false;
	for (int i = 2; i < argc; i++) {
		if (strcmp(argv[i],"show") == 0) show = true;
		else if (strcmp(argv[i],"verify") == 0) verify = true;
	}

	if (show) {
		cout << dig << endl;
		for (vertex u = 1; u <= dig.n(); u++)
			cout << d[u] << " ";
		cout << endl;
		for (vertex u = 1; u <= dig.n(); u++)
			if (u != s) cout << dig.edge2string(pEdge[u]) << " ";
		cout << endl;
	}

	if (verify) checkSpt(dig, s, pEdge, d);
}

/** Verify a shortest path tree.
 *  @param dig is a directed graph
 *  @param s is the source vertex
 *  @param pEdge is an array of edges that defines the shortest path tree;
 *  specifically, pEdge[u] is the edge from the parent of u in the tree
 *  @param d is an array of shortest path distances from the source;
 *  that is, d[u] is the distance from the source to u
 *  @return true if sptree is a shortest path tree
 */
bool checkSpt(Wdigraph& dig, vertex s, edge* pEdge, edgeLength* d) {
	bool status = true;
	// source checks
	if (s < 0 || s > dig.n()) {
		cout << "invalid source vertex " << s << endl;
		return false;
	}
	if (s != 0 && (d[s] != 0 || pEdge[s] != 0)) {
		cout << "source vertex error\n";
		return false;
	}

	// basic validity tests for pEdge
	for (vertex u = 1; u <= dig.n(); u++) {
		edge e = pEdge[u];
		if (e == 0 && u == s) continue;
		if (!dig.validEdge(e)) {
			cout << "pEdge[" << dig.index2string(u) << "]=" << e
			     << " is not a valid edge number\n";
			return false;
		}
		if (dig.head(e) != u) {
			cout << "pEdge[" << dig.index2string(u) << "]="
			     << dig.edge2string(e) << " does not point to "
			     << dig.index2string(u) << endl;
			return false;
		}
	}

	// verify that pEdge paths lead back to s and that reported
	// distances match path lengths
	for (vertex u = 1; u <= dig.n(); u++) {
		if (u == s) continue;
		int cnt = 0; vertex v; edgeLength plen = 0;
		for (v = u; pEdge[v] != 0; v = dig.tail(pEdge[v])) {
			if (cnt++ > dig.n()) {
				cout << "detected cycle in parent pointers "
				        "starting from " << dig.index2string(u)
				     << endl;
				return false;
			}
			plen += dig.length(pEdge[v]);
		}
		if (v != s) {
			if (s != 0) {
				cout << "parent pointers from " << u 
			     	<< " led to vertex " << v << " not the source";
				return false;
			}
			if (d[v] != 0) {
				cout << "tree root " << dig.index2string(u)
				     << " has non-zero distance " << d[u]
				     << endl;
				status = false;
			}
		}
		if (plen != d[u]) {
			cout << "d[" << dig.index2string(u) << "]=" << d[u]
			     << " but path length is " << plen << endl;
			status = false;
		}
	}

	// verify shortest path tree condition for all edges
	for (edge e = dig.first(); e != 0; e = dig.next(e)) {
		vertex u = dig.tail(e); vertex v = dig.head(e);
		if (d[v] > d[u] + dig.length(e)) {
			cout << "edge " << dig.edge2string(e) << " violates "
			        "shortest path tree condition\n";
			status = false;
		}
	}
	return status;
}
