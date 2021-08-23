/** @file mst_verify.js
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Dlists from '../../dataStructures/basic/Dlists.mjs';
import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Heap_d from '../../dataStructures/heaps/Heap_d.mjs';
import Graph_w from '../../dataStructures/graphs/Graph_w.mjs';
import nca from '../misc/nca.mjs';

// Define references to data structures shared by multiple functions
let g;				// graph for which mst is being checked
let mst;			// mst of g (represented as graph)

/** Check the correctness of an mst.
 *  @param G is a weighted graph object
 *  @param T is an array of the edges in the mst.
 *  @return 'ok' if tree is a valid mst, otherwise return an error message
 */
export default function mst_verify(G, T) {
	// first initialize shared references to G and graph version of T
	g = G;
	mst = new Graph_w(g.n, g.n, g.n-1);
	for (let i = 0; i < T.length; i++) {
		let e = T[i];
		let ee = mst.join(g.left(e), g.right(e));
		mst.setWeight(ee, g.weight(e));
	}

	// check that mst is a subgraph of g
	if (mst.n != g.n || mst.m != mst.n-1) {
		return 'mst_verify: size error';
	}
	let edgeTo = new Array(mst.n+1);
	for (let u = 1; u <= g.n; u++) edgeTo[u] = 0;
	for (let u = 1; u <= g.n; u++) {
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e))
			edgeTo[g.mate(u, e)] = e;
		for (let f = mst.firstAt(u); f != 0; f = mst.nextAt(u, f)) {
			let v = mst.mate(u, f);
			let e = edgeTo[v];
			if (e == 0 || mst.weight(f) != g.weight(e)) {
				return String.format("mst_verify: edge %d=%s is not in g",
								  	 f, mst.edge2string(f));
			}
		}
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e))
			edgeTo[g.mate(u, e)] = 0;
	}

	// check that mst reaches all the vertices
	let mark = new Array(mst.n+1); let marked;
	for (let u = 1; u <= mst.n; u++) mark[u] = false;
	mark[1] = true; marked = 1;
	let q = new List(g.n); q.enq(1);
	while (!q.empty()) {
		let u = q.deq();
		for (let e = mst.firstAt(u); e != 0; e = mst.nextAt(u, e)) {
			let v = mst.mate(u, e);
			if (!mark[v]) {
				q.enq(v); mark[v] = true; marked++;
			}
		}
	}
	if (marked != mst.n) {
		return 'mst_verify: tree does not reach all vertices';
	}

	// now, check that there is no cheaper spanning tree
	return checkWeight();
}

// data structures used by checkWeight
// defining them here lets us avoid passing them to recursive calls
let edgeLists;		// edgeLists partitions g's edges into subsets that all
					// share a nearest common ancestor (nca) in mst
let firstEdge;		// firstEdge[u] is the first edge of a list in
					// edgeLists for which u is the nca in mst
let a;				// a[u] is an ancestor of a vertex u
let mw;				// mw[u] is a max edge wt on tree path from u to a[u]

/** Recursively check that no mst edge belongs to a cycle in g with
 *  a cheaper edge.
 *  @param u is a vertex.
 *  @param pu is the parent of u in mst or u, if u is the root.
 *  tree edges on the path from u to a[u]
 *  @return the string 'ok' if the mst is verified, else an error message.
 */
function checkWeight(u=1, pu=u) {
	if (pu == u) {	// top-level, intialize data structures
		// compute nca for all edges of g wrt mst rooted at u
		let pairs = []; let enumber = [];
		for (let e = g.first(); e != 0; e = g.next(e)) {
			pairs.push([g.left(e), g.right(e)]); enumber.push(e);
		}
		let ncav = nca(mst, u, pairs);
		// now use ncav to initialize edgeLists and firstEdge
		edgeLists = new Dlists(g.m); firstEdge = new Array(g.n+1).fill(0);
		for (let p = 0; p < pairs.length; p++) {
			let w = ncav[p]; let e = enumber[p];  // w is nca of e's endpoints
			firstEdge[w] = edgeLists.join(firstEdge[w], e);
		}
		a = new Array(g.n+1);
		mw = new Array(g.n+1);
	}
	// tree traversal
	for (let e = mst.firstAt(u); e != 0; e = mst.nextAt(u, e)) {
		let v = mst.mate(u, e); if (v == pu) continue;
		a[v] = u; mw[v] = mst.weight(e);
		let s = checkWeight(v, u);
		if (s != 'ok') return s;
	}

	// now check edges joining vertices joining different subtrees of u,
	// or that join a subtree to u
	for (let e = firstEdge[u]; e != 0; e = edgeLists.next(e)) {
		let m = Math.max( max_wt(g.left(e), u, a, mw),
			 			  max_wt(g.right(e), u, a, mw) );
		// m is the max weight on the tree path joining endpoints of e
		if (m > g.weight(e)) {
			return `mst_verify: cheap cross-edge ${e}=${g.edge2string(e)} in g`
		}
	}
	return 'ok'; // all edges joining vertices in u's subtree are more
				 // expensive than the tree path joining them
}

/** Return the maximum weight of edges on a path.
 *  Performs path compression as a side-effect, to speed-up process.
 *  @param u is a vertex
 *  @param v is an ancestor of u
 *  @param a contains ancestor pointers used to speed path searches
 *  @param mw[x] is the maximum weight on the path from a vertex x
 *  to its ancestor a[x]
 */
function max_wt(u, v, a, mw) {
	if (u == v) return 0;
	let m = Math.max(mw[u], max_wt(a[u], v, a, mw));
	a[u] = v; mw[u] = m;
	return m;
}
