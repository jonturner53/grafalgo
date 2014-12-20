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
#include "Digraph.h"

using namespace grafalgo;

extern bool toposort(const Digraph&, List&);

/** usage: testToposort
 * 
 *  TestToposort reads a graph from stdin, and creates an equivalent
 *  graph whose vertices are in topologically sorted order.
 *  This graph, and the mapping used to produce, are written
 *  to stdout.
 */
int main() {
	Digraph dg; cin >> dg; cout << dg;
	List vlist(dg.n());
	if (toposort(dg,vlist))
		cout << vlist << endl;
	else
		cout << "graph contains cycle\n";
	exit(0);
}