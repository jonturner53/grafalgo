/** @file ecolorG.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import findSplit from '../misc/findSplit.mjs';
import mdmatchG from './mdmatchG.mjs';

let g;			// shared reference to input graph
let wg;			// current working subgraph
let euler;		// ListSet that partitions edges into paths/cycles
let handle;		// List containing first edge in each list of euler
let active;		// List of "active" vertices used by eulerPartition
let nextColor;  // next color to apply to edges
let subsets;	// vertex subsets that define bipartition
let degree;		// vertex degrees in working graph
let medge;		// array mapping vertices to incident matching edge

let traceString;

let steps;		// number of steps (inner loops)
let matches;	// number of matchings found

/** Compute a coloring of a bipartite graph using Gabow's algorithm.
 *  @param cg is an undirected bipartite graph to be colored
 *  @param trace causes a trace string to be returned when true
 *  @return a pair [ts, stats] where ts is a possibly
 *  empty trace string and stats is a statistics object;
 *  the coloring is returned as integer edge weights in g
 */
export default function ecolorG(cg, trace=false) {
	// initialize data structures
	g = cg;
	wg = new Graph(g.n, g.edgeRange); wg.assign(g);
	euler = new ListSet(g.edgeRange);
	handle = new List(g.edgeRange);
	active = new List(g.edgeRange);
	subsets = findSplit(g);
	degree = new Int32Array(g.n+1);
	medge = new Int32Array(g.n+1);

	traceString = '';
	if (trace) traceString += 'euler partitions and color sets\n'
	steps = matches = 0;

	nextColor = 1;
	rcolor(g.maxDegree(), trace);
	if (trace) traceString += g.toString(0,1);
	return [traceString, {'matches': matches, 'steps': steps}];
}

/** Recursive helper function.
 *  Colors the working graph wg, modifying it as necessary, along the way.
 *  Note: wg uses same vertex numbers and edge numbers as original graph.
 *  Also uses global data structures euler and handle, within eulerPartition
 *  method.
 *  @param Delta is the max vertex degree in the working graph wg.
 */
function rcolor(Delta, trace) {
	// if wg is a matching, just color its edges and remove from wg
	if (Delta == 1) {
		if (trace) traceString += nextColor;
		let e = wg.first();
		while (e != 0) {
			if (trace) traceString += ' ' + (g.n>26 ? e2s1(e) : e2s2(e));
			g.setWeight(e,nextColor);
			wg.delete(e); e = wg.first();
			steps++;
		}
		if (trace) traceString += '\n';
		nextColor++;
		return;
	}

	// for odd Delta, extract matching on all degree Delta vertices,
	// color its edges and remove them from wg
	if (Delta & 1) {
		let [medge,,stats] = mdmatchG(wg,0,subsets);
		matches++; steps += stats.steps;
		if (trace) traceString += nextColor;
		for (let u = 1; u < g.n; u++) {
			let e = medge[u]; steps++;
			if (e != 0 && u < g.mate(u,e)) {
				g.setWeight(e, nextColor); wg.delete(e);
				if (trace) traceString += ' ' + (g.n>26 ? e2s1(e) : e2s2(e));
			}
		}
		if (trace) traceString += '\n';
		nextColor++;
		Delta--; // decrement max degree
	}

	let m = wg.m;	// remember size of wg

	// wg now has even maximum degree
	eulerPartition();
	// now, wg has no edges but euler and handle define euler partition
	if (trace) {
		traceString += euler.toString(0,0,g.n>26 ? e2s1 : e2s2) + '\n';
	}

	// rebuild the two halves of wg defined by Euler partition
	// one after the other, and color each recursively;
	let remainder = new Int32Array(~~(m/2));
	let j = 0;
	while (!handle.empty()) {
		let e = handle.deq(); wg.join(g.left(e),g.right(e),e);
		let ee = euler.next(e); let odd = false;
		while (ee != 0) {
			if (odd) wg.join(g.left(ee), g.right(ee), ee);
            else remainder[j++] = ee;
			euler.delete(ee,e); ee = euler.next(e); odd = !odd; steps++;
		}
	}
	rcolor(Delta/2, trace);

	// now, for the other half
	for (let i = 0; i < j; i++) {
		let e = remainder[i]; wg.join(g.left(e), g.right(e), e); steps++;
	}
	rcolor(Delta/2, trace);
}

// alternate edge2string functions
function e2s1(e) { return g.edge2string(e); }
function e2s2(e) {
	return g.index2string(g.left(e)) + g.index2string(g.right(e));
}

/** Find an Euler partition in the working graph.
 *  The partition is returned in the euler/handle data structures.
 *  Specifically, handle contains the "first" edge of some edge set
 *  in the partition. The edge sets are defined by circular lists in
 *  the euler data structure.
 */
function eulerPartition() {
	for (let u = 1; u <= wg.n; u++) degree[u] = wg.degree(u);

	// make list of active vertices, beginning with those of odd degree
	// note: active guaranteed to be empty at this point
	for (let u = 1; u <= wg.n; u++) {
		let d = degree[u];
		if (d&1) active.push(u);
		else if (d>0) active.enq(u);
		steps++;
	}

	// note: handle is empty and euler is all singletons
	// traverse paths/cycles from active vertices
	// place edges in separate lists
	while (!active.empty()) {
		steps++;
		let s = active.deq();
		let e = wg.firstAt(s);
		if (e == 0) continue;
		let v = s; let ee = e;
		do {
			if (ee != e) euler.join(e,ee);
			v = wg.mate(v,ee);
			wg.delete(ee);
			ee = wg.firstAt(v);
			steps++;
		} while (ee != 0);
		handle.enq(e);
		if (wg.firstAt(s) != 0) active.enq(s);
	}
}
