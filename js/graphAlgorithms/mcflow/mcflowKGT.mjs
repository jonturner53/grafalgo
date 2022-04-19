/** @file mcflowKGT.js
 * 
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';

let g;		  // shared reference to flow graph

// private data used by findCycle
let C;		  // C[i][u]=cost of min cost path (mcp) of length i to u in g
let pedge;	  // pedge[i][u]=edge to parent of u in mcp of length i to u

let cg;       // cycle graph used by findCycle to pass cycle info to augment
let cgpe;     // cgpe[u] is parent edge of u in cg - used by augment
let cgq;      // List used by augment for queue in breadth-first searches of cg

let cycleCount;		  // number of negative cycles found
let findCycleSteps;  // steps involved in searching for cycles
let findCycleCandidates;  // number of passes in findCycle

let trace;
let traceString;

/** Find minimum cost flow in a weighted flow graph using
 *  Goldberg and Tarjan's refinement of Klein's cycle reduction method
 *  that selects negative cycles with minimum mean cost.
 *  @param fg is a flow graph with edge costs and an initial flow;
 *  on return, the flow is a minimum cost flow with the same value
 *  as the initial flow
 */
export default function mcflowKGT(fg, traceflag=false) {
	g = fg;
	C = new Array(); pedge = new Array();
	for (let i = 0; i <= g.n; i++) {
		C.push(new Float32Array(g.n+1));
		pedge.push(new Int32Array(g.n+1));
	}
	cg = new Digraph(g.n, g.edgeCapacity);
	cgpe = new Int32Array(g.n+1);
	cgq = new List(g.n);

	trace = traceflag; traceString = '';

	cycleCount = findCycleSteps = findCycleCandidates = 0;

	if (trace) {
		traceString += 'initial cost: ' + g.totalCost() + '\n' +
			  'cycleCapacity cycle totalCost\n';
	}
	let u = findCycle();
	while (u != 0) {
		cycleCount++;
		augment(u);
		u = findCycle();
	}
	if (trace) traceString += g.toString(0,1);
	return [ traceString, { 'cycleCount': cycleCount,
				   'findCycleCandidates': findCycleCandidates,
				   'findCycleSteps': findCycleSteps} ];
}

/** Find a negative cost cycle in the residual graph.
 *  @return a vertex on the selected cycle or 0 if there is no
 *  cycle is present in the residual graph; on return, the cycle
 *  is defined by the pedge values
 */
function findCycle() {
	for (let i = 0; i <= g.n; i++) {
		for (let u = 1; u <= g.n; u++) {
			findCycleSteps++;
			// compute C[i][u] the cost of min cost path to u with i edges
			if (i == 0) {
				C[i][u] = 0;
			} else {
				C[i][u] = Infinity; pedge[i][u] = 0;
				for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
					let v = g.mate(u,e);
					if (g.res(e,v) > 0 && C[i-1][v] + g.cost(e,v) < C[i][u]) {
						C[i][u] = C[i-1][v] + g.cost(e,v); pedge[i][u] = e;
					}
				}
			}
		}
	}

	// Now apply Karp's equation to find cost of least mean cost cycle
	let n = g.n;
	let meanCost = new Array(g.n+1);
	let umin = 1;
	for (let u = 1; u <= n; u++) {
		meanCost[u] = [0, (C[n][u] - C[0][u]) / n];
		for (let i = 1; i <= n; i++) {
			findCycleSteps++;
			let mc = (C[n][u] - C[i][u]) / (n - i);
			if (mc > meanCost[u][1]) {
				meanCost[u] = [i,mc];
			}
		}
		if (meanCost[u][1] < meanCost[umin][1]) umin = u;
	}
	if (meanCost[umin][1] >= 0) return 0;

	let candidates = new List(g.n+1);
	for (let u = 1; u <= n; u++) {
		if (meanCost[u][1] == meanCost[umin][1])
			candidates.enq(u);
	}
	findCycleCandidates += candidates.length;

	for (let u = candidates.first(); u != 0; u = candidates.next(u)) {
		let i = n; let v = u;
		for (let e = pedge[n][v]; e != 0 && i >= 0; e = pedge[--i][v]) {
			let w = g.mate(v,e);
			if (w == u) {
				// build cycle graph (cg) using same edge numbers as in g
				// and return
				cg.clear(); i = n; v = u;
				for (let e = pedge[n][v]; ; e = pedge[--i][v]) {
					w = g.mate(v,e);
					if (!cg.validEdge(e)) cg.join(w,v,e)
					if (w == u) return u;
					v = w;
				}
			}
			v = w;
		}
	}
	return 0; // should never reach here
}

/** Add flow to a negative-cost cycle.
 *  Adds as much flow as possible to the cycle, reducing the cost
 *  without changing the flow value.
 *  @param z is a vertex on a cycle defined by the pedge array
 */
function augment(z) {
	cgpe.fill(0);
	let e = cg.firstOut(z); let u = cg.mate(z,e); cgpe[u] = e;
	assert(cg.nextOut(z,e) == 0, 'mcflowKGT.augment: unexpected edge in cg');
	cgq.clear(); cgq.enq(u); 
	while (!cgq.empty()) {
		u = cgq.deq(); if (u == z) break;
		for (e = cg.firstOut(u); e != 0; e = cg.nextOut(u,e)) {
			let v = cg.head(e);
			if (cgpe[v] == 0) {
				cgpe[v] = e; cgq.enq(v);
			}
		}
	}
	// now find residual capacity of shortest path back to z
	u = z; e = cgpe[u]; let f = Infinity;
	do {
		let v = cg.tail(e);
		f = Math.min(f,g.res(e,v));
		u = v; e = cgpe[u];
	} while (u != z);

	// now add flow to the path to saturate cycle
	let ts = ''; if (trace) ts += g.index2string(z);
	u = z; e = cgpe[u];
	do {
		let v = cg.tail(e);
		g.addFlow(e,v,f);
		if (trace) ts = `${g.index2string(v)}:${g.cost(e,v)} ${ts}`;
		u = v; e = cgpe[u];
	} while (u != z);

	if (trace) traceString += `${f} [${ts}] ${g.totalCost()}\n`;
}
