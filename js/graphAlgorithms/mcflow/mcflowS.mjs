/** @file mcflowS.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

let g;	      // shared reference to flow graph
let Delta;    // scaling parameter
let pedge;    // pedge[u] is parent edge of u
let lambda;   // lambda[u] is vertex label used to make costs non-negative
let excess;   // excess[u] is excess flow entering u
let sources;  // list of sources (nodes with positive excess)
let sinks;    // list of sinks (nodes with negative excess)

let phaseCount;     // number of scaling phases
let pathCount;      // number of augmenting paths
let findpathSteps;  // number of steps in findpath method

/** Find minimum cost maximum flow in a weighted flow graph using the
 *  capacity scaling algorithm.
 *  Requires that the original graph has no negative cost cycles.
 */
export default function mcflowS(fg, trace=false) {
	g = fg;

	pedge = new Int32Array(g.n+1);
	lambda = new Float32Array(g.n+1);
	excess = new Int32Array(g.n+1);
	sources = new List(g.n); sources.addPrev(); // doubly linked
	sinks = new List(g.n); sinks.addPrev();

	phaseCount = pathCount = findpathSteps = 0;

	for (let u = 1; u <= g.n; u++) 
		lambda[u] = excess[u] = pedge[u] = 0;

	// Initialize scaling factor
	let maxcap = 0;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxcap = Math.max(maxcap, g.cap(e,g.tail(e)));
		g.setFlow(e, 0);
	}
	for (Delta = 1; 2*Delta <= maxcap; Delta <<= 1) {}

	// Determine a max flow so that we can initialize excess
	// values at s and t
	maxflowD(g);
	excess[g.source] = g.totalFlow();
	excess[g.sink] = -g.totalFlow();
	g.clearFlow();

	let ts = '';

	initLabels();
	while (Delta >= 1) {
		newPhase(); phaseCount++;
		if (trace)
			ts += `Delta=${Delta}, sources ${''+sources}, ` +
				  `sinks${''+sinks} flow ${g.totalFlow()}, ` +
				  `cost ${g.totalCost()}\n`; 
		let t = findpath();
		while (t != 0) {
			pathCount++;
			let s = augment(t, trace);
			if (trace) ts += `path ${s}\n`;
			t = findpath();
		}
		Delta /= 2;
	}
	if (trace) ts += g.toString(0,1);
	return [ts, { 'phaseCount': phaseCount, 'pathCount': pathCount,
			 	  'findpathSteps': findpathSteps } ];
}

/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in the graph.
 *  Uses the breadth-first scanning algorithm to compute shortest
 *  paths.
 */
function initLabels() {
	let q = new List(g.n);
	for (let u = 1; u <= g.n; u++) q.enq(u);
	let pass = 0; let last = g.n;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u,e)) {
			let v = g.mate(u,e);
			if (lambda[v] > lambda[u] + g.cost(e,u)) {
				lambda[v] = lambda[u] + g.cost(e,u);
				if (!q.contains(v)) q.enq(v);
			}
		}
		if (u == last && !q.empty()) { pass++; last = q.last(); }
		assert(pass<g.n, 'mcflowS: negative cost cycle');
	}
}

/** Do start of phase processing.  */
function newPhase() {
	// If any edge violates labeling condition, add Delta units of
	// flow to it. This eliminates it from the residual graph for
	// the current scaling factor.
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = g.tail(e); let v = g.head(e);
		if (g.res(e,u) >= Delta) {
			if (g.cost(e,u) + (lambda[u] - lambda[v]) < 0) {
				g.addFlow(e,u,Delta);
				excess[u] -= Delta; excess[v] += Delta;
			}
		}
		if (g.res(e,v) >= Delta) {
			if (g.cost(e,v) + (lambda[v] - lambda[u]) < 0) {
				g.addFlow(e,v,Delta);
				excess[v] -= Delta; excess[u] += Delta;
			}
		}
	}

	// identify candidate sources and sinks
	sources.clear(); sinks.clear();
	for (let u = 1; u <= g.n; u++) {
		if (excess[u] >= Delta) {
			sources.enq(u);
		} else if (excess[u] <= -Delta) {
			sinks.enq(u);
		}
	}
	return;
}

/** Find a least cost augmenting path from some source and update the labels.
 *  @return the "sink" vertex for the computed path; on return, the pedge
 *  vector defines the path from the sink back to some source
 */
function findpath() {
	let c = new Float32Array(g.n+1);
	let border = new ArrayHeap(g.n,2);
	pedge.fill(0); c.fill(Infinity);

	// search from all sources in parallel
	for (let s = sources.first(); s != 0; s = sources.next(s)) {
		c[s] = 0; border.insert(s,0);
	}
	let cmax = 0; let t = 0;
	while (!border.empty()) {
		let u = border.deletemin(); cmax = Math.max(cmax,c[u]);
		if (t == 0 && sinks.contains(u)) t = u;
			// don't stop yet as need all c values to update lambda
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			findpathSteps++;
			if (g.res(e,u) < Delta) continue;
			let v = g.mate(u,e);
			if (c[v] > c[u] + g.cost(e,u) + (lambda[u]-lambda[v])) {
				pedge[v] = e;
				c[v] = c[u] + g.cost(e,u) + (lambda[u]-lambda[v]);
				if (!border.contains(v)) border.insert(v,c[v]);
				else border.changekey(v,c[v]);
			}
		}
	}
	if (t != 0) { // adjust labels
		for (let u = 1; u <= g.n; u++)
			lambda[u] += Math.min(c[u],cmax);
	}
	return t;
}

/** Augment the flow along a path
 *  @param t is the sink vertex for the path; the path is defined
 *  by the pedge array
 */
function augment(t, trace=false) {
	let s = t; let f = Delta; let ts = '';
	for (let e = pedge[s]; e != 0; e = pedge[s]) {
		if (trace) {
			if (ts.length > 0) ts = ' ' + ts;
			ts = g.index2string(s) + ts;
		}
		let u = g.mate(s,e); g.addFlow(e,u,f); s = u;
	}
	if (trace)
		ts = `[${g.index2string(s)} ${ts}] ${f}`;
	excess[s] -= f; excess[t] += f;
	if (excess[s] < Delta) sources.delete(s);
	if (excess[t] > -Delta) sinks.delete(t);
	return ts;
}
