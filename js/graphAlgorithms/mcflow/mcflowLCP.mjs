/** @file mcflowLCP.cpp
 * 
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

let g;          // shared reference to flow graph
let lambda;     // lambda[u] is vertex label used to make costs non-negative

let c;          // c[u] is shortest path to u as computed by findpath
let pedge;      // pedge[u] is parent edge of u in spt computed by findpath
let border;		// heap used by findpath
let q;          // list used in initLabels

let pathCount;      // number of augmenting paths
let initSteps;     // number of steps to compute distance labels
let findpathSteps;  // number of steps in findpath method

/** Find minimum cost, flow in weighted flow graph using the least-cost
 *  augmenting path algorithm.
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
export default function mcflowLCP(fg, trace=false, mostNeg=false) {
	g = fg;
	lambda = new Float32Array(g.n+1);
	c = new Float32Array(g.n+1);
	pedge = new Int32Array(g.n+1);
	border = new ArrayHeap(g.n, 4);
	q = new List(g.n);

	pathCount = initSteps = findpathSteps = 0;

	let ts = '';
	if (trace) {
		ts += 'path, residual capacity, path cost, total cost\n';
	}
	initLabels(); let totalCost = 0;
	while (findpath()) {
		pathCount++;
		let [resCap, cost] = pathProperties();
		if (mostNeg && cost >= 0) break;
		let s = augment(resCap, trace);
		totalCost += resCap * cost;
		if (trace) 
			ts += `[${s}] ${resCap} ${cost} ${totalCost}\n`;
	}
	if (trace) ts += g.toString(0,1);
	return [ts, {
				  'pathCount': pathCount,
				  'initSteps' : initSteps,
			  	  'findpathSteps' : findpathSteps } ];
}


/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in the graph.
 *  Uses the breadth-first scanning algorithm to compute shortest paths
 *  over edges with positive residual capacity.
 */
function initLabels() {
	pedge.fill(0); lambda.fill(0); q.clear();
	for (let u = 1; u <= g.n; u++) q.enq(u);
	let pass = 0; let last = q.last();
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			initSteps++;
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e);
			if (lambda[v] > lambda[u] + g.cost(e,u)) {
				lambda[v] = lambda[u] + g.cost(e,u); pedge[v] = e;
				if (!q.contains(v)) q.enq(v);
			}
		}
		if (u == last && !q.empty()) { pass++; last = q.last(); }
		assert(pass<g.n, 'mcflowLCP: negative cost cycle');
	}
}

/** Find a least cost augmenting path.
 *  @param return true if a path was found, else false.
 */
function findpath() {
	c.fill(Infinity); pedge.fill(0); border.clear();
	c[g.source] = 0; border.insert(g.source,0);
	while (!border.empty()) {
		let u = border.deletemin();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			findpathSteps++;
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e);
			if (c[v] > c[u] + g.cost(e,u) + (lambda[u] - lambda[v])) {
				pedge[v] = e;
				c[v] = c[u] + g.cost(e,u) + (lambda[u]-lambda[v]);
				if (!border.contains(v)) border.insert(v,c[v]);
				else border.changekey(v,c[v]);
			}
		}
	}
	// update lambda for next round
	for (let u = 1; u <= g.n; u++) lambda[u] += c[u];
	return (pedge[g.sink] != 0);
}

/** Compute properties of augmenting path defined by pedge.
 *  @return pair [resCap, cost] where resCap is residual capacity of the path
 *  and cost is its total cost.
 */
function pathProperties() {
	let resCap = 0x7fffffff; let cost = 0;
	let u = g.sink; let e = pedge[u];
	while (u != g.source) {
		let v = g.mate(u,e);
		resCap = Math.min(resCap, g.res(e,v)); cost += g.cost(e,v);
		u = v; e = pedge[u];
	}
	return [resCap, cost]
}

/** Add flow to the path defined by pedge.
 *  @param f is the amount of flow to add to the path
 */
function augment(f, trace=false) {
	let u = g.sink; let e = pedge[u]; let ts = g.index2string(u);
	while (u != g.source) {
		let v = g.mate(u,e);
		if (trace) ts = g.index2string(v) + ' ' + ts;
		g.addFlow(e,v,f);
		u = v; e = pedge[u];
	}
	return ts;
}
