/** @file bimatchHK.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import { match2string } from './match.mjs';
import List from '../../dataStructures/basic/List.mjs';
import findSplit from '../misc/findSplit.mjs';

let g;            // shared copy of graph
let match;        // match[u] is edge incident to u in matching or 0
let link = null;  // link[u] is parent edge of u in augmenting path
let free;         // free contains unmatched vertices in first subset
let level;        // level[u] is distance to u from a free vertex
let nextedge;     // nextedge[u] is next edge at u to be processed
let q;            // q is List used by newPhase

let trace;
let traceString;

let phases;      // number of phases completed
let paths;       // number of paths found
let steps;       // total number of steps

/** Compute a maximum matching in a bipartite graph using the
 *  Hopcroft-Karp algorithm.
 *  @param g is an undirected bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is an array
 *  matching a vertex u to its matched edge match[u] or 0 if u
 *  is unmatched; ts is a possibly empty trace string
 *  and stats is a statistics object
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function bimatchHK(bg, traceFlag=false, subsets=null) {
	g = bg; trace = traceFlag; traceString = '';
	match = new Int32Array(g.n+1); // match is returned
	if (link == null || link.length != g.n+1) {
		link = new Int32Array(g.n+1);
		level = new Int32Array(g.n+1);
		nextedge = new Int32Array(g.n+1);
		free = new List(g.n); free.addPrev();
		q = new List(g.n);
	} else {
		free.clear();
	}
	phases = paths = 0; steps = g.n;

	// divide vertices into two independent sets
	if (!subsets) { subsets = findSplit(g); steps += g.m; }
	assert(subsets != null, "bimatchHK: graph not bipartite");

	// add edges to match, yielding maximal (not maximum) matching
	for (let u = 1; u <= g.n; u++) {
		if (match[u]) continue;
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			steps++;
			let v = g.mate(u,e);
			if (!match[v]) { match[u] = match[v] = e; break; }
		}
	}

	if (trace)
		traceString += `initial matching: ${match2string(g,match)}\n` +
					   `augmenting paths\n`;

	// add unmatched vertices from first subset to free
	for (let u = subsets.first1(); u != 0; u = subsets.next1(u)) {
		if (match[u] == 0 && g.firstAt(u) != 0) free.enq(u);
		steps++;
	}
	while (newPhase()) {
		phases++;
		let r = free.first();
		while (r != 0) {
			link[r] = 0;
			let u = findpath(r);
			if (u == 0) {
				r = free.next(r);
			} else {
				augment(u); r = free.delete(r); paths++;
			}
		}
	}

	if (trace)
		traceString += `final matching: ${match2string(g,match)}\n`;
		
    return [match, traceString,
			{'phases': phases, 'paths': paths, 'steps': steps}];
}

/** Prepare for new phase. 
 *  @return true if there is an augmenting path.
 */
function newPhase() {
	for (let u = 1; u <= g.n; u++) {
		level[u] = g.n; nextedge[u] = g.firstAt(u); steps++;
	}
	q.clear();
	for (let u = free.first(); u != 0; u = free.next(u)) {
		level[u] = 0; q.enq(u); steps++;
	}
	let stopLevel = g.n; // used to terminate early
	// label each vertex with its distance from the nearest root
	// in matching forest
	while (!q.empty()) {
		let u = q.deq(); // u in first subset
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			steps++;
			if (e == match[u]) continue;
			let v = g.mate(u,e); // v in second subset
			if (level[v] != g.n) continue;
			// first time we've seen v
			level[v] = level[u] + 1; 
			let ee = match[v];
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
 *  @param u is a vertex in the first subset
 *  @return an unmatched vertex in the second subset, or 0 if there is no
 *  admissible path to such a vertex in the current phase;
 *  on successful return, the link array defines
 *  the augmenting path from the returned vertex back to u
 */
function findpath(u) {
	for (let e = nextedge[u]; e != 0; e = g.nextAt(u,e)) {
		steps++;
		let v = g.mate(u,e);
		if (level[v] != level[u] + 1) continue;
		let ee = match[v];
		if (ee == 0) { nextedge[u] = e; link[v] = e; return v; }
		let w = g.mate(v,ee);
		if (level[w] != level[v] + 1) continue;
		let t = findpath(w);
		if (t != 0) {
			nextedge[u] = e; link[v] = e; link[w] = ee; return t;
		}
	}
	nextedge[u] = 0; return 0;
}

/** Flip the edges along an augmenting path
 *  @param u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the link pointers
 */
function augment(u) {
	let ts = '';
	if (trace) ts += g.index2string(u);
	while (true) {
		steps++;
		let e = link[u];
		if (e == 0) break;
		let v = g.mate(u,e);
		if (trace) ts = `${g.edge2string(e)} ${ts}`;
		match[u] = match[v] = e;
		let ee = link[v];
		if (ee == 0) break;
		if (trace) ts = `${g.edge2string(ee)} ${ts}`;
		u = g.mate(v,ee);
	}
	if (trace) traceString += `[${ts}]\n`;
}