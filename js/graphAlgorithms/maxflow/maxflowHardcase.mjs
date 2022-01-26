/** @file hardcase.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import { assert } from '../../common/Errors.mjs';

/** Compute maximum flow in graph with positive minimum flow requirements.
 *  @param g is Flograph with lower bounds, possibly with some initial flow.
 *  @param algo is a reference to a function that computes ordinary max flows;
 *  note: does not work with maxflowDST, due to use of dynamic trees 
 *  @param trace is a flag that enables execution tracing
 */

/** Generate a flow graph that takes a long time to complete.
 *  The generated graphs are particularly hard for augmenting
 *  path algorithms that augment along shortest paths, and
 *  closely related algorithms, like Dinic's algorithm.
 * 
 *  @param k1 is a parameter that controls the number of distinct
 *  augmenting path lengths (aka phases)
 *  @param k2 is a parameter that controls both the number of phases
 *  and the time required for each augmenting path search
 *  @return the requested Flograph object
 *  
 *  The generated graphs have 16*k1 + 2*k2 + 6 vertices and
 *  20*k1 + k2^2 + 4*k2 edges and a max flow of 2*k1*k2^2.
 */
export default function hardcase(k1, k2) {
	// determine first vertex in each group
	let c1 = 2;		// start of short chain from source
	let c2 = c1 + 4*k1;	// start of long chain from source
	let bl = c2 + 4*k1 + 2;	// start of 1st vertex group in bipartite graph
	let br = bl + k2;	// start of 2nd vertex group in bipartite graph
	let c3 = br + k2;	// start of long chain to sink
	let c4 = c3 + 4*k1 + 2;	// start of short chain to sink

	let n = c4 + 4*k1;
	let m = 20*k1 + k2*k2 + + 4*k2;	

	let g = new Flograph(n,m);
	g.setSource(1); g.setSink(n);

	// build short chain from source
	let e;
	for (let i = 0; c1+i < c2-1; i++) {
		if ((i%4) == 0) { 
			e = g.join(g.source,c1+i); g.setCapacity(e,k2*k2);
		}
		e = g.join(c1+i,c1+i+1); g.setCapacity(e,k1*k2*k2);
	}
	// build long chain from source
	for (let i = 0; c2+i < bl-1; i++) {
		if ((i%4) == 0 && c2+i < bl-3) { 
			e = g.join(g.source,c2+i); g.setCapacity(e,k2*k2);
		}
		e = g.join(c2+i,c2+i+1); g.setCapacity(e,k1*k2*k2);
	}
	// connect source chains to bipartite graph
	for (let i = 0; i < k2; i++) {
		e = g.join(c2-1,bl+i); g.setCapacity(e,k1*k2); 
		e = g.join(bl-1,br+i); g.setCapacity(e,k1*k2);
	}
	// build central bipartite graph
	for (let i = 0; i < k2; i++) {
		for (let j = 0; j < k2; j++) {
			e = g.join(bl+i, br+j); g.setCapacity(e,1);
		}
	}
	// connect bipartite graph to sink chains
	for (let i = 0; i < k2; i++) {
		e = g.join(bl+i,c3); g.setCapacity(e,k1*k2); 
		e = g.join(br+i,c4); g.setCapacity(e,k1*k2);
	}
	// build long chain to sink
	for (let i = 0; c3+i < c4-1; i++) {
		if ((i%4) == 1 && i > 1) {
			e = g.join(c3+i,g.sink); g.setCapacity(e,k2*k2);
		}
		e = g.join(c3+i,c3+i+1); g.setCapacity(e,k1*k2*k2);
	}
	e = g.join(c4-1,g.sink); g.setCapacity(e,k2*k2);
	// build short chain to sink
	for (let i = 0; c4+i < n-1; i++) {
		if ((i%4) == 3) { 
			e = g.join(c4+i,g.sink); g.setCapacity(e,k2*k2);
		}
		e = g.join(c4+i,c4+i+1); g.setCapacity(e,k1*k2*k2);
	}
	e = g.join(n-1,g.sink); g.setCapacity(e,k2*k2);

	return g;
}
