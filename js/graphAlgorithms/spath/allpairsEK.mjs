/** @file allpairsEK.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

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
 *  @return a tuple [error, pedge, dist, ts, stats] where error is an empty
 *  string on success and an error string on failure, pedge[s][u] is the edge
 *  from the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[s][u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is
 *  a statistics object.
 */
export default function allpairsEK(g, trace) {
	let dist = []; dist.push(null);
	let pedge = []; pedge.push(null);
    
    // compute distances in augmented graph
	let [err,pe,d,,statsBM] = sptBM(g, 0);
	let stats = { 'stepsBM' : statsBM.stepCount };
	if (err.length > 0) return [err, null, null];

	let ts = '';
	if (trace) ts += g.toString(0,1);
    // transform edge lengths
    for (let e = g.first(); e != 0; e = g.next(e)) {
        g.setLength(e, g.length(e) + (d[g.tail(e)] - d[g.head(e)]));
    }
	if (trace)
		ts += 'graph with non-negative edge lengths\n' + g.toString(0,1) +
			  'current source, tree edges, distances\n';

    // compute shortest paths & put inverse-transformed distances in dist.
	stats.stepsD = 0;
    for (let u = 1; u <= g.n; u++) {
        let [,pu,du,,statsD] = sptD(g, u);
		pedge.push(pu); dist.push(du);
		stats.stepsD += statsD.siftup + statsD.siftdown;
        for (let v = 1; v <= g.n; v++) dist[u][v] -= (d[u]-d[v]);
		if (stats) {
			ts += g.index2string(u) + '\n' +
				  g.elist2string(pedge[u], null, true) + '\n' +
				  g.nlist2string(dist[u]) + '\n';
		}
    }

    // Restore original edge lengths.
    for (let e = g.first(); e != 0; e = g.next(e)) {
        g.setLength(e, g.length(e) - (d[g.tail(e)] - d[g.head(e)]));
    }

	return ['', pedge, dist, ts, stats];
}
