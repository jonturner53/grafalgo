/** @file dcsGT.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Matching from '../match/Matching.mjs';
import matchEG from '../match/matchEG.mjs';
import wmatchE from '../match/wmatchE.mjs';
import wperfectE from './wperfectE.mjs';

let steps;

/** Compute a degree-constrained subgraph in a general graph
 *  using Tutte's reduction to a matching problem and Gabow's
 *  reduction from degree-constrained subgraph to the version
 *  for upper bounds only.
 *  @param g is an undirected bipartite graph
 *  @param hi is an array mapping vertices to degree upper bounds;
 *  if omitted a bound of 1 is used
 *  @param lo is an array mapping vertices to degree lower bounds;
 *  if omitted a bound of 0 is used
 *  @return a triple [dcs, ts, stats] where dcs is a Graph object;
 *  ts is a possibly empty trace string and stats is a statistics object;
 *  if lo>0, the returned dcs will satisfy the
 *  specified minimum degree requirements if it is possible to do so
 *  @param trace causes a trace string to be returned when true
 */
export default function dcsGT(g, hi, lo=0, trace=0) {
	steps = 0; let traceString = '';
	
	if (trace) {
		traceString += g.toString(1,0,u =>
							`${g.x2s(u)}(${hi[u]}${lo ? ','+lo[u] : ''})`);
	}

	let sub = !lo ? (g.hasWeights ? wudcs(g,hi)   : udcs(g,hi)  ) :
					(g.hasWeights ? wdcs(g,hi,lo) : dcs(g,hi,lo));
	if (sub == null)
		return [null, 'infeasible degree bounds', {}];

	if (trace) {
		traceString += '\ndcs: ' + sub.toString(1,0, u =>
							`${sub.x2s(u)}(${hi[u]}${lo ? ','+lo[u] : ''})`);
	}

	return [sub, traceString, {'steps': steps}];
}

/** Compute a maximum size degree-constrained subgraph for the upper
 *  bound only case.
 *  @param g is a graph
 *  @param hi is an array mapping vertices to upper bounds
 *  @param isub is an optional initial subgraph
 *  @param return a subgraph of maximum size that respects the degree bounds;
 *  the vertex degrees in the returned subgraph are at least as large as those
 *  in the initial subgraph
 */
function udcs(g, hi, isub=0) {
	let tg = tutteGraph(g, hi);
	let imatch = new Matching(tg);
	if (isub) {
		for (let e = isub.first(); e; e = isub.next(e))
			imatch.add(e);
	}
	for (let e = tg.first(); e; e = tg.next(e)) {
		if (!g.validEdge(e) &&
			!imatch.at(tg.left(e)) && !imatch.at(tg.right(e)))
			imatch.add(e);
	}
	let [match,,stats] = matchEG(tg, imatch);
	steps += tg.m + stats.steps;
	return match2sub(match, g);
}

/** Extract a subgraph from a matching.
 *  @param match is a matching on subgraph
 *  @param g is a matching which forms a subgraph of the graph on which
 *  match is defined
 *  @return the subgraph of g containing every edge of g that is also in match
 */
function match2sub(match, g) {
	let sub = new Graph(g.n,g.edgeRange);
	for (let e = g.first(); e; e = g.next(e)) {
		if (match.contains(e)) {
			sub.join(g.left(e), g.right(e), e);
			if (g.hasWeights) sub.weight(e, g.weight(e));
		}
	}
	steps += match.size();
	return sub;
}

/** Compute a maximum weight degree-constrained subgraph for the upper
 *  bound only case.
 *  @param g is a graph
 *  @param hi is an array mapping vertices to upper bounds
 *  @param complete is an optional flag, which if true specifies a complete
 *  udcs (one in which the degree of every vertex matches the upper bound)
 *  of maximum weight
 *  @param return a dcs of maximum weight that respects the degree bounds;
 *  if complete is true and g has no complete matching, the returned dcs
 *  is a maximum size matching of maximum weight
 */
function wudcs(g, hi, complete=false) {
	let tg = tutteGraph(g,hi);
	let W = maxweight(g);
	for (let e = tg.first(); e; e = tg.next(e)) {
		if (!g.validEdge(e)) tg.weight(e, W+1);
	}
	let [match,,stats] = complete ? wperfectE(tg,0,1) : wmatchE(tg);
	steps += tg.m + stats.steps;
	return match2sub(match, g);
}

/** Return the maximum edge weight for a graph. */
function maxweight(g) {
	let W = 0;
	for (let e = g.first(); e; e = g.next(e))
		W = Math.max(W,g.weight(e));
	return W;
}

/** Compute a maximum size degree-constrained subgraph for the general case.
 *  @param g is a graph
 *  @param hi is an array mapping vertices to upper degree bounds
 *  @param lo is an array mapping vertices to lower degree bounds
 *  @param return a subgraph of maximum size that respects the degree bounds
 */
function dcs(g, hi, lo) {
	// find complete udcs of Gabow graph
	let [gg,gghi] = gabowGraph(g, hi, lo);
	let cdcs = udcs(gg, gghi);
	let sum = gghi.reduce((a,v)=>a+v, 0);
	if (sum != 2*cdcs.m) return null;

	// find largest udcs of g that includes edges from cdcs 
	let isub = new Graph(g.n,g.edgeRange);
	for (let e = g.first(); e; e = g.next(e)) {
		if (cdcs.validEdge(e)) isub.join(g.left(e), g.right(e), e);
	}
	return udcs(g, hi, isub);
}

/** Compute a maximum weight degree-constrained subgraph for the general case.
 *  @param g is a graph
 *  @param hi is an array mapping vertices to upper degree bounds
 *  @param lo is an array mapping vertices to lower degree bounds
 *  @param return a subgraph of maximum weight that respects the degree bounds
 */
function wdcs(g, hi, lo) {
	// find complete udcs of Gabow graph of maximum weight
	let [gg,gghi] = gabowGraph(g, hi, lo);
	let cdcs = wudcs(gg, gghi, true);
	let sum = gghi.reduce((a,v)=>a+v, 0);
	if (sum != 2*cdcs.m) return null;

	// extract g's edges from cdcs
	let sub = new Graph(g.n, g.edgeRange);
	for (let e = g.first(); e; e = g.next(e)) {
		if (cdcs.validEdge(e)) {
			sub.join(g.left(e), g.right(e), e);
			if (g.hasWeights) sub.weight(e, g.weight(e));
		}
	}
	return sub;
}

/** Compute the Tutte graph for a given graph.
 *  @param g is a Graph object
 *  @param hi is an Array of degree upper bounds for g
 *  @return a Graph object tg where matchings in tg define degree-constrained
 *  subgraphs in g (upper bounds only).
 */
export function tutteGraph(g,hi) {
	// preliminaries
	let n = 0; let m = g.m;
	let d = new Int32Array(g.n+1);    // d[u]=degree(u)
	let base = new Int32Array(g.n+1); // base[u]=first vertex in u's cluster
	let b = 1;
	for (let u = 1; u <= g.n; u++) {
		d[u] = g.degree(u); base[u] = b;
		assert(0 <= hi[u] && hi[u] <= d[u]);
		let nu = 2*d[u] - hi[u];
		b += nu; n += nu; m += d[u]*(d[u]-hi[u]);
		steps++;
	}
	let tg = new Graph(n, m >= g.edgeRange ? m : g.edgeRange);
	// define inter-custer edges
	let offset = new Int32Array(g.n+1);
		// offset[u] determines position of next edge in u's cluster
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		tg.join(base[u] + offset[u]++, base[v] + offset[v]++, e); 
		steps++;
	}
	// define intra-cluster edges
	for (let u = 1; u <= g.n; u++) {
		let nu = (u < g.n ? base[u+1] : tg.n+1) - base[u];
		for (let i = 0; i < d[u]; i++) { // i identifies external vertex
			for (let j = d[u]; j < nu; j++) { // j identifies internal vertex
				let me = tg.join(base[u]+i, base[u]+j);
				steps++;
			}
		}
	}
	return tg;
}

/** Compute the Gabow reduction and return resulting graph and degree
 *  upper bounds.
 *  @param g is a Graph object
 *  @param hi is an Array of degree upper bounds for g
 *  @param lo is an Array of degree lower bounds for g
 *  @return a pair [gg,gghi] where gg is a Graph object that includes a
 *  copy of g and in which fully constrained subgraphs of g correspond to
 *  subgraphs constrained only by upper bounds; gghi is the upper degree
 *  bound for gg
 */
export function gabowGraph(g, hi, lo) {
	// determine size of Gabow Graph and instantiate it
	let n = 2*g.n; let m = 2*g.m;
	for (let u = 1; u <= g.n; u++) {
		n += 2 * (hi[u] - lo[u]); m += 3 * (hi[u] - lo[u]);
	}
	steps += g.n;

	if (m >= g.edgeRange ? m : g.edgeRange);
	let gg = new Graph(n,m);

	// first copy of g uses same edge numbers as g and inherits weights
	for (let e = g.first(); e; e = g.next(e)) {
		gg.join(g.left(e), g.right(e), e);
		if (g.weight) gg.weight(e, g.weight(e));
	}
	steps += g.m;

	// second copy can use any edge numbers and has zero weight
	for (let e = g.first(); e; e = g.next(e)) {
		gg.join(g.n+g.left(e), g.n+g.right(e));
	}
	steps += g.m;

	// add chains linking copies
	let gghi = new Int32Array(gg.n+1);
	let v = 2*g.n+1; // used to enumerate chain vertices
	for (let u = 1; u <= g.n; u++) {
		gghi[u] = gghi[g.n+u] = hi[u];
		for (let i = 1; i <= hi[u] - lo[u]; i++) {
			gg.join(u,v); gg.join(v,v+1); gg.join(v+1,g.n+u);
			gghi[v] = gghi[v+1] = 1; v += 2;
		}
		steps++;
	}
	return [gg,gghi];
}	
