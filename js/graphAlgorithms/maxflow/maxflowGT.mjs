/** @file maxflowGT.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import { assert } from '../../common/Errors.mjs';

/** Common code shared by various instances of the push-relabel
 *  algorithm of Goldman and Tarjan.
 */

let g;			// g is reference to flow graph
let excess;		// excess[u] is excess flow entering u;
let nextedge;	// nextedge[u] is next edge to process at u
let d;			// d[u] is distance label at u
let getUnbal;	// reference to function that gets next unbalanced vertex
let putUnbal;	// reference to function that adds a vertex to unbalanced set

let relabelSteps;	// number of steps spent on relabeling
let balanceCount;	// number of balance operations
let balanceSteps;	// number of steps in balance operations

/** Compute maximum flow push-relabel algorithm of Goldman & Tarjan.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @param trace is a flag that enables execution tracing
 *  @param getUbal is function that returns next unbalanced vertex
 *  @param putUbal is function that adds vertex to unbalanced set
 *  @param relabThresh is number of steps in incremental relabeling
 *  operations before switching to batch mode
 */
export default function maxflowGK(fg, getUbal, putUbal, trace=false,
								  relabThresh=fg.m) {
	g = fg;
	excess = new Int32Array(g.n+1); 
	nextedge = new Int32Array(g.n+1);
	d = new Int32Array(g.n+1);
	getUnbal = getUbal; putUnbal = putUbal;

	relabelSteps = 0;
	balanceCount = 0;
	balanceSteps = 0;

	excess.fill(0); let s = g.source;
	for (let e = g.firstOut(s); e != 0; e = g.nextAt(s,e)) {
		let f = g.res(e,s); if (f == 0) continue;
		g.addFlow(e, s, f);
		let v = g.head(e);
		if (v != g.sink) excess[v] += f;
	}
	relabelAll();
	nextedge[g.source] = nextedge[g.sink] = -1; // dummy non-zero value
	let trigger = relabelSteps + relabThresh;
	let batch = (relabThresh == 0);

	let ts = '';
	if (trace)
		ts += 'unbalanced vertex, distance label, excess, nextedge\n';

	let u = getUnbal();
	while (u != 0) {
		if (trace) {
			ts += `${g.index2string(u)} ${d[u]} ${excess[u]} ` +
				  `${g.edge2string(nextedge[u])}\n`;
		}
		if (batch) {
			balance(u); u = getUnbal();
			if (u == 0) {
				relabelAll(); u = getUnbal();
				trigger = relabelSteps + relabThresh;
				batch = (relabThresh == 0);
				if (trace) ts = ts.slice(0,-1) + ' ***\n';
			}
		} else if (!batch) {
			if (!balance(u)) {
				d[u] = 1 + minlabel(u);
				nextedge[u] = g.firstAt(u);
				putUnbal(u, d[u]);
			}
			u = getUnbal();
			if (relabelSteps > trigger) batch = true;
			if (trace) ts = ts.slice(0,-1) + ' ***\n';
		}
	}
	return [g.totalFlow(), ts, {'relabelSteps': relabelSteps,
								'balanceCount': balanceCount,
								'balanceSteps': balanceSteps} ];
}
/** Find smallest label on an adjacent vertex through an edge with
 *  positive residual capacity.
 *  @param u is a vertex
 *  @return the smallest label on a neighbor of u for which the
 *  connecting edge has positive residual capacity
 */
export function minlabel(u) {
	let small = 2*g.n;
	for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
		relabelSteps++;
		if (g.res(e,u) > 0)
			small = Math.min(small, d[g.mate(u,e)]);
	}
	return small;
}

/** Attempt to balance vertex, by pushing flow through admissible edges.
 *  @param u is a vertex
 *  @return true if u was successfully balanced
 */
export function balance(u) {
	balanceCount++;
	if (excess[u] <= 0) return true;
	for (let e = nextedge[u]; e != 0; e = nextedge[u]) {
		balanceSteps++;
		let v = g.mate(u,e);
		if (g.res(e,u) > 0 && d[u] == d[v]+1 && nextedge[v] != 0) {
			let x = Math.min(excess[u],g.res(e,u));
			g.addFlow(e,u,x); excess[u] -= x; excess[v] += x;
			if (v != g.source && v != g.sink) putUnbal(v, d[v]);
			if (excess[u] == 0) return true;
		}
		nextedge[u] = g.nextAt(u,e);
	}
	return false;
}


/** Compute exact distance labels for all vertices, reset nextedge
	and add vertices with excess flow to unbalanced set.
*/
export function relabelAll() {
	let q = new List(g.n); d.fill(2*g.n,1);

	// compute distance labels for vertices that have path to sink
	q.enq(g.sink); d[g.sink] = 0;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			relabelSteps++;
			let v = g.mate(u,e);
			if (g.res(e,v) > 0 && d[v] > d[u] + 1) {
				q.enq(v); d[v] = d[u] + 1;
			}
		}
		if (u != g.sink) {
			nextedge[u] = g.firstAt(u);
			if (excess[u] > 0) putUnbal(u, d[u]);
		}
	}

	assert(d[g.source] >= g.n, 'relabelAll: source-to-sink path present');

	// compute distance labels for remaining vertices
	q.enq(g.source); d[g.source] = g.n;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			relabelSteps++;
			let v = g.mate(u,e);
			if (g.res(e,v) > 0 && d[v] > d[u] + 1) {
				q.enq(v); d[v] = d[u] + 1;
			}
		}
		if (u != g.source) {
			nextedge[u] = g.firstAt(u);
			if (excess[u] > 0) putUnbal(u, d[u]);
		}
	}
}
