/** @file tspC.mjs
 * 
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import mstP from '../../graphAlgorithms/mst/mstP.mjs';
import allpairsF from '../../graphAlgorithms/spath/allpairsF.mjs';
import wmatchE from '../../graphAlgorithms/match/wmatchE.mjs';

/** Find a traveling salesman tour, using Christofides algorithm.
 *  @param g is a weighted graph.
 *  @return a triple [[u0,tour], ts, stats] where u0 is the first vertex
 *  of the tour and tour is an array of n edges; tour may require edges not
 *  explicitly represented in g; such edges are added to g where necessary
 */
export default function tspC(g, trace=0) {
	let traceString = '';
	if (trace) traceString += `graph: ${g.toString(1)}\n`;

	let [mst] = mstP(g);
	ea && assert(mst.length == g.n-1);
	let mstWeight = 0; for (let e of mst) mstWeight += g.length(e);
	if (trace)
		traceString += `mst: ${g.elist2string(mst,0,0,1)} ${mstWeight}\n`;

	// compute a list of odd degree vertices in mst
	let deg = new Int32Array(g.n+1);
	for (let i = 0; i < mst.length; i++) {
		let e = mst[i]; deg[g.left(e)]++; deg[g.right(e)]++;
	}
	let odds = new List(g.n);
	for (let u = 1; u <= g.n; u++)
		if (deg[u]&1) odds.enq(u);
	let [link,dist] = allpairs(g);
	ea && assert(link);

	let match = matchpairs(g, odds, dist);

	if (trace)
		traceString += `matching: ${match.toString()} ${match.weight()}\n`;

	// build eulerian graph h by combining edges in mst and match;
	// note: h has same vertex numbers as g but different edge numbers
	let h = new Graph(g.n+1, mst.length + match.size());
	for (let i = 0; i < mst.length; i++) {
		let e = mst[i]; h.join(g.left(e),g.right(e));
	}
	for (let e = match.first(); e; e = match.next(e)) {
		h.join(match.left(e),match.right(e));
	}
	//if (trace) traceString += `eulerian graph: ${h.toString(1)}\n`;
	// verify that h is eulerian
	for (let u = 1; u <= h.n; u++) { ea && assert((h.degree(u)&1)  == 0); }

	// compute euler tour (List of edges) and then shortcutTour
	// (List of vertices in tsp tour)
	let u0 = h.left(h.first());
	let euler = eulerTour(h, u0);
	let sctour = shortcutTour(h, u0, euler);

	// create list of edges in tsp tour, adding edges as needed
	// to account for shortcuts
	let tour = new Int32Array(g.n);
	let tourLength = 0; let i = 0;
	for (let u = sctour.first(); u; u = sctour.next(u)) {
		let v = (u == sctour.last() ? sctour.first() : sctour.next(u));
		let e = g.findEdge(u,v);
		if (!e) { e = g.join(u,v); g.length(e, dist[u][v]); }
		tour[i++] = e; tourLength += g.length(e);
	}
	
	if (trace) traceString += `tsp tour: ${g.x2s(u0)} ` +
					`${g.elist2string(tour,0,0,1)} ${tourLength}\n`;

	return [[u0,tour], traceString,
			{'mst':mstWeight, 'match':match.weight(), 'tour':tourLength}];
}

/** Compute all pairs shortest paths in an undirected graph.
 *  @param g is an undirected graph
 *  @return [link,dist] where link[u][v] is the edge joining v to its parent
 *  in the shortest path tree rooted at u and dist[u][v] is the shortest path
 *  distance from u to v.
 */
function allpairs(g) {
	// convert g to equivalent digraph dg and compute shortest paths in dg
	let dg = new Digraph(g.n, Math.min(2*g.edgeRange+1));
	for (let e = g.first(); e; e = g.next(e)) {
		let de = dg.join(g.left(e), g.right(e), 2*e);
					dg.length(de, g.length(e));
			de = dg.join(g.right(e), g.left(e), 2*e+1);
					dg.length(de, g.length(e));
	}
	let [link,dist] = allpairsF(dg);
	// now convert edge numbers in link to match edge numbers in g
	for (let u = 1; u <= g.n; u++) {
		for (let v = 1; v <= g.n; v++)
			link[u][v] = ~~(link[u][v]/2);
	}
	return [link,dist];
}

/** Compute minium weight matching on a set of vertices
 *  @param g is a graph
 *  @param vset is a List defining a subset of g's vertices
 *  @param dist is an array where dist[u][v] defines the distance between
 *  vertices u and v
 *  @return a pair [match, mg] where the edges in match define a
 *  minimum weight matching on graph mg
 */
function matchpairs(g, vset, dist) {
	let mg = new Graph(g.n,g.edgeRange); let maxWt = 0;
	for (let u = vset.first(); u; u = vset.next(u)) {
		for (let v = vset.next(u); v; v = vset.next(v)) {
			ea && assert(dist[u][v] >= 0 && dist[u][v] != Infinity);
			let e = mg.join(u,v); mg.weight(e, dist[u][v]);
			maxWt = Math.max(mg.weight(e), maxWt);
		}
	}
	// complement weights to obtain minimum weight matching
	maxWt++;
	for (let e = mg.first(); e; e = mg.next(e))
		mg.weight(e, maxWt - mg.weight(e));
	let [match] = wmatchE(mg);
	// restore original weights
	for (let e = mg.first(); e; e = mg.next(e))
		mg.weight(e, maxWt - mg.weight(e));
	return match;
}

/** Construct an Euler tour from a specified starting point.
 *  @param h0 is an Eulerian graph
 *  @param u is a vertex in g with at least one edge
 *  @return a List of edges that forms an Euler tour of g starting at u;
 *  if g is not connected, the edges belonging to each component are
 *  listed contiguously.
 */
function eulerTour(h0,u) {
	let h = new Graph(); h.assign(h0); // working copy that can be deconstructed
	let tour = new List(h.edgeRange);
	let visited = new List(h.n);
	let arrivalEdge = new Int32Array(h.n+1);

	visited.enq(u); arrivalEdge[u] = 0;
	while (h.m) {
		let e = h.firstAt(u);
		if (e) {
			tour.insert(e, arrivalEdge[u]);
			let v = h.mate(u,e); arrivalEdge[v] = e; h.delete(e);
			if (!h.firstAt(u)) visited.delete(u);
			if (!h.firstAt(v) && visited.contains(v))
				visited.delete(v);
			if (h.firstAt(v) && !visited.contains(v))
				visited.enq(v);
			u = v;
		} else {
			u = visited.first();
		}
/*
		} else if (!visited.empty()) {
			u = visited.first();
		} else if (h.m) {
			u = h.left(g.first()); visited.enq(u); arrivalEdge[u] = 0;
		}
*/
	}
	return tour;
}

/** Compute shortcut tour from euler. */
function shortcutTour(h, u0, euler) {
	let tour = new List(h.n);
	let u = u0; tour.enq(u);
	for (let e = euler.first(); e; e = euler.next(e)) {
		u = h.mate(u, e);
		if (!tour.contains(u)) tour.enq(u);
	}
	return tour;
}

/* Construct tsp tour from eulerian graph.
 * @param g is graph
 * @param h is eulerian graph obtained from mst and matching on g
 * @param link[r][u] is the link joining vertex u to its parent in
 * a shortest path tree with root r.
 * @return a pair [u0, cycle] where u0 is the first vertex on the
 * tsp tour and cycle is a vector of edges defining cycle in g
 * that includes every vertex
function buildtour(g,h,link) {
	// build tsp vertex tour by traversing eulerian graph, inserting vertices
	// into vtour when first encountered
	let vtour = new List(g.n);
	let u = h.left(h.first());
	let pu = 0;		// insertion point for next vtour vertex
	while (h.m) {
		if (!vtour.contains(u)) {
			vtour.insert(u,pu); pu = u;
		}
		let e = h.firstAt(u);
		if (e) { u = h.mate(u,e); h.delete(e); continue; }
		// find starting point for new loop
		pu = 0;
		for (u = vtour.first(); u; u = vtour.next(u)) {
			e = h.firstAt(u);
			if (e) {
				pu = u; u = h.mate(u,e); h.delete(e); break;
			}
		}
	}

	// construct tour of edges
	// for each consecutive pair [u,v] on vtour, insert shortest path from
	// u to v by following link pointers
	let etour = new Array(2*g.n).fill(0); let etourLength = 0;
	let j = 0;
	for (let s = vtour.first(); s; s = vtour.next(s)) {

		let t = (s == vtour.last() ? vtour.first() : vtour.next(s));
		let u = s;
		do {
			let e = link[t][u];
			etour[j++] = e; u = g.mate(u,e);
			etourLength += g.length(e);
		} while (u != t);
	}
	etour.length = j;

	return [vtour.first(), etour];
}
 */
