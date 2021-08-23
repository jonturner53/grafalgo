/** @file List.js
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Heap_d from '../../dataStructures/heaps/Heap_d.mjs';
import Graph_w from '../../dataStructures/graphs/Graph_w.mjs';

/** Compute min spanning tree of a graph using Prim's algorithm.
 *  @param g is weighted graph
 *  @return a list or edges that defines an mst in g
 */
export default function mst_prim(g) {
	let tree = [];
	let cheap = new Array(g.n+1).fill(0);
	let h = new Heap_d(g.n, 2+Math.floor(g.m/g.n));

	for (let e = g.firstAt(1); e != 0; e = g.nextAt(1,e)) {
		let u = g.mate(1,e); h.insert(u, g.weight(e)); cheap[u] = e;
	}
	cheap[1] = 1;	// dummy value, any non-zero value will do
	while (!h.empty()) {
		let u = h.deletemin(); tree.push(cheap[u]);
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			let v = g.mate(u,e);
			if (h.contains(v) && g.weight(e) < h.key(v)) {
				h.changekey(v, g.weight(e)); cheap[v] = e;
			} else if (!h.contains(v) && cheap[v] == 0) {
				h.insert(v, g.weight(e)); cheap[v] = e;
			}
		}
	}
	return tree;
}
