/** @file findSplit.mjs
 * 
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs'
import ListPair from '../../dataStructures/basic/ListPair.mjs'

/** Divide the vertices of a bipartite graph into two independent sets.
 *  @param g is a bipartite graph
 *  @return a ListPair object that divides the vertices into two lists,
 *  so that all edges in g have one endpoint in each list or null,
 *  if the graph is not bipartite.
 */
export default function findSplit(g) {
	let split = new ListPair(g.n);
	let unreached = new Int8Array(g.n+1).fill(true);
	let q = new List(g.n);

	let u = 1;
	while (u <= g.n) {
		q.enq(u); unreached[u] = false; split.swap(u);
		while (!q.empty()) {
			let v = q.deq();
			for (let e = g.firstAt(v); e != 0; e = g.nextAt(v,e)) {
				let w = g.mate(v,e);
				if (unreached[w]) {
					if (split.in2(v)) split.swap(w);
					q.enq(w); unreached[w] = false;
				} else if ( (split.in1(v) && split.in1(w)) ||
					   		(split.in2(v) && split.in2(w))) {
					return null;
				}
			}
		}
		// find next unreached vertex (for graphs that are not connnected)
		for (u++; u <= g.n && !unreached[u]; u++) {}
	}
	return split;
}
