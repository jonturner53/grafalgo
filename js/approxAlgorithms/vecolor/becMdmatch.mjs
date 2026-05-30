/** @file becMdmatch.mjs
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
import { maxFloor } from './becCommon.mjs';

/** Find a bounded edge coloring using the max degree matching method.
 *  Edges are colored using a succession of matchings which give priority
 *  to vertices of max degree in uncolored subgraph of g
 *  @param g is the graph to be colored with floors; assumed to be bipartite
 *  @return a triple [color, ts, stats] where color is an array of edge colors,
 *  ts is a traceString and stats is a statistics object.
 */
export default function becMdmatch(g, trace=0) {
	let steps = 0;
	if (!g.color) g.addEdgeProperty('color',0);
	let gc = new Graph(g.n,g.edgeRange); gc.setBipartition(g.getBipartition());
		// subgraph of uncolored edges with floors <= c
	let ts = '';
	if (trace) {
		ts += 'graph with floors ';
		ts += g.toString(5, (e,u)=>`${g.x2s(g.mate(u,e))}:${g.floor(e)}`);
		ts += '\nmatchings\n';
	}
	let c; let cmax = 0;
	let count = 0;  // number of edges colored so far
	for (c = 1; count < g.m; c++) {
		// add edges with floor of c to gc
		for (let e = g.first(); e; e = g.next(e)) {
			if (c >= g.floor(e) && c < g.floor(e) + 1) {
				gc.join(g.left(e), g.right(e), e);
			}
		}
		// find max degree matching in gc, extended to max size
		let [match,,mstats] = mdmatchG(gc);
		steps += mstats.steps;
		[match,,mstats] = bimatchHK(gc,match)
		steps += mstats.steps;
		if (trace && match.size()>0) ts += `${c}: ${match.toString()}\n`;
		for (let e = match.first(); e; e = match.next(e)) {
			g.color(e,c); gc.delete(e); count++;
		}
		cmax = c;
		steps += g.n + g.m;
	}
	let fmax = maxFloor(g);
	if (trace) {
		ts += '\ngraph with colors\n' +
						g.toString(5,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
						`${g.floor(e)}/${g.color(e)}`) + '\n' +
					    `colors: [${cmax},${cmax-fmax}]\n`;
	}
	return [ts, { 'C': [cmax,cmax-fmax], 'steps': steps }];
}
