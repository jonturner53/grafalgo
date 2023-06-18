/** @file nca.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

// Nearest common ancestor computation.
// Algorithm uses depth-first search in forest. A vertex u is considered
// "open" if the processing at u is not yet complete.
// After that point, u is considered closed. Once a subtree of u has been
// visited, it becomes their "nearest open ancestor" (noa). The nca of
// a pair [u, v] can be computed if v is already closed. In particular,
// nca(u,v) is then noa(v).
//
// data structures used by algorithm
let f;			// forest defining hierarchy
let g;			// edges define pairs for which nca is computed
let noa;		// noa[u] is the nearest open ancestor of u
let noaSets;	// divides vertices into sets that share the same noa
let mark;		// used to mark edge after its first vertex is visited
let ncav;		// on return ncav[e] is nearest common ancestor of edge e

/** Compute the nearest common ancestors of vertex pairs.
 *  @param F is a Forest object
 *  @param g is a graph with g.n <= F.n
 *  @return a vector ncav where ncav[e] is the nearest common ancestor in F
 *  of the endpoints of edge e in g.
 */
export default function nca(F, G) {
	f = F; g = G;
	noa = new Int32Array(f.n+1);	
	noaSets = new MergeSets(f.n);
	mark = new Int8Array(g.edgeRange+1);
	ncav = new Int32Array(g.edgeRange+1);

	for (let w = 1; w <= f.n; w++) {
		noa[w] = 0;  // changes once w is closed
	}
	for (let u = 1; u <= f.n; u++) {
    	if (!f.p(u)) {
			helper(u); noa[noaSets.find(u)] = 0;
		}
	}
	return ncav;
}

/** Recursive helper function. */
function helper(u) {
	noa[u] = u;
	for (let c = f.firstChild(u); c; c = f.nextSibling(c)) {
		helper(c);
		noa[noaSets.merge(noaSets.find(u), noaSets.find(c))] = u;
		noa[noaSets.find(u)] = u;
	}
	if (!g.validVertex(u)) return;
	for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
		if (!mark[e]) mark[e] = true;
		else          ncav[e] = noa[noaSets.find(g.mate(u,e))];
	}
}

