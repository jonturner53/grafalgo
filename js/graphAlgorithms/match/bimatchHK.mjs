/** @file bimatchHK.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Matching from './Matching.mjs';
import initialMatch from './initialMatch.mjs';
import List from '../../dataStructures/basic/List.mjs';
import findSplit from '../misc/findSplit.mjs';

let g;            // shared copy of graph
let match;        // Matching object
let link;         // link[u] is parent edge of u in augmenting path
let roots;        // roots contains unmatched inputs
let level;        // level[u] is distance to u from a root vertex
let nextedge;     // nextedge[u] is next edge at u to be processed
let q;            // q is List used by newPhase

let trace;
let traceString;

let phases;      // number of phases completed
let paths;       // number of paths found
let steps;       // total number of steps

/** Compute a maximum matching in a bipartite graph using the
 *  Hopcroft-Karp algorithm.
 *  @param G is an undirected bipartite graph
 *  @param imatch is an optional initial matching; if supplied, it is
 *  extended to produce a maximum matching
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object; ts is a possibly empty trace string
 *  and stats is a statistics object
 */
export default function bimatchHK(G, imatch=0, traceFlag=0) {
	g = G;
	match = initialMatch(g,imatch);
	link = new Int32Array(g.n+1);
	level = new Int32Array(g.n+1);
	nextedge = new Int32Array(g.n+1);
	roots = new List(g.n); roots.hasReverse = true;
	q = new List(g.n);

	trace = traceFlag; traceString = '';
	phases = paths = 0; steps = g.n + g.m;

	if (trace) {
		traceString += g.toString(1) +
					   `initial matching: ${match.toString()}\n` +
					   `augmenting paths\n`;
	}

	// add unmatched vertices from inputs to set of tree roots
	for (let u = g.firstInput(); u; u = g.nextInput(u)) {
		if (!match.at(u) && g.firstAt(u) != 0) roots.enq(u);
		steps++;
	}
	while (newPhase()) {
		phases++;
		let r = roots.first();
		while (r) {
			link[r] = 0;
			let u = findpath(r);
			if (u == 0) {
				r = roots.next(r);
			} else {
				augment(u); r = roots.delete(r); paths++;
			}
		}
	}

	if (trace)
		traceString += `final matching: ${match.toString()}\n`;
		
    return [match, traceString, {'size': match.size(), 'phases': phases,
								 'paths': paths, 'steps': steps}];
}

/** Prepare for new phase. 
 *  @return true if there is an augmenting path.
 */
function newPhase() {
	for (let u = 1; u <= g.n; u++) {
		level[u] = g.n; nextedge[u] = g.firstAt(u); steps++;
	}
	q.clear();
	for (let u = roots.first(); u; u = roots.next(u)) {
		level[u] = 0; q.enq(u); steps++;
	}
	let stopLevel = g.n; // used to terminate early
	// label each vertex with its distance from the nearest root
	// in matching forest
	while (!q.empty()) {
		let u = q.deq(); // u is input
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			steps++;
			if (e == match.at(u)) continue;
			let v = g.mate(u,e); // v is output
			if (level[v] != g.n) continue;
			// first time we've seen v
			level[v] = level[u] + 1; 
			let ee = match.at(v);
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
 *  @param u is an input
 *  @return an unmatched output, or 0 if there is no
 *  admissible path to such a vertex in the current phase;
 *  on successful return, the link array defines
 *  the augmenting path from the returned vertex back to u
 */
function findpath(u) {
	for (let e = nextedge[u]; e; e = g.nextAt(u,e)) {
		steps++;
		let v = g.mate(u,e);
		if (level[v] != level[u] + 1) continue;
		let ee = match.at(v);
		if (ee == 0) { nextedge[u] = e; link[v] = e; return v; }
		let w = g.mate(v,ee);
		if (level[w] != level[v] + 1) continue;
		let x = findpath(w);
		if (x) {
			nextedge[u] = e; link[v] = e; link[w] = ee; return x;
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
	if (trace) ts = g.x2s(u);
	while (true) {
		steps++;
		let e = link[u];
		if (!e) break;
		let v = g.mate(u,e); match.add(e);
		if (trace) ts = `${g.x2s(v)} ${ts}`;
		let ee = link[v];
		if (!ee) break;
		u = g.mate(v,ee); match.drop(ee);
		if (trace) ts = `${g.x2s(u)} ${ts}`;
	}
	if (trace) traceString += `[${ts}]\n`;
}
