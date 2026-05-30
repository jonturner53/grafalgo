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
import { degreeBound, maxFloor } from './becCommon.mjs';

/** Find a bounded edge coloring using the max degree matching method.
 *  @param g is the graph to be colored with floors; assumed to be bipartite
 *  @return a triple [color, ts, stats] where color is an array of edge colors,
 *  ts is a trace string and stats is a statistics object.
 */
export default function becSplit(g, trace=0) {
	let ts = ''; let steps = 0;
	ea && assert(g.hasBipartition);
	if (!g.color) g.addEdgeProperty('color', 0);

	let fmax = maxFloor(g);
	let h = Math.ceil(fmax/2);		// first color for H
	let gh = new Graph(g.n,g.edgeRange); gh.setBipartition(g.getBipartition());
	for (let e = g.first(); e; e = g.next(e)) {
		if (g.floor(e) <= h) gh.join(g.left(e),g.right(e),e);
	}
	steps += g.n + g.m;

	let d = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) d[u] = g.degree(u);
	let maxDegree = Math.max(...d);
	let dmin = new Int32Array(g.n+1);
	let dmax = new Int32Array(g.n+1).fill(h);
	steps += g.n;

	let C = fmax + maxDegree-1; let bestC = C;
	for (let u = 1; u <= gh.n; u++)
		dmin[u] = Math.max(0, d[u] - (C-h));
	let [bestH,,stats] = bidcsF(gh, dmax, dmin); steps += stats.steps;
	let [lo,hi] = [fmax,C];
	while (lo < hi) {
		// search for smallest C for which G can be split into H and J
		// so that H has max degree <=h and J has max degree<=C-h
		C = ~~((lo + hi)/2);
		for (let u = 1; u <= gh.n; u++)
			dmin[u] = Math.max(0, d[u] - (C-h));
		let [H,,stats] = bidcsF(gh, dmax, dmin); steps += stats.steps;
			// H is a Graph object with edges defining subset of g
		if (H) {
			hi = C; bestC = C; bestH = H;
		} else {
			lo = C+1;
		}
	}
	let H = bestH;
	let J = new Graph(g.n, g.edgeRange); J.setBipartition(g.getBipartition());
	for (let e = g.first(); e; e = g.next(e)) {
		if (!H.validEdge(e)) J.join(g.left(e),g.right(e),e);
	}
	// color H and J and use results to color g
	[,stats] = ecolorG(H); steps += stats.steps;
	for (let e = H.first(); e; e = H.next(e)) 
		g.color(e, (h-1) + H.color(e));

	[,stats] = ecolorG(J); steps += stats.steps;
	let h2 = Math.max(2*h,fmax);	// first color for J
	for (let e = J.first(); e; e = J.next(e)) 
		g.color(e, (h2-1) + J.color(e));
	steps += g.n + g.m;

	let cmax = h2 + Math.max(...J.maxDegree()) - 1;
	if (trace) {
		ts += g.toString(5,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
                              `${g.floor(e)}/${g.color(e)}` +
							  (H.validEdge(e) ? '.' : '')) +
							  `colors: [${cmax},${cmax-fmax}]\n`;
	}
	return [ts, { 'C': [cmax,cmax-fmax], 'steps': steps }];
}
