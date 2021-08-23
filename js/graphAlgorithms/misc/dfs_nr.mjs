/** @file dfs.mjs
 * 
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../Errors.mjs';
import Adt from '../../dataStructures/Adt.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Compute list of vertices in depth-first order (specifically preorder).
 *  @param g is a graph object
 *  @param s is a vertex in g
 *  @return an array listing the vertices in depth-first order from s
 */
export default function dfs_nr(g, s) {
	let vlist = [];
	let mark = new Array(g.n+1).fill(false);
	let stk = new List(g.n);
	let next = new Array(g.n+1).fill(0);

	stk.push(s); next[s] = g.firstAt(s);
	vlist.push(s); mark[s] = true;
	while (!stk.empty()) {
		let u = stk.top(); let e = next[u];
		if (e == 0) {
			stk.pop();
		} else if (mark[g.mate(u, e)]) {
			next[u] = g.nextAt(u,e);
		} else {
			let v = g.mate(u, e);
			stk.push(v); next[v] = g.firstAt(v);
			vlist.push(v); mark[v] = true;
		}
	}
	return vlist;
}
