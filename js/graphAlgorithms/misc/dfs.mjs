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

/** Compute list of vertices in depth-first order (specifically pre-order).
 *  @param g is a graph object
 *  @param u is the "current" vertex in the search
 *  @param vlist is omitted in the top-level call; in recursive calls,
 *  it is the (in-progress) list of vertices to be returned.
 *  @param mark is omitted in the top-level call; in recursive calls,
 *  it is used to mark vertices that have been visited
 *  @return the final value of vlist, showing vertices in depth-first order
 */
export default function dfs(g, u, vlist=null, mark=null) {
	if (vlist == null) {
		vlist = [];
		mark = new Array(g.n+1).fill(false);
	}
	vlist.push(u); mark[u] = true;
	for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e)) {
		let v = g.mate(u, e);
		if (!mark[v]) dfs(g, v, vlist, mark);
	}
	return vlist;
}
