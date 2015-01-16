/** @file badCaseDijkstra.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wdigraph.h"

using namespace grafalgo;

/** usage: badCaseDijkstra n
 * 
 *  BadCaseSpt generates a weighted digraph that causes Dijkstra's
 *  shortest path algorithm to perform poorly, when
 *  started from vertex 1.
 * 
 *  The parameter n is the number of vertices.
 */
int main(int argc, char* argv[]) {
	vertex u,v; edge e; int n = 0;

	if (argc != 2 || sscanf(argv[1],"%d",&n) != 1)
		Util::fatal("usage badCase n");

	Wdigraph g(n,n*n/2);

	for (u = 1; u <= n-1; u++) {
		e = g.join(u,u+1); g.setLength(e,1);
		for (v = u+2; v <= n; v++) {
			e = g.join(u,v); g.setLength(e,2*(n-u));
		}
	}
	g.sortAdjLists();
	cout << g;
}
