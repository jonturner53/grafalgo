/** @file testToposort.cpp
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
#include "Graph_d.h"

namespace grafalgo {
extern bool toposort(const Graph_d&, List&);
}

using namespace grafalgo;

/** usage: testToposort
 * 
 *  TestToposort reads a graph from stdin, and creates an equivalent
 *  graph whose vertices are in topologically sorted order.
 *  This graph, and the mapping used to produce, are written
 *  to stdout.
 */
int main() {
	Graph_d dg; cin >> dg; cout << dg;
	List vlist(dg.n());
	if (toposort(dg,vlist))
		cout << vlist << endl;
	else
		cout << "graph contains cycle\n";
	exit(0);
}
