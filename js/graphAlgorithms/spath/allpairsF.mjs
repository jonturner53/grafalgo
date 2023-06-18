/** @file allpairsF.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

/** Compute shortest pairs among all pairs of vertices using Floyd's algorithm.
 *  @param g is a digraph with edge lengths
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [error, link, dist, ts, stats] where error is an empty
 *  string on success and an error string on failure, link[s][u] is the edge
 *  from the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[s][u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is a
 *  statistics object.
 */
export default function allpairsF(g, trace=false) {
	let dist = []; dist.push(null);
	let link = []; link.push(null);
    
    // initialize dist and p
    for (let u = 1; u <= g.n; u++) {
		dist.push(new Array(g.n+1).fill(Infinity)); dist[u][u] = 0;
		link.push(new Int32Array(g.n+1));
    }   

    for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = g.tail(e); let v = g.head(e);
        dist[u][v] = g.length(e); link[u][v] = e;
    }   

	let ts = '';
	if (trace)
		ts += g.toString(1) + 'current midpoint plus link updates\n'; 
    
    // compute distances
	let updates = 0;
    for (let s = 1; s <= g.n; s++) {
		if (dist[s][s] < 0) return [];
		if (trace)
			ts += g.x2s(s) + ': ';
        for (let v = 1; v <= g.n; v++) {
            for (let w = 1; w <= g.n; w++) {
                if (dist[v][w] > dist[v][s] + dist[s][w]) {
                    dist[v][w] = dist[v][s] + dist[s][w]; 
                    link[v][w] = link[s][w];  
					if (trace)
						ts += g.x2s(v) + ':' + dist[v][w] + 
							  g.e2s(link[v][w]) + ' ';
					updates++;
                }   
            }   
        }   
		if (trace) ts += '\n';
	}
	return [link, dist, ts, { 'steps': g.n*g.n*g.n, 'updates': updates }];
}
