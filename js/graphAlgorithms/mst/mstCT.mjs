/** @file mstCT.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';
import LazyHeaps from '../../dataStructures/heaps/LazyHeaps.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Compute min spanning tree of a graph using Cheriton/Tarjan algorithm.
 *  @param g is weighted graph
 *  @param trace controls the amount of trace output produced
 *  @return a tuple [treeEdges, traceString, stats] where is an array listing the
 *  edges in the mst (or forest), traceString is a trace string and stats is
 *  a statistics object
 */
export default function mstCT(g, trace=0) {
	let trees = new MergeSets(g.n); // one subset for each mst subtree

	// initialize collection of edge endpoint heaps
	// each heap contains edge endpoints touching one mst subtree
	let epHeap = new LazyHeaps(2*(2*g.edgeRange+1), 
		ee => ee > 1 && trees.find(g.left(Math.trunc(ee/2))) ==
				  		trees.find(g.right(Math.trunc(ee/2))));
	for (let e = g.first(); e != 0; e = g.next(e)) {
		epHeap.key(2*e, g.weight(e)); epHeap.key(2*e+1, g.weight(e));
	}
	epHeap.key(1, 0); // unused heap item

	let h = new Int32Array(g.n+1);  // h[u] is heap for tree whose id is u
	let q = new List(g.n);   // queue of trees
	let hlist = new List(2*epHeap.n+1);
	for (let u = 1; u <= g.n; u++) {
		hlist.clear();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e))
			hlist.enq(u == g.left(e) ? 2*e : 2*e+1);
		if (!hlist.empty()) {
			h[u] = epHeap.heapify(hlist); q.enq(u);
		}
	}
	let traceString = '';
	if (trace) {
		traceString += g.toString(1) + '\n' +
			  'selected edge, queue, tree vertex sets,\n    ' +
			  'heap of incident edges';
		traceString += '\n';
	}
	let treeEdges = [];  // vector of edges in tree
	while (q.length > 1) {
		let t = q.first(); let ee = h[t] = epHeap.findmin(h[t]);
        if (ee == 0) { q.deq(); continue; }

        let e = Math.trunc(ee/2); treeEdges.push(e);
		let u = g.left(e); let v = g.right(e);
		let tu = trees.find(u); let tv = trees.find(v);

		q.delete(tu); q.delete(tv);
		h[trees.merge(tu, tv)] = epHeap.lazyMeld(h[tu], h[tv]);
		q.enq(trees.find(u));

		if (trace) {
			traceString += g.edge2string(e) + ' ' + q + ' ' + trees;
			if (g.n <= 26) {
				let s = epHeap.toString(0x2, ep =>
				  			(!epHeap.isactive(ep) ? '.' : 
							 g.x2s(g.left(Math.floor(ep/2))) + 
	                         g.x2s(g.right(Math.floor(ep/2))) +
				   			 ':' + epHeap.key(ep)),
						h[trees.find(u)]);
				traceString += '\n    ' + s.slice(0,75) + '\n';
			}
		}
	}
	return [treeEdges, traceString, epHeap.getStats()];
}
