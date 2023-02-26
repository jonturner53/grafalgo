/** @file mcflowJ.cpp
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

let g;        // shared reference to flow graph
let link;     // link[u] is parent edge of u
let excess;   // excess[u] is excess flow entering u
let sources;  // list of sources (nodes with positive excess)
let sinks;    // list of sinks (nodes with negative excess)

let trace;
let traceString;

let paths;      // number of augmenting paths
let steps;      // number of steps in findpath method

/** Find minimum cost maximum flow in a weighted flow graph using Orlin's
 *  capacity scaling algorithm.
 *  Requires that the original graph has no negative cost cycles.
 */
export default function mcflowJ(fg, traceFlag=false) {
	g = fg;

	link = new Int32Array(g.n+1);
	excess = new Int32Array(g.n+1);
	sources = new List(g.n); sources.addPrev(); // doubly linked
	sinks = new List(g.n); sinks.addPrev();

	trace = traceFlag; traceString = '';
	paths = steps = 0;

	// Determine a max flow so that we can initialize excess
	// values at s and t
	maxflowD(g);
	excess[g.source] = g.totalFlow();
	excess[g.sink] = -g.totalFlow();
	let totalExcess = excess[g.source];
	g.clearFlow();

	// saturate negative cost edges
	for (let e = g.first(); e != 0; e = g.next(e)) {
		steps++;
		if (g.cost(e) < 0) {
			g.flow(e, g.cap(e));
			excess[g.tail(e)] -= g.cap(e);
			excess[g.head(e)] += g.cap(e);
			totalExcess += g.cap(e);
		}
	}
	for (let u = 1; u <= g.n; u++) {
		steps++;
		if (excess[u] > 0) {
			sources.enq(u);
		} else if (excess[u] < 0) {
			sinks.enq(u);
		}
	}

	if (trace) {
		traceString += g.toString(1) + '\n' + 'sources, sinks and paths ' +
					   'with capacity and flow cost\n'
	}
	let t = findpath();
	while (t) {
		paths++; augment(t);
		t = findpath();
	}
	if (trace) traceString += '\n' + g.toString(1);
	return [traceString, { 'paths': paths, 'steps': steps } ];
}

/** Find a least cost augmenting path from some source and update the labels.
 *  @return the "sink" vertex for the computed path; on return, the link
 *  vector defines the path from the sink back to some source
 */
function findpath() {
	let c = new Float32Array(g.n+1);
	let q = new List(g.n);
	link.fill(0); c.fill(Infinity);

	// search from all sources in parallel
	for (let s = sources.first(); s != 0; s = sources.next(s)) {
		c[s] = 0; q.enq(s); steps++;
	}
	let t = 0; let cmax = -Infinity;
	while (!q.empty()) {
		let u = q.deq();
		if (sinks.contains(u)) t = u;
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e); steps++;
			if (c[v] > c[u] + g.costFrom(e,u)) {
				c[v] = c[u] + g.costFrom(e,u); link[v] = e;
				if (!q.contains(v)) q.enq(v);
			}
		}
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
		u = g.mate(u,e);
		delta = Math.min(delta, g.res(e,u));
	}
	delta = Math.min(delta, excess[u]);
	delta = Math.min(delta, -excess[t]);

	u = t; let ts = '';
	for (let e = link[u]; e; e = link[u]) {
		steps++;
		u = g.mate(u,e);
		if (trace) {
			if (ts.length > 0) ts = ' ' + ts;
			ts = g.x2s(u) + ':' + g.res(e,u) + ts;
		}
		g.addFlow(e,u,delta);
	}
	if (trace) {
		traceString += sources.toString(u => g.x2s(u) + ':' + excess[u]) + ' ';
		traceString += sinks.toString(u => g.x2s(u) + ':' + excess[u]) + '\n  ';
		traceString += `[${ts} ${g.x2s(t)}] ${delta} ${g.totalCost()}\n`;
	}
	excess[u] -= delta; excess[t] += delta;
	if (excess[u] == 0) sources.delete(u);
	if (excess[t] == 0) sinks.delete(t);
}
