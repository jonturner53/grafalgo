/** @file bfs.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Adt.h"
#include "List.h"
#include "Graph.h"

namespace grafalgo {

/** Compute list of vertices in breadth-first order.
 *  @param g is a graph object
 *  @param s is a vertex in g
 *  @param vlist is used to return a list of all the vertices
 *  in breadth-first order, starting from s
 */
void bfs(Graph& g, vertex s, List& vlist) {
	vertex u,v; edge e; List q(g.n(),false);
	bool *mark = new bool[g.n()+1];
	for (u = 1; u <= g.n(); u++) mark[u] = false;
	q.addLast(s); mark[s] = true;
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		string s1;
		vlist.addLast(u);
		for (e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			v = g.mate(u,e);
			if (!mark[v]) { q.addLast(v); mark[v] = 1; }
		}
	}
	cout << endl;
	delete [] mark;
}

} // ends namespace
