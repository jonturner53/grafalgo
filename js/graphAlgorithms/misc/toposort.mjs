/** @file toposort.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';

/** Compute a topological ordering of a directed Graph.
 *  @param g is a reference to an acyclic digraph
 *  @return an array listing the vertices in topological
 *  order, or null if the graph has a cycle.
 */
export default function toposort(g) {
	let vlist = [];
	let q = new List(g.n);
	let nin = new Array(g.n+1).fill(0);

	// Let nin[u]=in-degree of u and put nodes u with nin[u]=0 on q
	for (let u = 1; u <= g.n; u++) {
		if (g.firstIn(u) == 0) q.enq(u);
		nin[u] = g.inDegree(u);
	}
	while (!q.empty()) { // q contains nodes u with nin[u] == 0
		let u = q.deq(); vlist.push(u);
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u,e)) {
			let v = g.head(e); nin[v]--;
			if (nin[v] == 0) q.enq(v);
		}
	}
	return (vlist.length == g.n ? vlist : null);
}
