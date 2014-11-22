/** @file testAllPairs.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wdigraph.h"

using namespace grafalgo;

extern void dijkstraAll(Wdigraph&, int**, vertex**);
extern void floyd(Wdigraph&, int**, vertex**); 

/** usage: testAllPairs method
 *  
 *  Allpairs reads a graph from stdin, computes a solution to the all pairs
 *  shortest path problem using the specified method and prints the result.
 *  The method argument may be dijkstra or floyd
 *  
 *  In all cases, the graph and the array of shortest path distances
 *  are output. For Floyd's algorithm, a "midpoint" array representing
 *  the shortest paths is also output. For Dijkstra's algorithm, the
 *  shortest path trees are output, using the "parent-pointer" representation.
 */
int main(int argc, char *argv[]) {
	vertex u, v;
	Wdigraph dig; cin >> dig; cout << "\n" << dig << "\n";
	
	if (argc != 2) Util::fatal("usage: allPairs method");

	if (strcmp(argv[1],"floyd") == 0) {
		int** dist = new int*[dig.n()+1];
		vertex** mid = new vertex*[dig.n()+1];
		for (u = 1; u <= dig.n(); u++) {
			dist[u] = new int[dig.n()+1]; 
			mid[u] = new vertex[dig.n()+1];
		}
	
		floyd(dig,dist,mid);
	
		cout << "distances\n\n    ";
		for (v = 1; v <= dig.n(); v++) {
			cout << setw(2) << dig.index2string(v) << " ";
		}
		printf("\n");
		for (u = 1; u <= dig.n(); u++) {
			cout << setw(2) << dig.index2string(u) << ": ";
			for (v = 1; v <= dig.n(); v++) {
				cout << setw(2) << dist[u][v] << " ";
			}
			cout << endl;
		}
		cout << "\n\nmidpoint array\n\n    ";
		for (v = 1; v <= dig.n(); v++)  {
			cout << setw(2) << dig.index2string(v) << " ";
		}
		cout << endl;
		for (u = 1; u <= dig.n(); u++) {
			cout << setw(2) << dig.index2string(u) << ": ";
			for (v = 1; v <= dig.n(); v++) {
				cout << setw(2) << dig.index2string(mid[u][v])
				     << " ";
			}
			cout << endl;
		}
	} else if (strcmp(argv[1],"dijkstra") == 0) {
		int** dist = new int*[dig.n()+1];
		vertex** parent = new vertex*[dig.n()+1];
		for (u = 1; u <= dig.n(); u++) {
			dist[u] = new int[dig.n()+1];
			parent[u] = new vertex[dig.n()+1];
		}

		dijkstraAll(dig,dist,parent);
	
		cout << "distances\n\n     ";
		for (v = 1; v <= dig.n(); v++) {
			cout << setw(2) << dig.index2string(v) << "  ";
		}
		cout << endl;
	        for (u = 1; u <= dig.n(); u++) {
			cout << setw(2) << dig.index2string(u) << ": ";
	                for (v = 1; v <= dig.n(); v++) {
				cout << setw(2) << dist[u][v] << " ";
	                }
			cout << endl;
	        }
	
		cout << "\n\nshortest path trees\n\n    ";
	        for (v = 1; v <= dig.n(); v++)  {
			cout << setw(2) << dig.index2string(v) << "  ";
	        }
		cout << endl;
		for (u = 1; u <= dig.n(); u++) {
			cout << setw(2) << dig.index2string(u) << ": ";
			for (v = 1; v <= dig.n(); v++) {
				cout << setw(2)
				     << dig.index2string(parent[u][v]) << " ";
			}
			cout << endl;
		}
	} else {
		Util::fatal("allPairs: undefined method");
	}
}
