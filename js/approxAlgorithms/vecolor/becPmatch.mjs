/** @file becPmatch.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import pbimatchHKT from '../../graphAlgorithms/vmatch/pbimatchHKT.mjs';

/** Find a bounded edge coloring using the max degree matching method.
 *  Edges are colored using a succession of matching which give priority
 *  to vertices of max degree in uncolored subgraph of g
 *  @param g is the graph to be colored with floors; assumed to be bipartite
 *  @return a pair [ts, stats] where ts is a traceString and stats is
 *  a statistics object; the coloring is returned as an edge property of g.
 */
export default function becPmatch(g, trace=0) {
	let steps = 0;
	ea && assert(g.hasBipartition, g);
	if (!g.color) g.addEdgeProperty('color',0);

	// compute degrees in g and assign initial priorities
	let d = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) d[u] = g.degree(u);
	let maxd = Math.max(...d);
	let prio = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++)
		prio[u] = (d[u] == maxd ? 2 : 1);
	steps += g.n;

	let gc = new Graph(g.n,g.edgeRange); gc.setBipartition(g.getBipartition());
		// subgraph of uncolored edges with floors <= c
	let ts = '';
	if (trace) {
		ts += 'graph with floors\n' + g.toString(5) + '\nmatchings\n';
	}
	let c; let cmax = c;
	let count = 0;  // number of edges colored so far
	for (c = 1; count < g.m; c++) {
		// add edges with floor of c to gc
		for (let e = g.first(); e; e = g.next(e)) {
			if (c >= g.floor(e) && c < g.floor(e) + 1) {
				gc.join(g.left(e), g.right(e), e);
			}
		}
		// find matching in gc that colors all vertices with max
		// degree in uncolored subgraph; extend to max size matching
		let [match,,mstats] = pbimatchHKT(gc,prio);
		steps += mstats.steps;
		if (trace && match.size()>0) ts += `${c}: ${match.toString()}\n`;
		for (let e = match.first(); e; e = match.next(e)) {
			g.color(e,c); gc.delete(e); count++;
			d[g.left(e)]--; d[g.right(e)]--;
		}
		// update priorities
		maxd = Math.max(...d);
		for (let u = 1; u <= g.n; u++) prio[u] = (d[u] == maxd ? 2 : 1);
		cmax = c;
		steps += g.n + g.m;
	}
	if (trace) {
		ts += '\ngraph with floors and colors\n' +
				g.toString(5,(e,u)=>`${g.x2s(g.mate(u,e))}:` +
						   `${g.floor(e)}/${g.color(e)}`);
	}
	return [ts, {'C': cmax, 'steps': steps }];
}
