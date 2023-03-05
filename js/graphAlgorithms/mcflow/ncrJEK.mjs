/** @file ncrJEK.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';

let g;        // shared reference to flow graph
let link;     // link[u] is parent edge of u
let lambda;   // lambda[u] is vertex label used to make costs non-negative
let excess;   // excess[u] is excess flow entering u
let sources;  // list of sources (nodes with positive excess)
let sinks;    // list of sinks (nodes with negative excess)

let border;   // heap used by findpath
let Cost;     // array of path costs used by findpath

let trace;
let traceString;

let paths;      // number of augmenting paths
let steps;      // number of steps in findpath method

/** Eliminate negative cycles from a flow graph, using Jewell's
 *  algorithm with the Edmonds/Karp cost transform.
 *  @param fg is a flow graph, possibly with a non-zero initial flow.
 */
export default function ncrJEK(fg, traceFlag=false) {
	g = fg; trace = traceFlag; traceString = '';

	link = new Int32Array(g.n+1);
	lambda = new Float32Array(g.n+1);
	excess = new Int32Array(g.n+1);
	sources = new List(g.n); sources.addPrev(); // doubly linked
	sinks = new List(g.n); sinks.addPrev();
	border = new ArrayHeap(g.n,2);
	Cost = new Float32Array(g.n+1);

	paths = steps = 0;

	// initialize excess values
	for (let u = 1; u <= g.n; u++) {
		if (u == g.source || u == g.sink) continue;
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
			excess[u] -= g.f(e,u);
	}

	// saturate negative cost edges that are not already saturated
	for (let u = 1; u <= g.n; u++) {
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			steps++;
			if (g.costFrom(e,u) < 0 && g.res(e,u) > 0) {
				let r = g.res(e,u); g.addFlow(e,u,r);
				excess[u] -= r; excess[g.mate(u,e)] += r;
			}
		}
	}

	// initialize source and sinks based on excess
	sources.clear(); sinks.clear();
	for (let u = 1; u <= g.n; u++) {
		if (excess[u] > 0) sources.enq(u);
		else if (excess[u] < 0) sinks.enq(u);
	}

	traceString = '';
	if (trace) {
		traceString += g.toString(1) + '\nsources, sinks and paths ' +
					   'with added flow and resulting flow cost\n';
	}

	let t = findpath();
	while (t) {
		paths++; augment(t); t = findpath();
	}
	if (trace) traceString += '\n' + g.toString(1);
	steps += border.getStats().steps;
	return [traceString, { 'paths': paths, 'steps': steps } ];
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
	let t = 0; let cmax = -Infinity;
	while (!border.empty()) {
		let u = border.deletemin();
		cmax = Math.max(cmax,Cost[u]);
		if (sinks.contains(u)) t = u;
			// don't stop yet as need all c values to update lambda
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			steps++;
			if (g.res(e,u) == 0) continue;
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
	let u = t; let delta = Infinity;
	for (let e = link[u]; e != 0; e = link[u]) {
		u = g.mate(u,e); delta = Math.min(delta, g.res(e,u));
	}
	delta = Math.min(delta, excess[u]);
	delta = Math.min(delta, -excess[t]);

	u = t; let ts = ''; let cost = 0;
	for (let e = link[u]; e != 0; e = link[u]) {
		u = g.mate(u,e); steps++;
		if (trace) {
			if (ts.length > 0) ts = ' ' + ts;
			ts = g.x2s(u) + ':' + g.res(e,u) + ts;
			cost += g.costFrom(e,u) * delta;
		}
		g.addFlow(e,u,delta);
	}
	if (trace) {
		traceString += sources.toString(u => g.x2s(u) + ':' + excess[u]) + ' ';
		traceString += sinks.toString(u => g.x2s(u) + ':' + excess[u]) + '\n  ';
		traceString += `[${ts} ${g.x2s(t)}] ${delta} ${cost} ${g.totalCost()}\n`;
	}
	excess[u] -= delta; excess[t] += delta;
	if (excess[u] == 0) sources.delete(u);
	if (excess[t] == 0) sinks.delete(t);
}
