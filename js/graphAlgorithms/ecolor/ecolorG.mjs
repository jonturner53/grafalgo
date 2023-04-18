/** @file ecolorG.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import findSplit from '../misc/findSplit.mjs';
import mdmatchG from './mdmatchG.mjs';

let g;			// shared reference to input graph
let wg;			// current working subgraph

let degree;		// degree[u] is the degree of u in wg
let active;		// List of vertices with non-zero degree wg
let subsets;	// vertex subsets that define bipartition
let emap;		// temp array used to map edge numbers in rcolor

let nextColor;  // next color to apply to edges

let trace;
let traceString;

let steps;		// number of steps (inner loops)
let matches;	// number of matchings found


/** Compute a coloring of a bipartite graph using Gabow's algorithm.
 *  @param cg is an undirected bipartite graph to be colored
 *  @param trace causes a trace string to be returned when true
 *  @return a pair [ts, stats] where ts is a possibly
 *  empty trace string and stats is a statistics object;
 *  the coloring is returned as integer edge colors in g
 */
export default function ecolorG(cg, traceFlag=false) {
	// initialize data structures
	g = cg; trace = traceFlag

	wg = new Graph(g.n, g.edgeRange);
	degree = new Int32Array(g.n+1);
	active = new List(g.n);
	emap = new Int32Array(g.m+1);

	for (let e = g.first(); e; e = g.next(e)) addEdge(e);
	subsets = findSplit(g);

	traceString = '';
	if (trace) traceString += 'euler partitions and color sets\n'
	steps = matches = 0;

	nextColor = 1;
	rcolor(g.maxDegree());

	if (trace) traceString += g.toString(1);
	return [traceString, {'matches': matches, 'steps': steps }];
}

/** Recursive helper function.
 *  Colors the working graph wg, modifying it as necessary, along the way.
 *  Note: wg uses same vertex numbers and edge numbers as original graph.
 *  Also uses global data structures paths and starters, within eulerPartition
 *  method.
 *  @param Delta is the max vertex degree in the working graph wg.
 */
function rcolor(Delta) {
	// if wg is a matching, color its edges in g and remove them from wg
	if (Delta == 1) {
		if (trace) traceString += 'aa ' + nextColor;
		for (let e = wg.first(); e; e = wg.first()) {
			g.color(e,nextColor); dropEdge(e);
			if (trace) traceString += ' ' + g.e2s(e,0,1);
			steps++;
		}
		if (trace) traceString += '\n';
		nextColor++;
		return;
	}

	// for odd Delta, extract matching on all degree Delta vertices,
	// color its edges and remove them from wg
	if (Delta & 1) {
		// first build compact version of wg with no isolated vertices
		let cg = new Graph(active.length,g.m);
		let u = 1;
		for (let v = active.first(); v; v = active.next(v)) {
			active.value(v,u++); // use value to map wg's vertices to cg's
		}
		for (let e = wg.first(); e; e = wg.next(e)) {
			let [u,v] = [wg.left(e),wg.right(e)];
			let [uu,vv] = [active.value(u), active.value(v)];
			let ee = cg.join(uu,vv); emap[ee] = e;
		}

		// get max degree matching of cg
		let [match,,stats] = mdmatchG(cg);
		matches++; steps += stats.steps;
		if (trace) traceString += 'bb ' + nextColor;
		for (let e = match.first(); e; e = match.next(e)) {
			let ee = emap[e]; g.color(ee,nextColor); dropEdge(ee);
			if (trace) traceString += ` ${g.e2s(ee,0,1)}`;
			steps++;
		}
		if (trace) traceString += '\n';
		nextColor++; Delta--;
	}

	// wg now has even maximum degree
	let [part1,part2] = eulerPartition();
	for (let i = 0; i < part1.length; i++) addEdge(part1[i]);
	rcolor(Delta/2);
	for (let i = 0; i < part2.length; i++) addEdge(part2[i]);
	rcolor(Delta/2);
}

/** Add an edge to working graph.
 *  Update vertex degrees of endpoints and active vertex list.
 *  @param e is an edge in g to be added to wg
 */
function addEdge(e) {
	let [u,v] = [g.left(e),g.right(e)];
	wg.join(u,v,e);
	if (!degree[u]) active.enq(u);
	if (!degree[v]) active.enq(v);
	degree[u]++; degree[v]++;
}

/** Drop an edge from working graph.
 *  Update vertex degrees of endpoints and active vertex list.
 *  @param e is an edge in g to be removed from wg
 */
function dropEdge(e) {
	wg.delete(e);
	let [u,v] = [g.left(e),g.right(e)];
	degree[u]--; degree[v]--;
	if (!degree[u]) active.delete(u);
	if (!degree[v]) active.delete(v);
}
	
/** Find an Euler partition in the working graph.
 *  The partition is returned in Lists part1 and part2.
 */
function eulerPartition() {
	// first bring odd degree vertices to front of active list
	let nextu; let odds = 0;
	for (let u = active.first(); u; u = nextu) {
		nextu = active.next(u);
		if (degree[u]&1) {
			active.delete(u); active.push(u); odds++;
		}
		steps++;
	}

	let part1 = new Int32Array(wg.m&1 ? (wg.m+1)/2 : wg.m/2);
	let part2 = new Int32Array(wg.m&1 ? (wg.m-1)/2 : wg.m/2);
	let n1 = 0; let n2 = 0;
	while (!active.empty()) {
		let first = active.first();
		let v = first; let e = wg.firstAt(v);
		let balance = (n1 <= n2 ? 1 : 0);
		do {
			if (balance) part1[n1++] = e;
			else         part2[n2++] = e;
			v = g.mate(v,e); dropEdge(e);
			e = wg.firstAt(v);
			balance = !balance; steps++;
		} while (e);
		if (active.contains(first)) {
			// first no longer has odd degree, so move to end of active
			active.delete(first); active.enq(first);
		} 
	}
	return [part1,part2];
}
