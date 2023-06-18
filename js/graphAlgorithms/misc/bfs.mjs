/** @file bfs.mjs
 * 
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';

/** Compute list of vertices in breadth-first order.
 *  @param g is a graph object
 *  @param s is a vertex in g
 *  @return an array listing the vertices in breadth-first order, from s.
 */
export default function bfs(g, s) {
	let mark = new Int8Array(g.n+1).fill(false);

	let vlist = []; let q = new List(g.n);
	q.enq(s); mark[s] = true;
	while (!q.empty()) {
		let u = q.deq(); vlist.push(u);
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			let v = g.mate(u,e);
			if (!mark[v]) { q.enq(v); mark[v] = true; }
		}
	}
	return vlist;
}
