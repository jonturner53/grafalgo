/** @file mcflowO.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

let g;        // shared reference to flow graph
let Delta;    // scaling parameter
let link;     // link[u] is parent edge of u
let lambda;   // lambda[u] is vertex label used to make costs non-negative
let excess;   // excess[u] is excess flow entering u
let sources;  // list of sources (nodes with positive excess)
let sinks;    // list of sinks (nodes with negative excess)

let border;   // Array heap used by findpath
let Cost;     // Path costs used by findpath

let trace;
let traceString;

let phases;     // number of scaling phases
let paths;      // number of augmenting paths
let steps;      // number of steps in findpath method

/** Find minimum cost maximum flow in a weighted flow graph using Orlin's
 *  capacity scaling algorithm.
 *  Requires that the original graph has no negative cost cycles.
 */
export default function mcflowO(fg, traceFlag=false) {
	g = fg;
	trace = traceFlag; traceString = '';

	link = new Int32Array(g.n+1);
	lambda = new Float32Array(g.n+1);
	excess = new Int32Array(g.n+1);
	sources = new List(g.n); sources.hasReverse = true; // doubly linked
	sinks = new List(g.n); sinks.hasReverse = true;

	Cost = new Float32Array(g.n+1);
	border = new ArrayHeap(g.n,2);

	phases = paths = steps = 0;

	// Initialize scaling factor
	let maxcap = 0;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxcap = Math.max(maxcap, g.cap(e,));
	}
	for (Delta = 1; 2*Delta <= maxcap; Delta <<= 1) {}

	// Determine a max flow so that we can initialize excess
	// values at s and t
	maxflowD(g);
	excess[g.source] = g.totalFlow();
	excess[g.sink] = -g.totalFlow();
	g.clearFlow();

	if (trace) {
		traceString += 'sources, sinks and paths ' +
					   'with added flow and resulting flow cost\n'
	}

	while (Delta >= 1) {
		newPhase(); phases++;
		let t = findpath();
		while (t != 0) {
			augment(t); t = findpath(); paths++;
		}
		Delta /= 2;
		if (trace) traceString += '\n';
	}
	if (trace) traceString += g.toString(1);
	steps += border.getStats().steps;
	g = link = lambda = border = Cost = sources = sinks = null;
	return [traceString, {  'phases': phases, 'paths': paths,
			 	  			'steps': steps } ];
}

/** Do start of phase processing. */
function newPhase() {
	// If any edge violates labeling condition, add Delta units of
	// flow to it. This eliminates it from the residual graph for
	// the current scaling factor.
	let s = ''; let flow = 0; let cost = 0;
	if (trace) {
		flow = g.totalFlow(); cost = g.totalCost();
	}
	for (let e = g.first(); e != 0; e = g.next(e)) {
		steps++;
		let u = g.tail(e); let v = g.head(e);
		if (g.res(e,u) >= Delta) {
			if (g.costFrom(e,u) + (lambda[u] - lambda[v]) < 0) {
				g.addFlow(e,u,Delta);
				excess[u] -= Delta; excess[v] += Delta;
			}
		}
		if (g.res(e,v) >= Delta) {
			if (g.costFrom(e,v) + (lambda[v] - lambda[u]) < 0) {
				g.addFlow(e,v,Delta);
				excess[v] -= Delta; excess[u] += Delta;
			}
		}
	}

	// identify candidate sources and sinks
	sources.clear(); sinks.clear();
	for (let u = 1; u <= g.n; u++) {
		steps++;
		if (excess[u] >= Delta) {
			sources.enq(u);
		} else if (excess[u] <= -Delta) {
			sinks.enq(u);
		}
	}
	return;
}

/** Find a least cost augmenting path from some source and update the labels.
 *  @return the "sink" vertex for the computed path; on return, the link
 *  vector defines the path from the sink back to some source
 */
function findpath() {
	border.clear(); link.fill(0); Cost.fill(Infinity);

	// search from all sources in parallel
	for (let s = sources.first(); s != 0; s = sources.next(s)) {
		Cost[s] = 0; border.insert(s,0); steps++;
	}
	let t = 0;
	let cmax = -Infinity;
	while (!border.empty()) {
		let u = border.deletemin();
		cmax = Math.max(cmax,Cost[u]);
		if (t == 0 && sinks.contains(u)) t = u;
			// don't stop yet as need all c values to update lambda
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			steps++;
			if (g.res(e,u) < Delta) continue;
			let v = g.mate(u,e);
			if (Cost[v] > Cost[u] + g.costFrom(e,u) + (lambda[u]-lambda[v])) {
				link[v] = e;
				Cost[v] = Cost[u] + g.costFrom(e,u) + (lambda[u]-lambda[v]);
				if (!border.contains(v)) border.insert(v,Cost[v]);
				else border.changekey(v,Cost[v]);
			}
		}
	}
	if (t != 0) { // adjust labels
		for (let u = 1; u <= g.n; u++) {
			lambda[u] += Math.min(Cost[u],cmax);
		}
		steps += g.n;
	}
	return t;
}

/** Augment the flow along a path
 *  @param t is the sink vertex for the path; the path is defined
 *  by the link array
 */
function augment(t) {
	let u = t; let ts = '';
	if (trace) ts += g.x2s(t);
	for (let e = link[u]; e != 0; e = link[u]) {
		steps++;
		u = g.mate(u,e);
		if (trace) {
			ts = `${g.x2s(u)}:${g.res(e,u)} ${ts}`;
		}
		g.addFlow(e,u,Delta);
	}
	if (trace) {
		traceString += sources.toString(u => g.x2s(u) + ':' + excess[u]) + ' ';
		traceString += sinks.toString(u => g.x2s(u) + ':' + excess[u]) + '\n  ';
		traceString += `[${ts}] ${Delta} ${g.totalCost()}\n`;
	}
	excess[u] -= Delta; excess[t] += Delta;
	if (excess[u] < Delta) sources.delete(u);
	if (excess[t] > -Delta) sinks.delete(t);
}
