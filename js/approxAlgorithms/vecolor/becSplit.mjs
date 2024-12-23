/** @file becSplit.mjs
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
import bidcsF from '../../graphAlgorithms/vmatch/bidcsF.mjs';
import mdmatchG from '../../graphAlgorithms/vmatch/mdmatchG.mjs';
import ecolorG from '../../graphAlgorithms/ecolor/ecolorG.mjs';
import becDegreeBound from './becDegreeBound.mjs';

/** Find a bounded edge coloring using the max degree matching method.
 *  @param g is the graph to be colored with bounds; assumed to be bipartite
 *  @return a triple [color, ts, stats] where color is an array of edge colors,
 *  ts is a trace string and stats is a statistics object.
 */
export default function becSplit(g, trace=0) {
	let ts = ''; let steps = 0;
	ea && assert(g.hasBipartition);

	let bmax = 0;
	for (let e = g.first(); e; e = g.next(e))
		bmax = Math.max(bmax, g.bound(e));
	let k = ~~(bmax/2);
	let gk = new Graph(g.n,g.edgeRange); gk.setBipartition(g.getBipartition());
	for (let e = g.first(); e; e = g.next(e)) {
		if (g.bound(e) <= k) gk.join(g.left(e),g.right(e),e);
	}
	steps += g.n + g.m;

	let d = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) d[u] = g.degree(u);
	let dmin = new Int32Array(g.n+1);
	let dmax = new Int32Array(g.n+1).fill(k);
	let [lo,hi] = [becDegreeBound(g), bmax+g.maxDegree()-1];
	steps += g.n + g.m * Math.ceil(Math.log(g.m));

	if (hi <= lo) hi = lo+1;
	let H; let C; let mstats;
	while (lo < hi) {
		// search for smallest C for which G can be split into H and J
		C = ~~((lo + hi)/2);
		for (let u = 1; u <= gk.n; u++)
			dmin[u] = Math.max(0, d[u] - (C-k));
		[H,,mstats] = bidcsF(gk, dmax, dmin);
			// H is a Graph object with edges defining subset of g
		if (H) { hi = C; steps += mstats.steps; }
		else	 lo = C+1;
	}
	C = hi;  // smallest C for which G can be split

	// compute H and J for final value of C
	for (let u = 1; u <= gk.n; u++)
		dmin[u] = Math.max(0, d[u] - (C-k));
	[H,,mstats] = bidcsF(gk, dmax, dmin);
	steps += mstats.steps;
	let J = new Graph(g.n, g.edgeRange); J.setBipartition(g.getBipartition());
	for (let e = g.first(); e; e = g.next(e)) {
		if (!H.validEdge(e)) J.join(g.left(e),g.right(e),e);
	}

	// color H and J and transfer results to color for g
	let color = new Int32Array(g.edgeRange+1);
	let [colorH] = ecolorG(H);
	for (let e = H.first(); e; e = H.next(e)) 
		color[e] = (k-1) + colorH[e];
	let [colorJ,x] = ecolorG(J); ts += x;
	for (let e = J.first(); e; e = J.next(e)) 
		color[e] = (bmax-1) + colorJ[e];
	steps += g.n + g.m;
	if (trace) {
		ts += g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
                              `${g.bound(e)}/${color[e]}` +
							  (H.validEdge(e) ? '.' : ''));
		ts += H.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
                              `${colorH[e]}`);
		ts += J.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
                              `${colorJ[e]}`);
		ts = ts.slice(0,-1);
	}
	return [color, ts, { 'C': Math.max(...color), 'steps': steps }];
}
