/** @file mstVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Forest from '../../dataStructures/trees/Forest.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
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
export default function mstVerify(G, elist) {
	// first initialize shared references to G and graph version of mst
	g = G;
	t = new Graph(g.n, g.n-1);
	for (let i = 0; i < elist.length; i++) {
		let e = elist[i];
		if (e <= 0) continue;
		if (!g.validEdge(e))
			return `mstVerify: edge ${e} is not in g`
		let ee = t.join(g.left(e), g.right(e));
		t.weight(ee, g.weight(e));
	}

	let [tcc, tcomp] = components(t);
	let [gcc, gcomp] = components(g);
	if (tcc != gcc || !tcomp.equals(gcomp))
		return 'mstVerify: tree components do not match graph';
	if (t.m > g.n-gcc) return 'mstVerify: cycle in edge list';

	// add extra vertex to t to link components, then check weights
	t.expand(t.n+1, t.m+tcc);
	for (let u = 1; u < t.n; u++) {
		if (tcomp.isfirst(u)) t.join(t.n, u);
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
		// to do this, we first need to convert t to a Forest
		let f = new Forest(t.n);
		let q = new List(t.n); q.enq(u);
		while (!q.empty()) {
			let x = q.deq();
			for (let e = t.firstAt(x); e; e = t.nextAt(x,e)) {
				let y = t.mate(x,e);
				if (!f.p(y)) { f.link(y,x); q.enq(y); }
			}
		}
		let ncav = nca(f, g);
		// now use ncav to initialize edgeLists and firstEdge
		edgeLists = new ListSet(g.edgeRange); firstEdge = new Int32Array(t.n+1);
		for (let e = g.first(); e; e = g.next(e)) {
			let w = ncav[e]; firstEdge[w] = edgeLists.join(firstEdge[w], e);
		}
		a = new Int32Array(g.n+1);
		mw = new Int32Array(g.n+1);
	}
	// tree traversal
	for (let e = t.firstAt(u); e; e = t.nextAt(u, e)) {
		let v = t.mate(u, e); if (v == pu) continue;
		a[v] = u; mw[v] = t.weight(e);
		let s = checkWeight(v, u);
		if (s != '') return s;
	}

	// now check edges joining vertices in different subtrees of u,
	// or that join a subtree to u
	for (let e = firstEdge[u]; e; e = edgeLists.next(e)) {
		let m = Math.max( max_wt(g.left(e), u, a, mw),
			 			  max_wt(g.right(e), u, a, mw) );
		// m is the max weight on the tree path joining endpoints of e
		if (m > g.weight(e)) {
			return `mstVerify: cheap cross-edge ${e}=${g.e2s(e)} in g`
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
