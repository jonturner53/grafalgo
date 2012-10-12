// usage: bfs
//
// Bfs reads a graph from stdin, and lists its vertices in breadth-first order
// starting from vertex 1.
//
// This program is not bullet-proof. Caveat emptor.

#include "stdinc.h"
#include "Util.h"
#include "UiList.h"
#include "Graph.h"

void bfs(Graph&, vertex);

main() { Graph g; g.read(cin); bfs(g,1); }

void bfs(Graph& g, vertex s) {
	vertex u,v; edge e; UiList q(g.n());
	bool *mark = new bool[g.n()+1];
	for (u = 1; u <= g.n(); u++) mark[u] = false;
	q.addLast(s); mark[s] = true;
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		string s1;
		cout << Util::node2string(u,g.n(),s1) << " ";
		for (e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			v = g.mate(u,e);
			if (!mark[v]) { q.addLast(v); mark[v] = 1; }
		}
	}
	cout << endl;
	delete [] mark;
}
