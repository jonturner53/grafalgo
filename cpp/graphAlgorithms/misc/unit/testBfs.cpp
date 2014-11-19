/** @file bfs.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Adt.h"
#include "Util.h"
#include "List.h"
#include "Graph.h"

using namespace grafalgo;

void bfs(Graph&, vertex, List&);

/** usage: bfs
 *  
 *  Bfs reads a graph from stdin, and lists its vertices in
 *  breadth-first order starting from vertex 1.
 */
int main() {
	Graph g; cin >> g;
	List vlist(g.n());
	bfs(g,1,vlist);
	cout << vlist << endl;
}

void bfs(Graph& g, vertex s, List& vlist) {
	vertex u,v; edge e; List q(g.n());
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
