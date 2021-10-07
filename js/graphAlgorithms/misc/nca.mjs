/** @file nca.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

// Nearest common ancestor computation.
// Algorithm uses depth-first search in tree. A vertex u is considered
// "open" if the processing at u is not yet complete.
// After that point, u is considered closed. Once a subtree of u has been
// visited, it becomes their "nearest open ancestor" (noa). The nca of
// a pair [u, v] can be computed if v is already closed. In particular,
// nca(u,v) is then noa(v).
//
// data structures used by algorithm
let g;			// graph with edges corresponding to nca pairs pairs
let noa;		// noa[u] is the nearest open ancestor of u
let noaSets;	// divides vertices into sets that share the same noa
let mark;		// used to mark pair after their first vertex is visited
let ncav;		// on return ncav[p] is nearest common ancestor of pair[p]

/** Compute the nearest common ancestors of vertex pairs.
 *  @param T is an undirected graph object that defines a tree
 *  @param root is the vertex that is considered the root of T.
 *  @param pairs is a vector of vertex pairs in T
 *  @param u is a vertex in t; this parameter is used in recursive
 *  invocations used to search the tree
 *  @param pu is the parent of u in the depth-first-search, or u
 *  if u is the root.
 *  @return a vector ncav where ncav[p] is the nearest common ancestor in T
 *  of the vertices in pairs[p]
 */
export default function nca(t, root, pairs, u=root, pu=u) {
	// first initialize shared references to G and graph version of T

	if (u == root) { // top-level invocation, so initialize data structures
		g = new Graph(t.n, pairs.length);
		noa = new Array(g.n+1);	
		noaSets = new Dsets(t.n);
		mark = new Array(pairs.length);
		ncav = new Array(pairs.length);

		for (let w = 1; w <= t.n; w++) {
			noa[w] = w;  // changes once w is closed
		}
		for (let p = 0; p < pairs.length; p++) {
			ncav[p] = 0; mark[p] = false;
			g.join(pairs[p][0], pairs[p][1], p+1);
		}
	}

	// traverse neighbors in t
	for (let e = t.firstAt(u); e != 0; e = t.nextAt(u, e)) {
		let v = t.mate(u, e);
		if (v == pu) continue;
		nca(t, root, pairs, v, u);
		noaSets.link(noaSets.find(u), noaSets.find(v));
		noa[noaSets.find(u)] = u;
	}

	// now, compute nca of pairs that join u to closed neighbors
	// note: this is where the graph representation of pairs is used
	for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e)) {
		if (!mark[e-1]) mark[e-1] = true;
		else 			ncav[e-1] = noa[noaSets.find(g.mate(u,e))];
	}

	if (u == root) return ncav;
}
