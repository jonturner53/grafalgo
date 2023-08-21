/** @file becolorSplit.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import findSplit from '../../graphAlgorithms/misc/findSplit.mjs';
import bimatchF from '../../graphAlgorithms/match/bimatchF.mjs';
import mdmatchG from '../../graphAlgorithms/vmatch/mdmatchG.mjs';
import ecolorG from '../../graphAlgorithms/ecolor/ecolorG.mjs';
import degreeBound from './degreeBound.mjs';
import matchBound from './matchBound.mjs';

/** Find a bounded edge coloring using the max degree matching method.
 *  @param g is the graph to be colored with bounds; assumed to be bipartite
 *  @return a triple [color, ts, stats] where color is an array of edge colors,
 *  ts is a traceString and stats is a statistics object.
 */
export default function becolorSplit(g, trace=0) {
	let steps = 0;
	let ts = '';

	let subsets = findSplit(g);
	if (!subsets) throw exception

	let bmax = 0;
	for (let e = g.first(); e; e = g.next(e))
		bmax = Math.max(bmax, g.bound(e));
	let k = ~~(bmax/2);
	let gk = new Graph(g.n,g.edgeRange);
	for (let e = g.first(); e; e = g.next(e)) {
		if (g.bound(e) <= k) gk.join(g.left(e),g.right(e),e);
	}

	let d = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) d[u] = g.degree(u);
	let dmin = new Int32Array(g.n+1);
	let dmax = new Int32Array(g.n+1).fill(k);
	let [lo,hi] = [Math.max(degreeBound(g),matchBound(g))-1,
				   bmax+g.maxDegree()-1];
	if (hi <= lo) hi = lo+1;
	let H; let C;
	while (lo < hi) {
		// search for largest C for which G cannot be split into H and J
		// cannot split on C=lo, can split on C=hi
		C = ~~((lo + hi + 1)/2);
		for (let u = 1; u <= gk.n; u++)
			dmin[u] = Math.max(0, d[u] - (C-k));
		[H] = bimatchF(gk, subsets, dmin, dmax);
			// H is a Graph object with edges defining subset of g
		for (let u = 1; u <= H.n; u++) {
			if (H.degree(u) < dmin[u]) {
				lo = C; break;
			} else if (u == H.n) {
				hi = C-1; break;
			}
		}
	}
	C = lo+1;  // smallest C for which G can be split
	// compute H and J for final value of C
	for (let u = 1; u <= gk.n; u++)
		dmin[u] = Math.max(0, d[u] - (C-k));
	[H] = bimatchF(gk, subsets, dmin, dmax);
	let J = new Graph(g.n, g.edgeRange);
	for (let e = g.first(); e; e = g.next(e)) {
		if (!H.validEdge(e)) J.join(g.left(e),g.right(e),e);
	}
	// color H and J and transfer results to color for g
	let color = new Int32Array(g.edgeRange+1);
	let [colorH] = ecolorG(H);
	for (let e = H.first(); e; e = H.next(e)) 
		color[e] = (k-1) + colorH[e];
	let [colorJ] = ecolorG(J);
	for (let e = J.first(); e; e = J.next(e)) 
		color[e] = (bmax-1) + colorJ[e];
	if (trace) {
		ts += g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
                              `${g.bound(e)}/${color[e]}` +
							  (H.validEdge(e) ? '.' : ''));
		ts = ts.slice(0,-1);
	}
	return [color, ts, {'Cmax': bmax + (C-k)-1,
						'bounds': [degreeBound(g), matchBound(g)]}
		   ];
}
