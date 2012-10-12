// usage: allPairs method
//
// Allpairs reads a graph from stdin, computes a solution to the all pairs
// shortest path problem using the specified method and prints the result.
//

#include "stdinc.h"
#include "Wdigraph.h"

extern void dijkstraAll(Wdigraph&, int**, vertex**);
extern void floyd(Wdigraph&, int**, vertex**); 

main(int argc, char *argv[]) {
	vertex u, v; string s;
	Wdigraph dig; dig.read(cin);
	
	if (argc != 2) fatal("usage: allPairs method");

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
			cout << Util::node2string(v,dig.n(),s) << " ";
		}
		printf("\n");
		for (u = 1; u <= dig.n(); u++) {
			cout << "  " << Util::node2string(v,dig.n(),s) << ": ";
			for (v = 1; v <= dig.n(); v++) {
				cout << setw(3) << dist[u][v] << " ";
			}
			cout << endl;
		}
		cout << "\n\nmidpoint array\n\n    ";
		for (v = 1; v <= dig.n(); v++)  {
			cout << "  " << Util::node2string(v,dig.n(),s) << " ";
		}
		cout << endl;
		for (u = 1; u <= dig.n(); u++) {
			cout << " " << Util::node2string(v,dig.n(),s) << ": ";
			for (v = 1; v <= dig.n(); v++) {
				cout << setw(3) << Util::node2string(
						     mid[u][v],dig.n(),s)
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
	
		cout << "distances\n\n    ";
		for (v = 1; v <= dig.n(); v++) {
			cout << "  "<< Util::node2string(v,dig.n(),s) << " ";
		}
		cout << endl;
	        for (u = 1; u <= dig.n(); u++) {
			cout << " " << Util::node2string(v,dig.n(),s) << ": ";
	                for (v = 1; v <= dig.n(); v++) {
				cout << setw(3) << dist[u][v] << " ";
	                }
			cout << endl;
	        }
	
		cout << "\n\nshortest path trees\n\n    ";
	        for (v = 1; v <= dig.n(); v++)  {
			cout << "  " << Util::node2string(v,dig.n(),s);
	        }
		cout << endl;
		for (u = 1; u <= dig.n(); u++) {
			cout << " " << Util::node2string(v,dig.n(),s) << ": ";
			for (v = 1; v <= dig.n(); v++) {
				cout << setw(3) << Util::node2string(
						     parent[u][v],dig.n(),s)
				     << " ";
			}
			cout << endl;
		}
	} else {
		fatal("allPairs: undefined method");
	}
}
