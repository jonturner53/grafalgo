/** @file mcflowJEK.cpp
 * 
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

let g;          // shared reference to flow graph
let lambda;     // lambda[u] is vertex label used to make costs non-negative

let c;          // c[u] is shortest path to u as computed by findpath
let link;       // link[u] is parent edge of u in spt computed by findpath
let border;		// heap used by findpath
let q;          // list used in initLabels

let paths;      // number of augmenting paths
let steps;      // total number of steps

/** Find minimum cost, flow in weighted flow graph using the least-cost
 *  augmenting path algorithm of Jewell as refined by Edmonds and Karp.
 *  @param fg is a flow graph; if it has an initial non-zero flow, it is
 *  assumed to be a min-cost flow among all flows with the same value;
 *  the final flow is returned in its edges' flow field; 
 *  @param is a flag that controls the production of trace information
 *  @param mostNeg is a flag; if it is true, the algorithm finds a
 *  flow with the largest negative cost (this may not be a max value flow);
 *  otherwise, it finds a min cost, max flow. 
 *  @return a tuple [flow, cost, ts, stats] where flow is the final flow
 *  value, cost is the flow cost, ts is a trace string and stats is a
 *  statistics object.
 */
export default function mcflowJEK(fg, trace=false, mostNeg=false) {
	paths = steps = 0;
	g = fg;
	lambda = new Float32Array(g.n+1);
	c = new Float32Array(g.n+1);
	link = new Int32Array(g.n+1);
	border = new ArrayHeap(g.n, 4);
	q = new List(g.n);
	steps += g.n;

	let ts = '';
	if (trace) {
		ts += 'path, residual capacity, path cost, total cost\n';
	}
	initLabels(); let totalCost = 0;
	while (findpath()) {
		paths++; steps++;
		let [resCap, cost] = pathProperties();
		if (mostNeg && cost >= 0) break;
		let s = augment(resCap, trace);
		totalCost += resCap * cost;
		if (trace) 
			ts += `[${s}] ${resCap} ${cost} ${totalCost}\n`;
	}
	if (trace) ts += 'graph with mincost flow\n' + g.toString(1);
	return [ts, { 'paths': paths, 'steps' : steps } ];
}

/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in the graph.
 *  Uses the breadth-first scanning algorithm to compute shortest paths
 *  over edges with positive residual capacity.
 */
function initLabels() {
	link.fill(0); lambda.fill(0); q.clear();
	for (let u = 1; u <= g.n; u++) q.enq(u);
	let pass = 0; let last = q.last();
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			steps++;
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e);
			if (lambda[v] > lambda[u] + g.costFrom(e,u)) {
				lambda[v] = lambda[u] + g.costFrom(e,u); link[v] = e;
				if (!q.contains(v)) q.enq(v);
			}
		}
		if (u == last && !q.empty()) { pass++; last = q.last(); }
		fassert(pass<g.n, 'mcflowJEK: negative cost cycle');
	}
}

/** Find a least cost augmenting path.
 *  @param return true if a path was found, else false.
 */
function findpath() {
	c.fill(Infinity); link.fill(0); border.clear();
	c[g.source] = 0; border.insert(g.source,0);
	while (!border.empty()) {
		let u = border.deletemin();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			steps++;
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e);
			if (c[v] > c[u] + g.costFrom(e,u) + (lambda[u] - lambda[v])) {
				link[v] = e;
				c[v] = c[u] + g.costFrom(e,u) + (lambda[u] - lambda[v]);
				if (!border.contains(v)) border.insert(v,c[v]);
				else border.changekey(v,c[v]);
			}
		}
	}
	steps += border.getStats().steps;
	// update lambda for next round
	for (let u = 1; u <= g.n; u++) { lambda[u] += c[u]; steps++; }
	return (link[g.sink] != 0);
}

/** Compute properties of augmenting path defined by link.
 *  @return pair [resCap, cost] where resCap is residual capacity of the path
 *  and cost is its total cost.
 */
function pathProperties() {
	let resCap = 0x7fffffff; let cost = 0;
	let u = g.sink; let e = link[u];
	while (u != g.source) {
		let v = g.mate(u,e);
		resCap = Math.min(resCap, g.res(e,v)); cost += g.costFrom(e,v);
		u = v; e = link[u]; steps++;
	}
	return [resCap, cost]
}

/** Add flow to the path defined by link.
 *  @param f is the amount of flow to add to the path
 */
function augment(f, trace=false) {
	let u = g.sink; let e = link[u]; let ts = g.index2string(u);
	while (u != g.source) {
		let v = g.mate(u,e);
		if (trace) ts = g.index2string(v) + ' ' + ts;
		g.addFlow(e,v,f);
		u = v; e = link[u]; steps++;
	}
	return ts;
}
