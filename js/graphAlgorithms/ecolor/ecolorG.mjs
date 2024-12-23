/** @file ecolorG.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import findSplit from '../misc/findSplit.mjs';
import mdmatchG from '../vmatch/mdmatchG.mjs';

let g;			// shared reference to input graph
let io;         // ListPair defining bipartition on g
let wg;			// current working subgraph

let degree;		// degree[u] is the degree of u in wg
let active;		// List of vertices with non-zero degree wg
let subsets;	// vertex subsets that define bipartition
let emap;		// temp array used to map edge numbers in rcolor

let nextColor;  // next color to apply to edges
let color;		/// color[e] is color of edge e

let trace;
let traceString;

let steps;		// number of steps (inner loops)
let matches;	// number of matchings found


/** Compute a coloring of a bipartite graph using Gabow's algorithm.
 *  @param G is an undirected bipartite graph to be colored
 *  @param trace causes a trace string to be returned when true
 *  @return a pair [color, ts, stats] where color is an array of
 *  edge colors, ts is a trace string and stats is a statistics object
 */
export default function ecolorG(G, traceFlag=false) {
	// initialize data structures
	g = G; trace = traceFlag; trace = 1;
	ea && assert(g.hasBipartition);

	wg = new Graph(g.n, g.edgeRange); wg.setBipartition(g.getBipartition());
	degree = new Int32Array(g.n+1);
	active = new List(g.n);
	emap = new Int32Array(g.m+1);
	color = new Int32Array(g.edgeRange+1);

	for (let e = g.first(); e; e = g.next(e)) addEdge(e);

	traceString = '';
	if (trace) traceString += 'euler partitions and color sets\n'
	steps = matches = 0;

	nextColor = 1;
	rcolor(g.maxDegree());

	if (trace)
		traceString += g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:${color[e]}`);
	return [color, traceString, {'matches': matches, 'steps': steps }];
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
		if (trace) traceString += nextColor + ':';
		for (let e = wg.first(); e; e = wg.first()) {
			color[e] = nextColor; dropEdge(e);
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
		let cwg = new Graph(active.length,g.m);
		let io = new ListPair(active.length);
		let u = 1;
		for (let v = active.first(); v; v = active.next(v)) {
			active.value(v,u); // use value to map wg's vertices to cwg's
			if (wg.isInput(v)) io.swap(u);
			u++; steps++;
		}
		cwg.setBipartition(io);
		for (let e = wg.first(); e; e = wg.next(e)) {
			let [u,v] = [wg.input(e),wg.output(e)];
			let [uu,vv] = [active.value(u), active.value(v)];
			let ee = cwg.join(uu,vv); emap[ee] = e;
			steps++;
		}

		// get max degree matching of cwg
		let [match,,stats] = mdmatchG(cwg);
		matches++; steps += stats.steps;
		if (trace) traceString += nextColor + ':';
		for (let e = match.first(); e; e = match.next(e)) {
			let ee = emap[e]; color[ee] = nextColor; dropEdge(ee);
			if (trace) traceString += ` ${g.e2s(ee,0,1)}`;
			steps++;
		}
		if (trace) traceString += '\n';
		nextColor++; Delta--;
	}

	// wg now has even maximum degree
	let [part1,part2] = eulerPartition();
	if (trace) {
		traceString += `${Delta/2} [`;
		for (let i = 0; i < part1.length; i++)
			traceString += `${i>0 ? ' ' : ''}${g.e2s(part1[i],0,1)}`;
		traceString += ']\n  [';
		for (let i = 0; i < part2.length; i++)
			traceString += `${i>0 ? ' ' : ''}${g.e2s(part2[i],0,1)}`;
		traceString += ']\n';
	}
	for (let i = 0; i < part1.length; i++) addEdge(part1[i]);
	rcolor(Delta/2);
	for (let i = 0; i < part2.length; i++) addEdge(part2[i]);
	rcolor(Delta/2);
	// wg is now empty
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
