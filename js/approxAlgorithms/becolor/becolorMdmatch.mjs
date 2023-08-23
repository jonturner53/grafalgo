/** @file becolorMdmatch.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import mdmatchG from '../../graphAlgorithms/vmatch/mdmatchG.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';

/** Find a bounded edge coloring using the max degree matching method.
 *  Edges are colored using a succession of matching which give priority
 *  to vertices of max degree in uncolored subgraph of g
 *  @param g is the graph to be colored with bounds; assumed to be bipartite
 *  @return a triple [color, ts, stats] where color is an array of edge colors,
 *  ts is a traceString and stats is a statistics object.
 */
export default function becolorMdmatch(g, trace=0) {
	let steps = 0;
	let color = new Int32Array(g.edgeRange+1);
	let gc = new Graph(g.n,g.edgeRange);
		// subgraph of uncolored edges with bounds <= c
	let ts = '';
	if (trace) {
		ts += g.toString(1, (e,u)=>`${g.x2s(g.mate(u,e))}:${g.bound(e)}`);
	}
	let c;
	let count = 0;  // number of edges colored so far
	for (c = 1; count < g.m; c++) {
		// add edges with bound of c to gc
		for (let e = g.first(); e; e = g.next(e)) {
			if (c >= g.bound(e) && c < g.bound(e) + 1)
				gc.join(g.left(e), g.right(e), e);
		}
		// find max degree matching in gc, extended to max size
		let [match,,mstats] = mdmatchG(gc);
		steps += mstats.steps;
		[match,,mstats] = bimatchHK(gc,match)
		steps += mstats.steps;
		if (trace) ts += `${c}: ${match.toString()}\n`;
		for (let e = match.first(); e; e = match.next(e)) {
			color[e] = c; gc.delete(e); count++;
		}
		steps += g.n + g.m;
	}
	if (trace) {
		ts += g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
						   `${g.bound(e)}/${color[e]}`);
	}
	return [color, ts, {'Cmax': Math.max(...color), 'steps': steps }];
}
