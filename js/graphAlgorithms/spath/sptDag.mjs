/** @file sptDag.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import toposort from '../misc/toposort.mjs';

/** Compute shortest path tree of a graph in an acyclic digraph (dag).
 *  @param g is a dag with edge lengths, some possibly negative
 *  @param s is a "source vertex" in g
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [link, dist, ts, stats] where link[u] is the edge from
 *  the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is a
 *  statistics object; if g is not acyclic, [] is returned
 */
export default function sptDag(g, s, trace=0) {
	let topo = toposort(g); // sorted list of vertices
	if (!topo) return [];

	let link = new Int32Array(g.n+1);
	let dist = new Array(g.n+1).fill(Infinity);
	let reached = new Int8Array(g.n+1).fill(false);
		// reached[u]==true means u is no longer unlabeled

	let ts = '';
	if (trace) {
		ts += g.toString(1) + 'sorted vertex list: ' +
			  g.ilist2string(topo) + '\n\n' +
			  'selected vertex, distance, edge to parent\n';
	}

	link[s] = 0; dist[s] = 0; reached[s] = true;
	for (let i = 0; i < g.n; i++) {
		let u = topo[i];
		if (!reached[u]) continue;
		for (let e = g.firstOutof(u); e; e = g.nextOutof(u, e)) {
			let v = g.mate(u, e); reached[v] = true;
			if (dist[v] > dist[u] + g.length(e)) {
				link[v] = e; dist[v] = dist[u] + g.length(e);
			}
		}
		if (trace) {
			ts += g.x2s(u) + ' ' +
				  (dist[u] != Infinity ? dist[u] : '-') + ' ' +
				  (link[u] != 0 ? g.edge2string(link[u]) : '-') + '\n';
		}
	}

	return [link, dist, ts, null ];
}
