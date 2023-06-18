/** @file priorityBimatchHK.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
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
 */
export default function priorityBimatchHK(g0, priority0, subsets0=null,
										  traceFlag=false) {
	g = g0; priority = priority0; subsets = subsets0;

	match = new Matching(g);
	link = new Int32Array(g.n+1);
	level = new Int32Array(g.n+1);
	nextedge = new Int32Array(g.n+1);
	roots = new List(g.n); roots.addPrev();
	q = new List(g.n);

	trace = traceFlag; traceString = '';
	phases = paths = 0; steps = g.n;

	// divide vertices into two independent sets
	if (!subsets) { subsets = findSplit(g); steps += g.m; }
	if (!subsets) return [];

	// find max size matching
	//let stats0;
	//[match,,stats0] = bimatchHK(g, subsets, false);
	//steps += stats0.steps;

	// Create separate list for each priority class.
	plists = new ListSet(g.n);
	first = new Int32Array(g.n+1);
	let pmax = 0;
	for (let u = 1; u <= g.n; u++) {
		first[priority[u]] = plists.join(first[priority[u]], u);
		pmax = Math.max(pmax, priority[u]);
	}
	steps += g.n;

	// build initial matching with pretty good priority score
	for (let k = pmax; k; k--) {
		steps++;
		if (!first[k]) continue;
		for (let u = first[k]; u; u = plists.next(u)) {
			steps++;
			if (match.at(u)) continue;
			for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
				steps++;
				if (!match.at(g.mate(u,e))) {
					match.add(e); break;
				}
			}
		}
	}

	if (trace) {
		traceString += g.toString(1,0,u => g.x2s(u) + ':' + priority[u]) +
					   `initial matching: ${match.toString()}\n` +
					   `augmenting paths\n`;
	}

	for (let k = pmax; k; k--) {
		if (!first[k]) continue;
		extendMatching(k, 1); extendMatching(k, 2);
	}

	if (trace)
		traceString += `final matching: ${match.toString()}\n`;
		
	let psum = 0;
	for (let u = 1; u <= g.n; u++) 
		if (match.at(u)) psum += priority[u];
    return [match, traceString,
				{ 'size': match.size(), 'psum': psum,
		  		  'phases': phases, 'paths': paths, 'steps': steps}];
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
			(side == 1 && subsets.in(r,1) ||
			 side == 2 && subsets.in(r,2)))
			roots.enq(r);
		steps++;
	}

	while (newPhase(k)) {
		phases++;
		let r = roots.first();
		while (r) {
			link[r] = 0;
			let [u,e] = findpath(r,k);
			if (!u) {
				r = roots.next(r);
			} else {
				augment(u,e); r = roots.delete(r); paths++;
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
		level[u] = g.n+1; nextedge[u] = g.firstAt(u); steps++;
	}
	q.clear();
	for (let u = roots.first(); u; u = roots.next(u)) {
		level[u] = 0; q.enq(u); steps++;
	}
	let stopLevel = g.n+1; // used to terminate early
	// label each vertex with its distance from the nearest root
	// in matching forest
	while (!q.empty()) {
		let u = q.deq(); // u is in root subset
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			steps++;
			if (e == match.at(u)) continue;
			let v = g.mate(u,e); // v in "non-root" subset
			if (level[v] != g.n+1) continue;
			// first time we've seen v
			level[v] = level[u] + 1; 
			let ee = match.at(v);
			if (!ee) {
				// there's an augmenting path from v back to a root
				if (stopLevel == g.n+1) stopLevel = level[v] + 1;
				continue;
			}
			// ee in matching
			let w = g.mate(v,ee);
			level[w] = level[v] + 1;
			if (priority[w] < k) stopLevel = level[w];
			if (level[w] != stopLevel) q.enq(w);
		}
	}
	return (stopLevel <= g.n);
}

/** Find an augmenting or priority-incresing path from a
 *  specified vertex.
 *  @param u is a vertex in the first subset
 *  @return the endpoint of of an augmenting or priority-increasing
 *  path or 0 if there is no admissible path to such a vertex in
 *  the graph defined by the level values;  on successful return,
 *  the link array defines the path from the returned vertex back to u
 */
function findpath(u,k) {
	for (let e = nextedge[u]; e; e = g.nextAt(u,e)) {
		steps++;
		let v = g.mate(u,e);
		if (level[v] != level[u] + 1) continue;
		link[v] = e;
		let ee = match.at(v);
		if (!ee) {
			// there's an augmenting path to v
			nextedge[u] = e; link[v] = e; return [v,e];
		}
		// ee is in matching
		let w = g.mate(v,ee);
		if (level[w] != level[v] + 1) continue;
		if (priority[w] < k) {
			nextedge[u] = e; link[v] = e; link[w] = ee; return [w,ee];
		}
		let [x,elast] = findpath(w,k);
		if (x) {
			nextedge[u] = e; link[v] = e; link[w] = ee; return [x,elast];
		}
	}
	nextedge[u] = 0; return [];
}

/** Flip the edges along an augmenting or priority-increasing path
 *  @param u is last endpoint of a path found by findpath
 *  @param e is the last edge on the path.
 */
function augment(u,e) {
	let ts = '';
	if (!match.contains(e)) {
		// extra step for augmenting path
		if (trace) ts += `${g.e2s(e)} ${g.x2s(u)}`
		match.add(e); u = g.mate(u,e);
	} else if (trace) {
		ts += g.x2s(u);
	}
	while (link[u]) {
		steps++;
		e = link[u]; u = g.mate(u,e); match.drop(e);
		if (trace) ts = `${g.e2s(e)} ${ts}`;
		e = link[u]; u = g.mate(u,e); match.add(e);
		if (trace) ts = `${g.e2s(e)} ${ts}`;
	}
	if (trace) traceString += `[${ts}]\n`;
}
