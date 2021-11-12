/** @file mst_chetar.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import List_d from '../../dataStructures/basic/List_d.mjs';
import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Lheaps_l from '../../dataStructures/heaps/Lheaps_l.mjs';
import Graph_w from '../../dataStructures/graphs/Graph_w.mjs';

/** Compute min spanning tree of a graph using Cheriton/Tarjan algorithm.
 *  @param g is weighted graph
 *  @param trace controls the amount of trace output produced
 *  @return a tuple [error, elist, traceString,  stats] where error is
 *  an error message of '' if no errors, elist is a list of edges that
 *  defines an mst in g or a minimum spanning forest, if g is not connected,
 *  ts is a trace string and stats is a statistics object
 */
export default function mst_chetar(g, trace=0) {
	let trees = new Dsets(g.n); // one subset for each mst subtree
	// edge endpoint is retired from Lheaps_l when in its edge connects
	// vertices in same subtree 
	let retired = function(ee) {
		return ee > 1 && trees.find(g.left(Math.trunc(ee/2))) ==
			   			 trees.find(g.right(Math.trunc(ee/2)));
	}
	// initialze collection of edge endpoint heaps
	// each heap contains edge endpoints touching one mst subtree
	let M = g.M;	// largest edge number used in g
	let eph = new Lheaps_l(2*M+1, 2*M+1, retired);

	for (let e = g.first(); e != 0; e = g.next(e)) {
		eph.setkey(2*e, g.weight(e)); eph.setkey(2*e+1, g.weight(e));
	}
	// build heap of endpoints for each mst subtree
	// initialize queue of mst subtrees
	let h = new Array(g.n+1);
	let q = new List_d(g.n);
	let hlist = new List(2*eph.n+1);
	for (let u = 1; u <= g.n; u++) {
		hlist.clear();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			hlist.enq(2*e + (u == g.right(e) ? 1 : 0));
		}
		if (!hlist.empty()) {
			h[u] = eph.heapify(hlist);
			q.enq(u);
		}
	}
	let elist = []; let ts = '';
	if (trace) {
		ts += g.toString(0,1) + '\n' +
			  'selected edge, queue, tree vertex sets\n';
	}
	while (q.length > 1) {
		let t = q.first();	

        let ee = h[t] = eph.findmin(h[t]);
        if (ee == 0) { q.deq(); continue; }
        let e = Math.trunc(ee/2); elist.push(e);
		let u = g.left(e); let v = g.right(e);

		let tu = trees.find(u); let tv = trees.find(v);
		q.delete(tu); q.delete(tv);
		h[trees.link(tu, tv)] = eph.lazyMeld(h[tu], h[tv]);
		q.enq(trees.find(u));
		if (trace) {
			ts += g.edge2string(e) + ' ' + q + ' ' + trees + '\n';
		}
	}
	return ['', elist, ts, eph.getStats()];
}
