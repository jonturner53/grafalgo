/** @file priorityBimatchHK.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, fassert } from '../../common/Errors.mjs';
import Matching from './Matching.mjs';
import bimatchHK from './bimatchHK.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import findSplit from '../misc/findSplit.mjs';

let g;            // shared copy of graph
let match;        // Matching object
let priority;     // priority[u] is priority of u (in [0,n])
let subsets;      // ListPair defining bipartition
let link;         // link[u] is parent edge of u in augmenting path
let plists;       // ListSet with separate list per priority class
let first;        // first[k] is first vertex in priority k list
let roots;        // roots contains unmatched vertices in first subset
let level;        // level[u] is distance to u from a root vertex
let nextedge;     // nextedge[u] is next edge at u to be processed
let q;            // q is List used by newPhase

let trace;
let traceString;

let phases;      // number of phases completed
let paths;       // number of paths found
let steps;       // total number of steps

/** Compute a priority matching in a bipartite graph using a
 *  variant of the Hopcroft-Karp algorithm.
 *  @param g0 is an undirected bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object; ts is a possibly empty trace string
 *  and stats is a statistics object
 *  @exceptions throws an exception if graph is not bipartite

Possible refinement.
Instead of Dinic, use preflow-push with a relabeling threshold of m.
This might reduce the total number of batch relabelings to sqrt(n) total,
as opposed to sqrt(n) per priority class. Possible issue. We need to
alternate direction for each priority class. Can we maintain level
function for both directions?

 */
export default function priorityBimatchHK(g0, priority0, traceFlag=false,
										  subsets0=null) {
	g = g0;
	priority = priority0;
	subsets = subsets0;
	link = new Int32Array(g.n+1);
	level = new Int32Array(g.n+1);
	nextedge = new Int32Array(g.n+1);
	roots = new List(g.n); roots.addPrev();
	q = new List(g.n);

	trace = traceFlag; traceString = '';
	phases = paths = 0; steps = g.n;

	// divide vertices into two independent sets
	if (!subsets) { subsets = findSplit(g); steps += g.m; }
	assert(subsets != null, "bimatchHK: graph not bipartite");

	// find max size matching
	let stats0;
	[match,,stats0] = bimatchHK(g, false, subsets);
	steps += stats0.steps;

	if (trace) {
		traceString += g.toString(1,0,u => g.x2s(u) + ':' + priority[u]) +
					   `initial matching: ${match.toString()}\n` +
					   `augmenting paths\n`;
	}

	// Create separate list for each priority class.
	plists = new ListSet(g.n);
	first = new Int32Array(g.n+1);
	let pmax = 0;
	for (let u = 1; u <= g.n; u++) {
		first[priority[u]] = plists.join(first[priority[u]], u);
		pmax = Math.max(pmax, priority[u]);
	}
	steps += g.n;

	for (let k = pmax; k; k--) {
		if (!first[k]) continue;
		extendMatching(k, 1); extendMatching(k, 2);
	}

	if (trace)
		traceString += `final matching: ${match.toString()}\n`;
		
    return [match, traceString,
			{'phases': phases, 'paths': paths, 'steps': steps}];
}

/** Extend the matching for specified priority and direction.
 *  @param k is the priority of the vertices to be added to matching
 *  @param side specifies the subset of the bipartition containing the
 *  tree roots.
 */
function extendMatching(k, side) {
	roots.clear();
	for (let r = first[k]; r; r = plists.next(r)) {
		if (!match.at(r) &&
			(side == 1 && subsets.in1(r) ||
			 side == 2 && subsets.in2(r) ? 1 : 0))
			roots.enq(r);
		steps++;
	}

	while (newPhase(k)) {
		phases++;
		let r = roots.first();
		while (r) {
			link[r] = 0;
			let u = findpath(r,k);
			if (u == 0) {
				r = roots.next(r);
			} else {
				augment(u); r = roots.delete(r); paths++;
			}
			steps++;
		}
	}
}

/** Prepare for new phase. 
 *  @param k is the priority for this phase
 *  @return true if there is an augmenting path.
 */
function newPhase(k) {
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
		let u = q.deq(); // u is a root
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			steps++;
			if (e == match.at(u)) continue;
			let v = g.mate(u,e); // v in "non-root" subset
			if (level[v] != g.n) continue;
			// first time we've seen v
			level[v] = level[u] + 1; 
			let ee = match.at(v);  fassert(ee,g.e2s(ee));
			let w = g.mate(v,ee);
			level[w] = level[v] + 1;
			if (priority[w] < k) stopLevel = level[w];
			if (level[w] != stopLevel) q.enq(w);
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
function findpath(u,k) {
	for (let e = nextedge[u]; e; e = g.nextAt(u,e)) {
		steps++;
		let v = g.mate(u,e);
		if (level[v] != level[u] + 1) continue;
		let ee = match.at(v); fassert(ee,g.e2s(ee));
		let w = g.mate(v,ee);
		if (level[w] != level[v] + 1) continue;
		if (priority[w] < k) {
			nextedge[u] = e; link[v] = e; link[w] = ee; return w;
		}
		let x = findpath(w,k);
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
	if (trace) ts += g.x2s(u);
	while (link[u]) {
		steps++;
		let e = link[u];
		let v = g.mate(u,e); match.drop(e);
		if (trace) ts = `${g.e2s(e)} ${ts}`;
		let ee = link[v]; match.add(ee);
		u = g.mate(v,ee);
		if (trace) ts = `${g.e2s(ee)} ${ts}`;
	}
	if (trace) traceString += `[${ts}]\n`;
}
