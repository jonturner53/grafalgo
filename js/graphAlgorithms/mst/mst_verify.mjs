/** @file mst_verify.js
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Dlists from '../../dataStructures/basic/Dlists.mjs';
import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Graph_w from '../../dataStructures/graphs/Graph_w.mjs';
import components from '../misc/components.mjs';
import nca from '../misc/nca.mjs';

// Define references to data structures shared by multiple functions
let g;			// graph for which mst is being checked
let t;			// t of g (represented as graph)

/** Check the correctness of an mst.
 *  @param G is a weighted graph object
 *  @param elist is a list of edges defining an mst, possibly with some
 *  non-positive values that are ignored
 *  @return '' if elist defines a valid mst (or min spanning forest if g is
 *  not connected), otherwise return an error message
 */
export default function mst_verify(G, elist) {
	// first initialize shared references to G and graph version of T
	g = G;
	t = new Graph_w(g.n, g.n-1);
	for (let i = 0; i < elist.length; i++) {
		let e = elist[i];
		if (e <= 0) continue;
		if (!g.validEdge(e))
			return `mst_verify: edge ${e} is not in g`
		let ee = t.join(g.left(e), g.right(e));
		t.setWeight(ee, g.weight(e));
	}

	let [tcc, tcomp] = components(t);
	let [gcc, gcomp] = components(g);
	if (tcc != gcc || !tcomp.equals(gcomp))
		return 'mst_verify: tree components do not match graph';
	if (t.m > g.n-gcc) return 'mst_verify: cycle in edge list';

	// add extra vertex to t to link components, then check weights
	t.expand(t.n+1, t.m+tcc);
	for (let u = 1; u < t.n; u++) {
		if (tcomp.isFirst(u)) t.join(t.n, u);
	}
	return checkWeight(t.n);
}

// data structures used by checkWeight
// defining them here lets us avoid passing them to recursive calls
let edgeLists;		// edgeLists partitions g's edges into subsets that all
					// share a nearest common ancestor (nca) in t
let firstEdge;		// firstEdge[u] is the first edge of a list in
					// edgeLists for which u is the nca in t
let a;				// a[u] is an ancestor of a vertex u
let mw;				// mw[u] is a max edge wt on tree path from u to a[u]

/** Recursively check that no mst edge belongs to a cycle in g with
 *  a cheaper edge.
 *  @param u is a vertex.
 *  @param pu is the parent of u in t or u, if u is the root.
 *  tree edges on the path from u to a[u]
 *  @return the string '' if the t is verified, else an error message.
 */
function checkWeight(u=1, pu=u) {
	if (pu == u) {
		// define supporting data structures
		// first, compute nca for all edges of g wrt subree rooted at u
		let pairs = []; let enumber = []; let maxe = 0;
		for (let e = g.first(); e != 0; e = g.next(e)) {
			pairs.push([g.left(e), g.right(e)]); enumber.push(e);
			maxe = Math.max(e, maxe);
		}
		let ncav = nca(t, u, pairs);
		// now use ncav to initialize edgeLists and firstEdge
		edgeLists = new Dlists(maxe); firstEdge = new Array(t.n+1).fill(0);
		for (let p = 0; p < pairs.length; p++) {
			let w = ncav[p]; let e = enumber[p];  // w is nca of e's endpoints
			firstEdge[w] = edgeLists.join(firstEdge[w], e);
		}
		a = new Array(g.n+1);
		mw = new Array(g.n+1);
	}
	// tree traversal
	for (let e = t.firstAt(u); e != 0; e = t.nextAt(u, e)) {
		let v = t.mate(u, e); if (v == pu) continue;
		a[v] = u; mw[v] = t.weight(e);
		let s = checkWeight(v, u);
		if (s != '') return s;
	}

	// now check edges joining vertices in different subtrees of u,
	// or that join a subtree to u
	for (let e = firstEdge[u]; e != 0; e = edgeLists.next(e)) {
		let m = Math.max( max_wt(g.left(e), u, a, mw),
			 			  max_wt(g.right(e), u, a, mw) );
		// m is the max weight on the tree path joining endpoints of e
		if (m > g.weight(e)) {
			return `mst_verify: cheap cross-edge ${e}=${g.edge2string(e)} in g`
		}
	}
	return ''; // all edges joining vertices in u's subtree are more
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
