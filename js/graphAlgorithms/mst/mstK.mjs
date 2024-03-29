/** @file mstK.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import MergeSets from '../../dataStructures/basic/MergeSets.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Find a minimum spanning tree of g using Kruskal's algorithm.
 *  @param g is a weighted graph
 *  @param trace controls the production of trace information
 *  @return a tuple [treeEdges, traceString, stats] where treeEdges is an
 *  array listing the edges in the mst (or forest), traceString is a trace
 *  string and stats is a statistics object
 */
export default function mstK(g, trace=0) {
	// first make a sorted list of the edges in g
	let edges = []; let steps = 0;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		edges.push(e); steps++;
	}
	edges.sort((e1, e2) => {
					steps++;
					return g.weight(e1) - g.weight(e2);
				});
							
	let traceString = '';
	if (trace) {
		traceString += g.toString(1) + 'sorted edge list\n' +
					   g.elist2string(edges) + '\n\n' +
					   'selected tree edge, disjoint sets\n';
	}

	// now examine edges in order, merging separate subtrees
	let treeEdges = []; let subtrees = new MergeSets(g.n);
	for (let i = 0; i < edges.length; i++) {
		let e = edges[i];
		let u = g.left(e); let v = g.right(e);
		let cu = subtrees.find(u); let cv = subtrees.find(v);
		if (cu != cv) {
			treeEdges.push(e); subtrees.merge(cu, cv);
			if (trace) {
				traceString += g.e2s(e) + ' ' + subtrees + '\n';
			}
		}
	}
	return [treeEdges, traceString,
			{'steps': steps + subtrees.getStats().steps}];
}
