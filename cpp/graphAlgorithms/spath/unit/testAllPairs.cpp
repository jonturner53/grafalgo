/** @file testAllPairs.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wdigraph.h"

namespace grafalgo {
extern bool edmondsKarp(Wdigraph&, edgeLength**, edge**);
extern bool floyd(Wdigraph&, edgeLength**, vertex**); 
}

using namespace grafalgo;

/** usage: testAllPairs method
 *  
 *  Allpairs reads a graph from stdin, computes a solution to the all pairs
 *  shortest path problem using the specified method and prints the result.
 *  The method argument may be edmondsKarp or floyd
 *  
 *  In all cases, the graph and the array of shortest path distances
 *  are output. For Floyd's algorithm, a "midpoint" array representing
 *  the shortest paths is also output. For the Edmonds-Karp algorithm, the
 *  shortest path trees are output, using the "parent-pointer" representation.
 */
int main(int argc, char *argv[]) {
	vertex u, v;
	Wdigraph g; cin >> g; cout << "\n" << g << "\n";
	
	if (argc != 2) Util::fatal("usage: allPairs method");

	if (strcmp(argv[1],"floyd") == 0) {
		int** dist = new int*[g.n()+1];
		vertex** mid = new vertex*[g.n()+1];
		for (u = 1; u <= g.n(); u++) {
			dist[u] = new int[g.n()+1]; 
			mid[u] = new vertex[g.n()+1];
		}
	
		if (!floyd(g,dist,mid)) 
			Util::fatal("detected negative cycle");
	
		cout << "distances\n\n    ";
		for (v = 1; v <= g.n(); v++) {
			cout << setw(2) << g.index2string(v) << " ";
		}
		printf("\n");
		for (u = 1; u <= g.n(); u++) {
			cout << setw(2) << g.index2string(u) << ": ";
			for (v = 1; v <= g.n(); v++) {
				cout << setw(2) << dist[u][v] << " ";
			}
			cout << endl;
		}
		cout << "\n\nmidpoint array\n\n    ";
		for (v = 1; v <= g.n(); v++)  {
			cout << setw(2) << g.index2string(v) << " ";
		}
		cout << endl;
		for (u = 1; u <= g.n(); u++) {
			cout << setw(2) << g.index2string(u) << ": ";
			for (v = 1; v <= g.n(); v++) {
				cout << setw(2) << g.index2string(mid[u][v])
				     << " ";
			}
			cout << endl;
		}
	
	} else if (strcmp(argv[1],"edmondsKarp") == 0) {
		int** dist = new int*[g.n()+1];
		edge** pEdge = new edge*[g.n()+1];
		for (u = 1; u <= g.n(); u++) {
			dist[u] = new int[g.n()+1];
			pEdge[u] = new edge[g.n()+1];
		}

		if (!edmondsKarp(g,dist,pEdge)) 
			Util::fatal("detected negative cycle or unreachable "
				    "vertices");
	
		cout << "distances\n\n    ";
		for (v = 1; v <= g.n(); v++) {
			cout << setw(2) << g.index2string(v) << " ";
		}
		cout << endl;
	        for (u = 1; u <= g.n(); u++) {
			cout << setw(2) << g.index2string(u) << ": ";
	                for (v = 1; v <= g.n(); v++) {
				cout << setw(2) << dist[u][v] << " ";
	                }
			cout << endl;
	        }
	
		cout << "\n\nshortest path trees\n\n    ";
	        for (v = 1; v <= g.n(); v++)  {
			cout << setw(2) << g.index2string(v) << " ";
	        }
		cout << endl;
		for (u = 1; u <= g.n(); u++) {
			cout << setw(2) << g.index2string(u) << ": ";
			for (v = 1; v <= g.n(); v++) {
				cout << setw(2) 
				     << g.index2string(g.tail(pEdge[u][v]))
				     << " ";
			}
			cout << endl;
		}
	} else {
		Util::fatal("allPairs: undefined method");
	}
}
