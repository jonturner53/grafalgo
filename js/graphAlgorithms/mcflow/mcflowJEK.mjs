/** @file mcflowJEK.cpp
 * 
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

let g;        // shared reference to flow graph
let link;     // link[u] is parent edge of u
let lambda;   // lambda[u] is vertex label used to make costs non-negative

let border;   // heap used by findpath
let Cost;     // array of path costs, used by findpath
let q;        // queue of vertices, used by findpath

let trace;
let traceString;

let paths;      // number of augmenting paths
let steps;      // number of steps in findpath method

/** Find minimum cost maximum flow in a weighted flow graph using Jewell's
 *  algorithm with Dijkstra's algorithm using Edmonds/Karp edge cost transform.
 *  @param fg is a flow graph with a possibly non-zero initial flow with no
 *  unsaturated negative cycles
 *  @param leastCost is a boolean; when true, returns the least-cost flow;
 *  when false, returns the least-cost flow among those of maximum value
 *  @return [traceString,statsObject]
 */
export default function mcflowJEK(fg, leastCost=false, traceFlag=false) {
	g = fg; trace = traceFlag; traceString = '';

	link = new Int32Array(g.n+1);
	lambda = new Float32Array(g.n+1);
	border = new ArrayHeap(g.n,2);
	Cost = new Float32Array(g.n+1);
	q = new List(g.n);

	paths = steps = 0;

	traceString = '';
	if (trace) {
		traceString += g.toString(1) + '\n' +
					   'paths with added flow and resulting flow cost\n';
	}

	initLabels();
	while (findpath()) {
		let [rcap,pathCost] = pathProps();
		if (leastCost && pathCost >= 0) break;
		augment(rcap); paths++;
	}

	if (trace) traceString += '\nresulting flow ' + g.toString(9);
	steps += border.getStats().steps;
	let stats = { 'flow': g.totalFlow(), 'cost': g.totalCost(),
                  'paths': paths, 'steps': steps };
	g = link = lambda = border = Cost = q = null;
	return [traceString, stats];
}

/** Initialize vertex labels, making edge costs non-negative. */
function initLabels() {
	q.clear(); link.fill(0); Cost.fill(0);

	// put all vertices in queue, effectively searching from pseudo-source
	for (let u = 1; u <= g.n; u++) q.enq(u);
	let pass = 0; let last = q.last();
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e); steps++;
			if (Cost[v] > Cost[u] + g.costFrom(e,u)) {
				Cost[v] = Cost[u] + g.costFrom(e,u); link[v] = e;
				if (!q.contains(v)) q.enq(v);
			}
		}
		if (u == last) {
			assert(pass < g.n, 'mcflowJEK: negative cost cycle detected');
			pass++; last = q.last();
		}
			
	}
	for (let u = 1; u <= g.n; u++) lambda[u] = Cost[u];
}

/** Find a least cost augmenting path from some source and update the labels.
 *  @return the "sink" vertex for the computed path; on return, the link
 *  vector defines the path from the sink back to some source
 */
function findpath() {
	border.clear(); link.fill(0); Cost.fill(Infinity);

	let cmax = -Infinity;	// maximum finite path cost
	Cost[g.source] = 0; border.insert(g.source,0);
	while (!border.empty()) {
		let u = border.deletemin();
		cmax = Math.max(cmax, Cost[u]);
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
	if (!link[g.sink]) return false;
	for (let u = 1; u <= g.n; u++) {
		lambda[u] += Math.min(Cost[u],cmax);
	}
	steps += g.n;
	return true;
}

/** Compute residual capacity and cost of source/sink path. */
function pathProps() {
	let u = g.sink; let rcap = Infinity; let cost = 0;
	for (let e = link[u]; e != 0; e = link[u]) {
		u = g.mate(u,e);
		rcap = Math.min(rcap, g.res(e,u));
		cost += g.costFrom(e,u);
	}
	return [rcap,cost];
}

/** Augment the flow along augmenting path.
 *  @param rcap is residual capacity of source/sink path.
 */
function augment(rcap) {
	let u = g.sink; let ts = '';
	for (let e = link[u]; e; e = link[u]) {
		steps++;
		u = g.mate(u,e);
		if (trace) {
			if (ts.length > 0) ts = ' ' + ts;
			ts = g.x2s(u) + ':' + g.res(e,u) + ts;
		}
		g.addFlow(e,u,rcap);
	}
	if (trace) {
		traceString += `[${ts} ${g.x2s(g.sink)}] ${rcap} ${g.totalCost()}\n`;
	}
}
