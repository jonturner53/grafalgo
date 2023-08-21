/** @file becolorPmatch.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import pbimatchHKT from '../../graphAlgorithms/vmatch/pbimatchHKT.mjs';
import degreeBound from './degreeBound.mjs';
import matchBound from './matchBound.mjs';
import flowBound from './flowBound.mjs';

/** Find a bounded edge coloring using the max degree matching method.
 *  Edges are colored using a succession of matching which give priority
 *  to vertices of max degree in uncolored subgraph of g
 *  @param g is the graph to be colored with bounds; assumed to be bipartite
 *  @return a triple [color, ts, stats] where color is an array of edge colors,
 *  ts is a traceString and stats is a statistics object.
 */
export default function becolorPmatch(g, trace=0) {
	// compute degrees in g and assign initial priorities
	let d = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) d[u] = g.degree(u);
	let maxd = Math.max(...d);
	let prio = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++)
		prio[u] = (d[u] == maxd ? 2 : 1);

	let color = new Int32Array(g.edgeRange+1);
	let gc = new Graph(g.n,g.edgeRange);
		// subgraph of uncolored edges with bounds <= c
	let steps = 0;
	let ts = '';
	if (trace) {
		ts += g.toString(1, (e,u)=>`${g.x2s(g.mate(u,e))}:${g.bound(e)}`);
	}
	let c;
	let count = 0;  // number of edges colored so far
	for (c = 1; count < g.m; c++) {
		// add edges with bound of c to gc
		for (let e = g.first(); e; e = g.next(e)) {
			steps++;
			if (c >= g.bound(e) && c < g.bound(e) + 1)
				gc.join(g.left(e), g.right(e), e);
		}
		// find matching in gc that colors all vertices with max
		// degree in uncolored subgraph; extend to max size matching
		let [match,,mstats] = pbimatchHKT(gc,prio);
		steps += mstats.steps;
		if (trace) ts += `${c}:`;
		for (let e = match.first(); e; e = match.next(e)) {
			steps++;
			color[e] = c; gc.delete(e); count++;
			d[g.left(e)]--; d[g.right(e)]--;
			if (trace) {
				ts += ` ${g.e2s(e,0,1)}:${g.bound(e)}/${color[e]}`;
			}
		}
		if (trace) ts += '\n';
		// update priorities
		maxd = Math.max(...d);
		for (let u = 1; u <= g.n; u++) prio[u] = (d[u] == maxd ? 2 : 1);
	}
	if (trace)
		ts += g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
						   `${g.bound(e)}/${color[e]}`);
	return [color, ts, {'Cmax': Math.max(...color),
						'bounds': [degreeBound(g), matchBound(g), flowBound(g)]
					   }];
}
