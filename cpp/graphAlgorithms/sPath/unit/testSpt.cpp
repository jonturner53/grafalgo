/** @file testSpt.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wdigraph.h"

using namespace grafalgo;

extern void dijkstra(Wdigraph&, vertex, vertex*, int*);
extern void bfScan(Wdigraph&, vertex, vertex*, int*);

/** usage: spt method [src]
 * 
 *  Spt reads a graph from stdin, computes a shortest path tree (from src)
 *  using the method specified by the argument and then prints the graph
 *  and the spt. The edge lengths in the output spt represent the shortest
 *  path distance to the head of the edge. For example, if the length of
 *  edge (x,y) is shown as 13, this means that the length of the shortest
 *  path from the source vertex to y is 13. Src defaults to 1.
 */
int main(int argc, char *argv[]) {
	int s; Wdigraph dig; cin >> dig;
	
	s = 1;
	if (argc < 2 || argc > 3 ||
	    (argc == 3 && sscanf(argv[2],"%d",&s) != 1))
		Util::fatal("usage: spt method [src]");

	int *p = new vertex[dig.n()+1];
	int *d = new int[dig.n()+1];

	if (strcmp(argv[1],"dijkstra") == 0)
		dijkstra(dig,s,p,d);
	else if (strcmp(argv[1],"bfScan") == 0)
		bfScan(dig,s,p,d);
	else
		Util::fatal("spt: undefined method");

	Wdigraph sptree(dig.n(),dig.n()-1);
	int sum = 0;
	for (vertex u = 1; u <= dig.n(); u++) {
		if (p[u] != 0) {
			edge e = sptree.join(p[u],u);
			sptree.setLength(e,d[u]);
			sum += (d[u] - d[p[u]]);
		}
	}
	sptree.sortAdjLists();
	cout << dig << endl;
	cout << sptree << endl;
	cout << "total cost=" << sum << endl;
	delete [] p; delete [] d;
	exit(0);
}
