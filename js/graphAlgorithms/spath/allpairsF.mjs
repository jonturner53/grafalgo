/** @file allpairsF.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

/** Compute shortest pairs among all pairs of vertices using Floyd's algorithm.
 *  @param g is a digraph with edge lengths
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [error, pedge, dist, ts, stats] where error is an empty
 *  string on success and an error string on failure, pedge[s][u] is the edge
 *  from the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[s][u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is a
 *  statistics object.
 */
export default function allpairsF(g, trace=false) {
	let dist = new Array(g.n+1); let pedge = new Array(g.n+1);
	const inf = Number.POSITIVE_INFINITY;
    
    // initialize dist and p
    for (let u = 1; u <= g.n; u++) {
		dist[u] = new Array(g.n+1).fill(inf); dist[u][u] = 0;
		pedge[u] = new Array(g.n+1).fill(0);
    }   

    for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = g.tail(e); let v = g.head(e);
        dist[u][v] = g.length(e); pedge[u][v] = e;
    }   

	let ts = '';
	if (trace)
		ts += g.toString(0,1) + 'current midpoint plus updates\n'; 
    
    // compute distances
	let updates = 0;
    for (let s = 1; s <= g.n; s++) {
        if (dist[s][s] < 0)
			return ['Error: negative cycle in graph', pedge, dist];
		if (trace)
			ts += g.index2string(s) + ': ';
        for (let v = 1; v <= g.n; v++) {
            for (let w = 1; w <= g.n; w++) {
                if (dist[v][w] > dist[v][s] + dist[s][w]) {
                    dist[v][w] = dist[v][s] + dist[s][w]; 
                    pedge[v][w] = pedge[s][w];  
					if (trace)
						ts += g.index2string(v) +
							  g.edge2string(pedge[v][w]) + ' ';
					updates++;
                }   
            }   
        }   
		if (trace) ts += '\n';
	}
	return ['', pedge, dist, ts, { 'steps': g.n*g.n*g.n, 'updates': updates }];
}
