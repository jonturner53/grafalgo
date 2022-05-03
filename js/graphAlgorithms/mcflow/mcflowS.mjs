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

let trace;
let traceString;

let phaseCount;     // number of scaling phases
let pathCount;      // number of augmenting paths
let findpathSteps;  // number of steps in findpath method

/** Find minimum cost maximum flow in a weighted flow graph using the
 *  capacity scaling algorithm.
 *  Requires that the original graph has no negative cost cycles.
 */
export default function mcflowS(fg, traceFlag=false) {
	g = fg;
	trace = traceFlag; traceString = '';

	pedge = new Int32Array(g.n+1);
	lambda = new Float32Array(g.n+1);
	excess = new Int32Array(g.n+1);
	sources = new List(g.n); sources.addPrev(); // doubly linked
	sinks = new List(g.n); sinks.addPrev();

	phaseCount = pathCount = findpathSteps = 0;

	// Initialize scaling factor
	let maxcap = 0;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxcap = Math.max(maxcap, g.cap(e,));
		g.setFlow(e, 0);
	}
	for (Delta = 1; 2*Delta <= maxcap; Delta <<= 1) {}

	// Determine a max flow so that we can initialize excess
	// values at s and t
	maxflowD(g);
	excess[g.source] = g.totalFlow();
	excess[g.sink] = -g.totalFlow();
	g.clearFlow();

	while (Delta >= 1) {
		newPhase(); phaseCount++;
		let t = findpath();
		while (t != 0) {
			pathCount++;
			augment(t);
			t = findpath();
		}
		Delta /= 2;
		if (trace) traceString += '\n';
	}
	if (trace) traceString += g.toString(0,1);
	return [traceString, {  'phaseCount': phaseCount, 'pathCount': pathCount,
			 	  			'findpathSteps': findpathSteps } ];
}

/** Do start of phase processing.  */
function newPhase() {
	// If any edge violates labeling condition, add Delta units of
	// flow to it. This eliminates it from the residual graph for
	// the current scaling factor.
	let s = ''; let flow = 0; let cost = 0;
	if (trace) {
		flow = g.totalFlow(); cost = g.totalCost();
	}
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = g.tail(e); let v = g.head(e);
		if (g.res(e,u) >= Delta) {
			if (g.cost(e,u) + (lambda[u] - lambda[v]) < 0) {
				if (trace) s += ` ${g.edge2string(e)}:${g.index2string(u)}`
				g.addFlow(e,u,Delta);
				excess[u] -= Delta; excess[v] += Delta;
			}
		}
		if (g.res(e,v) >= Delta) {
			if (g.cost(e,v) + (lambda[v] - lambda[u]) < 0) {
				if (trace) s += ` ${g.edge2string(e)}:${g.index2string(v)}`
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
	if (trace) {
		traceString +=	`Delta=${Delta} flow ${flow}, cost ${cost}\n` +
						`adding to:${s}\n` +
					    `sources ${''+sources}, sinks${''+sinks}\n`; 
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
	let cmax = -Infinity; let t = 0;
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
function augment(t) {
	let s = t; let ts = '';
	for (let e = pedge[s]; e != 0; e = pedge[s]) {
		if (trace) {
			if (ts.length > 0) ts = ' ' + ts;
			ts = g.index2string(s) + ts;
		}
		let u = g.mate(s,e); g.addFlow(e,u,Delta); s = u;
	}
	if (trace)
		traceString += `[${g.index2string(s)} ${ts}]\n`;
	excess[s] -= Delta; excess[t] += Delta;
	if (excess[s] < Delta) sources.delete(s);
	if (excess[t] > -Delta) sinks.delete(t);
}
