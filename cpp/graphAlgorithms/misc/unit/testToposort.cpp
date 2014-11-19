/** @file toposort.cpp
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
#include "Digraph.h"

using namespace grafalgo;

bool toposort(const Digraph&, List&);

/** usage: toposort
 * 
 *  Toposort reads a graph from stdin, and creates an equivalent
 *  graph whose vertices are in topologically sorted order.
 *  This graph, and the mapping used to produce, are written
 *  to stdout.
 */
int main() {
	Digraph dg; cin >> dg;
	List vlist(dg.n());
	if (toposort(dg,vlist))
		cout << vlist << endl;
	else
		cout << "graph contains cycle\n";
	exit(0);
}

/** Compute a topological ordering of dg.
 *  @param dg is a reference to an acyclic digraph
 *  @param vlist is a List object in which result is returned;
 *  on return, the vertices in vlist are in topogical order
 */
bool toposort(const Digraph& dg, List& vlist) {
	List q(dg.n());
	int *nin = new int[dg.n()+1];

	if (vlist.n() < dg.n()) vlist.resize(dg.n());
	else vlist.clear();

	// Let nin[u]=in-degree of u and put nodes u with nin[u]=0 on q
	for (vertex u = 1; u <= dg.n(); u++) {
		nin[u] = 0;
		for (edge e = dg.firstIn(u); e != 0; e=dg.nextIn(u,e)) {
			nin[u]++;
		}
		if (nin[u] == 0) q.addLast(u);
	}
	int i = 0;
	while (!q.empty()) { // q contains nodes u with nin[u] == 0
		vertex u = q.first(); q.removeFirst(); vlist.addLast(u); i++;
		for (edge e = dg.firstOut(u); e != 0; e = dg.nextOut(u,e)) {
			vertex v = dg.head(e);
			if ((--(nin[v])) == 0) q.addLast(v);
		}
	}
	return (i == dg.n());
}
