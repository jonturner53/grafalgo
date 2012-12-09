// usage: toposort
//
// Toposort reads a graph from stdin, and creates an equivalent
// graph whose vertices are in topologically sorted order.
// This graph, and the mapping used to produce, are written
// to stdout.
//
// This program is not bullet-proof. Caveat emptor.

#include "stdinc.h"
#include "Adt.h"
#include "Util.h"
#include "List.h"
#include "Digraph.h"

namespace grafalgo {

void toposort(Digraph&, vertex*, vertex*);

main() {
	int i; vertex u,v; edge e; string s;
	Digraph dg; dg.read(cin);
	int *pos = new int[dg.n()+1];
	vertex *vert = new vertex[dg.n()+1];
	toposort(dg,pos,vert);
	Digraph inOrder(dg.n(),dg.m());
	cout << "# ";
	for (i = 1; i <= dg.n(); i++) {
		u = vert[i];
		cout << Util::node2string(u,dg.n(),s) << "->";
		cout << Util::node2string(pos[u],dg.n(),s) << " ";
		if ((i%10) == 0) cout << "\n# ";
		for (e = dg.firstOut(u); e != 0; e=dg.nextOut(u,e)) {
			v = dg.head(e);
			inOrder.join(pos[u],pos[v]); 
		}
	}
	inOrder.sortAdjLists();
	cout << endl << inOrder.toString(s);
}

void toposort(Digraph& dg, int *pos, int *vert) {
// Compute a topological ordering of dg. On return, pos[u]
// is the position of vertex u in the ordering and vert[i]
// is the vertex in the i-th position in the ordering.
	int i; vertex u,v; edge e;
	List q(dg.n());
	int *nin = new int[dg.n()+1];

	// Let nin[u]=in-degree of u and put nodes u with nin[u]=0 on q
	for (u = 1; u <= dg.n(); u++) {
		nin[u] = 0;
		for (e = dg.firstIn(u); e != 0; e=dg.nextIn(u,e)) {
			nin[u]++;
		}
		if (nin[u] == 0) q.addLast(u);
	}
	i = 0;
	while (!q.empty()) { // q contains nodes u with nin[u] == 0
		u = q.first(); q.removeFirst(); pos[u] = ++i; vert[i] = u;
		for (e = dg.firstOut(u); e != 0; e = dg.nextOut(u,e)) {
			v = dg.head(e);
			if ((--(nin[v])) == 0) q.addLast(v);
		}
	}
	if (i < dg.n()) fatal("toposort: graph has cycle");
}

} // ends namespace
