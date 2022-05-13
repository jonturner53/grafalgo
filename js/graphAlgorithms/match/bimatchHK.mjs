/** @file bimatchHK.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import findSplit from '../misc/findSplit.mjs';

let g;           // shared copy of graph
let medge;       // medge[u] is edge incident to u in matching or 0
let pedge;       // pedge[u] is parent edge of u in forest
let roots;       // roots contains roots of trees in forest
let level;       // level[u] is distance to u from a root
let nextedge;    // nextedge[u] is next edge at u to be processed

let trace;
let traceString;

let phases;      // number of phases completed
let paths;       // number of paths found
let pathSteps;   // number of steps spent finding paths

/** Compute a maximum matching in a bipartite graph using the
 *  Hopcroft-Karp algorithm.
 *  @param g is an undirected bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Graph containing
 *  just the matching edges, ts is a possibly empty trace string
 *  and stats is a statistics object; both from Dinic's algorithm
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function bimatchHK(bg, traceFlag=false) {
	g = bg; trace = traceFlag; traceString = '';
	medge = new Int32Array(g.n+1);
	pedge = new Int32Array(g.n+1);

	// divide vertices into two independent sets
	let split = findSplit(g);
	assert(split != null, "bimatchHK: graph not bipartite");

	// add edges to medge, yielding maximal (not maximum) matching
	let matching = new Graph(g.n, g.edgeRange);
	if (trace) traceString += g.toString(0,1) + 'initial matching: [';
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = g.left(e); let v = g.right(e);
		if (medge[u] == 0 && medge[v] == 0) {
			medge[u] = medge[v] = e;
			matching.join(g.left(e), g.right(e), e);
            if (trace) traceString += g.edge2string(e) + ' ';
		}
	}
	if (trace) {
		traceString = traceString.slice(0,-1) + ']\n';
	}
	phases = paths = pathSteps = 0;

	// add unmatched vertices from in-set to roots
	pedge = new Int32Array(g.n+1);
	roots = new List(g.n); roots.addPrev();
	for (let u = split.firstIn(); u != 0; u = split.nextIn(u))
		if (medge[u] == 0) roots.enq(u);

	level = new Int32Array(g.n+1);
	nextedge = new Int32Array(g.n+1);
	while (newPhase()) {
		phases++;
		let r = roots.first();
		while (r != 0) {
			paths++;
			let u = findpath(r);
			if (u == 0) {
				r = roots.next(r);
			} else {
				augment(u);
				let nr = roots.next(r);
				roots.delete(r);
				r = nr;
			}
		}
	}

	if (trace) traceString += '  final matching: [';
	matching.clear();
	for (let u = split.firstIn(); u != 0; u = split.nextIn(u)) {
		let e = medge[u];
		if (e != 0 && u == g.left(e)) {
			matching.join(u, g.right(e), e);
            if (trace) traceString += g.edge2string(e) + ' ';
		}
	}
	if (trace) {
		traceString = traceString.slice(0,-1) + ']\n';
	}
    return [matching, traceString,
			{'phases': phases, 'paths': paths, 'pathSteps': pathSteps}];
}

/** Prepare for new phase. 
 *  @return true if there is an augmenting path.
 */
function newPhase() {
	for (let u = 1; u <= g.n; u++) {
		level[u] = g.n; nextedge[u] = g.firstAt(u);
	}
	let q = new List(g.n);
	for (let u = roots.first(); u != 0; u = roots.next(u)) {
		level[u] = 0; q.enq(u);
	}
	let stopLevel = g.n; // used to terminate early
	// label each vertex with its distance from the nearest root
	// in matching forest
	while (!q.empty()) {
		let u = q.deq(); // u in in-set
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			if (e == medge[u]) continue;
			let v = g.mate(u,e); // v in out-set
			if (level[v] != g.n) continue;
			// first time we've seen v
			level[v] = level[u] + 1; 
			let ee = medge[v];
			if (ee == 0) stopLevel = level[v]; // alt-path here too
			if (stopLevel == level[v]) continue;
			let w = g.mate(v,ee);
			level[w] = level[v] + 1;
			q.enq(w);
		}
	}
	return (stopLevel != g.n);
}

/** Find an augmenting path from specified vertex.
 *  @param u is a vertex in the in-set
 *  @return an unmatched vertex in the out-set, or 0 if there is no
 *  admissible path to such a vertex in the current phase;
 *  on successful return, the pedge array defines
 *  the augmenting path from the returned vertex back to u
 */
function findpath(u) {
	for (let e = nextedge[u]; e != 0; e = g.nextAt(u,e)) {
		pathSteps++;
		let v = g.mate(u,e);
		if (level[v] != level[u] + 1) continue;
		let ee = medge[v];
		if (ee == 0) { nextedge[u] = e; pedge[v] = e; return v; }
		let w = g.mate(v,ee);
		if (level[w] != level[v] + 1) continue;
		let t = findpath(w);
		if (t != 0) {
			pedge[v] = e; pedge[w] = ee; nextedge[u] = e; return t;
		}
	}
	nextedge[u] = 0; return 0;
}

/** Flip the edges along an augmenting path
 *  @param u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the pedge pointers
 */
function augment(u) {
	let ts = '';
	if (trace) ts += g.index2string(u);
	while (true) {
		let e = pedge[u];
		let v = g.mate(u,e);
		if (trace) ts = `${g.edge2string(e)} ${ts}`;
		medge[u] = medge[v] = e;
		let ee = pedge[v];
		if (ee == 0) break;
		if (trace) ts = `${g.edge2string(ee)} ${ts}`;
		u = g.mate(v,ee);
	}
	traceString += `[${ts}]\n`;
}
