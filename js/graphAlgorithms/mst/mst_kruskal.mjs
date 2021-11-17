/** @file List.js
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Graph_w from '../../dataStructures/graphs/Graph_w.mjs';

/** Find a minimum spanning tree of g using Kruskal's algorithm.
 *  @param g is a weighted graph
 *  @param trace controls the production of trace information
 *  @return a tuple [pedge, ts,  stats] where pedge[u] is the parent 
 *  edge of u in the mst (or forest), ts is a trace string and stats is
 *  a statistics object
 */
export default function kruskal(g, trace=0) {
	// first make a sorted list of the edges in g
	let i = 0; let edges = new Array(g.m); let ts = '';
	for (let e = g.first(); e != 0; e = g.next(e)) edges[i++] = e;
	edges.sort((e1, e2) => g.weight(e1) - g.weight(e2));
	if (trace) {
		ts += g.toString(0,1) + 'sorted edge list\n' +
					   g.elist2string(edges) + '\n\n' +
					   'selected tree edge, disjoint sets\n';
	}

	// now examine edges in order, merging separate subtrees
	let pedge = []; let subtrees = new Dsets(g.n);
	for (let i = 0; i < edges.length; i++) {
		let e = edges[i];
		let u = g.left(e); let v = g.right(e);
		let cu = subtrees.find(u); let cv = subtrees.find(v);
		if (cu != cv) {
			pedge.push(e); subtrees.link(cu, cv);
			if (trace) {
				ts += g.edge2string(e) + ' ' + subtrees + '\n';
			}
		}
	}
	return [pedge, ts, subtrees.getStats() ];
}
