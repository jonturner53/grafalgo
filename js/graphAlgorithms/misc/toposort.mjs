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
	let vlist = []; // list of vertices in topological order
	let q = new List(g.n);
		// list of vertices whose in-edges have all been touched
	let icount = new Array(g.n+1).fill(0);
		// icount[u] = inDegree(u) - (# of times in-edge of u has been touched)

	// Initialize icount[u] and put nodes with icount[u]=0 on q
	for (let u = 1; u <= g.n; u++) {
		icount[u] = g.inDegree(u);
		if (icount[u] == 0) q.enq(u);
	}
	while (!q.empty()) { // q contains nodes u with icount[u] == 0
		let u = q.deq(); vlist.push(u);
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u,e)) {
			let v = g.head(e); icount[v]--;
			if (icount[v] == 0) q.enq(v);
		}
	}
	return (vlist.length == g.n ? vlist : null);
}
