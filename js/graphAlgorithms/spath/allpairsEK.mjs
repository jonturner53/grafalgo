/** @file allpairsEK.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Assert.mjs';
import sptBM from './sptBM.mjs';
import sptD from './sptD.mjs';

/** Compute shortest pairs among all pairs of vertices using edge
 *  transform of Edmonds and Karp. The transform eliminates negative
 *  edges, allowing shortest paths to be computed using Dijkstra's
 *  algorithm. The transform is computed using a single execution
 *  of the Bellman-Moore algorithm.
 *  @param g is a digraph with edge lengths
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [error, link, dist, ts, stats] where error is an empty
 *  string on success and an error string on failure, link[s][u] is the edge
 *  from the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[s][u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is
 *  a statistics object.
 */
export default function allpairsEK(g, trace) {
	let dist = []; dist.push(null);
	let link = []; link.push(null);
    
    // compute distances in augmented graph
	let [,d,,statsBM] = sptBM(g, 0);
	if (!d) return [];
	let stats = { 'stepsBM' : statsBM.stepCount };

	let ts = '';
	if (trace)
		ts += 'original graph with distances from pseudo-source' +
			  g.toString(1,0,u=>`${g.x2s(u)}:${d[u]}`);
    // transform edge lengths
    for (let e = g.first(); e; e = g.next(e)) {
        g.length(e, g.length(e) + (d[g.tail(e)] - d[g.head(e)]));
    }
	if (trace)
		ts += 'graph with non-negative edge lengths\n' + g.toString(1) +
			  'current source, tree edges, distances\n';

    // compute shortest paths & put inverse-transformed distances in dist.
	stats.stepsD = 0;
    for (let u = 1; u <= g.n; u++) {
        let [ulink,udist,,statsD] = sptD(g, u);
		assert(ulink, 'program error: negative edges in transformed graph\n' + ts);
		link.push(ulink); dist.push(udist);
		stats.stepsD += statsD.steps;
        for (let v = 1; v <= g.n; v++) dist[u][v] -= (d[u]-d[v]);
		if (trace) {
			ts += g.x2s(u) + '\n  ' +
				  g.elist2string(link[u], null, true) + '\n  ' +
				  g.nlist2string(dist[u]) + '\n';
		}
    }

    // Restore original edge lengths.
    for (let e = g.first(); e != 0; e = g.next(e)) {
        g.length(e, g.length(e) - (d[g.tail(e)] - d[g.head(e)]));
    }

	return [link, dist, ts, stats];
}
