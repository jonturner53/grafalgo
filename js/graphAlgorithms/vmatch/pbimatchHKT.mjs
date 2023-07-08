/** @file pbimatchHKT.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Matching from '../match/Matching.mjs';
import bimatchHK from '../match/bimatchHK.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import findSplit from '../misc/findSplit.mjs';

let g;            // shared copy of graph
let match;        // Matching object
let prio;         // prio[u] is priority of u (in [0,n])
let pmax;         // largest priority value
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

let passes;      // number of passes completed
let phases;      // number of phases completed
let paths;       // number of paths found
let steps;       // total number of steps

/** Compute a priority matching in a bipartite graph using
 *  Turner's variant of the Hopcroft-Karp algorithm.
 *  @param g0 is an undirected bipartite graph
 *  @param prio0 is an array of vertex priorities
 *  @param strict is a flag which if true causes the program
 *  to implement the strict version of the algorithm
 *  @param subsets0 is a ListPair object that defines a bipartition
 *  on the vertices
 *  @param traceFlag causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object; ts is a possibly empty trace string
 *  and stats is a statistics object
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function pbimatchHKT(g0, prio0, strict=false, subsets0=null,
									 traceFlag=false) {
	g = g0; prio = prio0; subsets = subsets0;

	match = new Matching(g);
	link = new Int32Array(g.n+1);
	level = new Int32Array(g.n+1);
	nextedge = new Int32Array(g.n+1);
	roots = new List(g.n); roots.addPrev();
	q = new List(g.n);

	trace = traceFlag; traceString = '';
	passes = phases = paths = 0; steps = g.n;

	// divide vertices into two independent sets
	if (!subsets) { subsets = findSplit(g); steps += g.m; }
	if (!subsets) return [];

	// Create separate list for each priority class.
	plists = new ListSet(g.n);
	first = new Int32Array(g.n+1);
	pmax = 0;
	for (let u = 1; u <= g.n; u++) {
		first[prio[u]] = plists.join(first[prio[u]], u);
		pmax = Math.max(pmax, prio[u]);
	}
	steps += g.n;

	// First sort graph's endpoint lists by priority
	g.sortAllEplists((e1,e2,v) => prio[g.mate(v,e2)] - prio[g.mate(v,e1)]);

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
		traceString += g.toString(3,0,u => g.x2s(u) + ':' + prio[u]) +
					   `initial matching: ${match.toString()}\n` +
					   `augmenting paths\n`;
	}

	for (let rp = pmax; rp; rp--) {
		if (!first[rp]) continue;
		let p0 = paths;
		extendMatching(1, rp, strict);
		extendMatching(2, rp, strict);
		passes++;
		if (!strict && paths == p0) break;
			// early termination when no progress
	}

	if (trace)
		traceString += `final matching: ${match.toString()}\n`;
		
	let psum = 0;
	for (let u = 1; u <= g.n; u++) 
		if (match.at(u)) psum += prio[u];
    return [match, traceString,
				{ 'size': match.size(), 'psum': psum, 'passes': passes,
		  		  'phases': phases, 'paths': paths, 'steps': steps}];
}

/** Extend the matching for specified priority and direction.
 *  @param side specifies the subset of the bipartition containing the
 *  tree roots.
 *  @param rp is the priority of the tree roots to be used in this pass
 *  when operating in strict mode and 0 otherwise
 */
function extendMatching(side, rp, strict) {
	// build list of roots with priority rp (strict case) and
	// <= rp otherwise
	roots.clear();
	for (let k = rp; k; k--) {
		for (let r = first[k]; r; r = plists.next(r)) {
			if (!match.at(r) &&
				(side == 1 && subsets.in(r,1) ||
				 side == 2 && subsets.in(r,2)))
				roots.enq(r);
			steps++;
		}
		if (strict) break;
	}

	while (newPhase(strict)) {
		phases++;
		let r = roots.first();
		while (r) {
			link[r] = 0;
			let [u,e] = findpath(r);
			if (u) {
				augment(u,e); r = roots.delete(r); paths++;
			} else {
				r = roots.next(r);
			} 
			steps++;
		}
	}
}

/** Prepare for new phase. 
 *  @return true if there is an augmenting path.
 */
function newPhase(strict) {
	if (roots.empty()) return 0;

	for (let u = 1; u <= g.n; u++) {
		level[u] = g.n+1; nextedge[u] = g.firstAt(u); steps++;
	}
	// add roots with highest priority to q
	q.clear(); let r = roots.first(); let rp = prio[r];
	for ( ; r && prio[r] == rp; r = roots.next(r)) {
		level[r] = 0; q.enq(r); steps++;
	}
	// r is now the first root with priority <rp (or 0)

	let stopLevel = g.n+1; // used to terminate early

	while (rp) {
		// label each vertex with its distance from the nearest root
		// of priority rp, ignoring those already labeled
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
				if (stopLevel == g.n+1 && prio[w] < rp) {
					stopLevel = level[w];
				}
				if (level[w] < stopLevel) q.enq(w);
			}
		}
		// update rp and add priority rp roots to q
		rp = (r ? prio[r] : 0);
		for ( ; r && prio[r] == rp; r = roots.next(r)) {
			level[r] = 0; q.enq(r); steps++;
		}
		// r is now the first root with priority <rp (or 0)
	}
	return (stopLevel <= g.n);
}

/** Find an augmenting or priority-incresing path from a
 *  specified vertex.
 *  @param u is a vertex in the first subset
 *  @param r is the root of the tree being searched
 *  @return the endpoint of of an augmenting or priority-increasing
 *  path or 0 if there is no admissible path to such a vertex in
 *  the graph defined by the level values;  on successful return,
 *  the link array defines the path from the returned vertex back to u
 */
function findpath(u,r=u) {
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
		if (prio[w] < prio[r]) {
			nextedge[u] = e; link[v] = e; link[w] = ee; return [w,ee];
		}
		let [x,elast] = findpath(w,r);
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
		if (trace) ts += `${g.e2s(e,0,1)}`
		match.add(e); u = g.mate(u,e);
	}
	while (link[u]) {
		steps++;
		e = link[u]; u = g.mate(u,e); match.drop(e);
		if (trace) ts = `${g.e2s(e,0,1)}${(ts ? ' ' : '') + ts}`;
		e = link[u]; u = g.mate(u,e); match.add(e);
		if (trace) ts = `${g.e2s(e,0,1)} ${ts}`;
	}
	if (trace) traceString += `[${ts}]\n`;
}
