/** @file testBfs.cpp
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

namespace grafalgo {
extern void bfs(Graph&, vertex, List&);
}

using namespace grafalgo;

/** usage: testBfs
 *  
 *  TestBfs reads a graph from stdin, and lists its vertices in
 *  breadth-first order starting from vertex 1.
 */
int main() {
	Graph g; cin >> g;
	List vlist(g.n());
	bfs(g,1,vlist);
	cout << g << vlist << endl;
}
