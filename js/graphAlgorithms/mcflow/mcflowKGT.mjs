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
let P;	  // P[i][u]=edge to parent of u in mcp of length i to u

let cycleCount;		    // number of negative cycles found
let findCycleSteps;     // steps involved in searching for cycles
let cycleCandidates;  // number of cycle candidates

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
	C = new Array(); P = new Array();
	for (let i = 0; i <= g.n; i++) {
		C.push(new Float32Array(g.n+1));
		P.push(new Int32Array(g.n+1));
	}

	trace = traceflag; traceString = '';

	cycleCount = findCycleSteps = cycleCandidates = 0;

	if (trace) {
		traceString += 'initial cost: ' + g.totalCost() + '\n' +
			  'cycleCapacity cycle totalCost\n';
	}
	let [u,i] = findCycle();
	while (u != 0) {
		cycleCount++;
		augment(u,i);
		[u,i] = findCycle();
	}
	if (trace) traceString += g.toString(0,1);
	return [ traceString, { 'cycleCount': cycleCount,
				   'cycleCandidates': cycleCandidates,
				   'findCycleSteps': findCycleSteps} ];
}

/** Find a negative cost cycle in the residual graph.
 *  @return a pair [u,i] where u is a vertex on a min mean cost cycle and
 *  i is the length of the cycle, or [0,0] if the cost of the cycle is 
 *  not negative; if a cycle is present, the P values define a partial
 *  shortest path tree from u with depth i.
 */
function findCycle() {
	// First, compute shortest path lengths of length i <= g.n
	for (let i = 0; i <= g.n; i++) {
		for (let u = 1; u <= g.n; u++) {
			findCycleSteps++;
			// compute C[i][u] the cost of min cost path to u with i edges
			if (i == 0) {
				C[i][u] = 0;
			} else {
				C[i][u] = Infinity; 
				for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
					let v = g.mate(u,e);
					if (g.res(e,v) > 0 && C[i-1][v] + g.cost(e,v) < C[i][u]) {
						C[i][u] = C[i-1][v] + g.cost(e,v); 
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
				meanCost[u] = [n-i,mc];
			}
		}
		if (meanCost[u][1] < meanCost[umin][1]) umin = u;
	}
	let mmc = meanCost[umin][1];
	if (mmc >= 0) return [0,0];

	// Now, get list of all vertices that match min cost
	let eps = 1e-6;
	let candidates = new List(g.n+1);
	for (let u = 1; u <= n; u++) {
		findCycleSteps++;
		let cu = meanCost[u][1];
		if (Math.abs((cu-mmc)/(cu+mmc)) < eps)
			candidates.enq(u);
	}

	// Now compute shortest path lengths from each of the candidates
	// to find one with a min mean length cycle
	for (let s = candidates.first(); s != 0; s = candidates.next(s)) {
		cycleCandidates++;
		C[0].fill(Infinity); P[0].fill(0); C[0][s] = 0;
		for (let i = 1; i <= g.n; i++) {
			C[i].fill(Infinity); P[i].fill(0);
			for (let u = 1; u <= g.n; u++) {
				for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
					findCycleSteps++;
					let v = g.mate(u,e);
					if (g.res(e,v) > 0 && C[i-1][v] + g.cost(e,v) < C[i][u]) {
						C[i][u] = C[i-1][v] + g.cost(e,v); P[i][u] = e;
					}
				}
			}
			let cs = C[i][s]/i;
			if (Math.abs((cs-mmc)/(cs+mmc)) < eps) return [s,i];
		}
	}
	return [0,0]; // should never reach here
}

/** Add flow to a negative-cost cycle.
 *  Adds as much flow as possible to the cycle, reducing the cost
 *  without changing the flow value.
 *  @param z is a vertex on a min mean cost cycle
 *  @param i is number of edges in min mean cost cycle
 */
function augment(z,i) {
	// C[i][z] is min mean cycle cost and P values give parent edges
	let u = z; let j = i; let f = Infinity;
	do {
		let e = P[j--][u];
		let v = g.mate(u,e);
		f = Math.min(f,g.res(e,v));
		u = v;
	} while (u != z);

	// now add flow to the path to saturate cycle
	let ts = ''; if (trace) ts += g.index2string(z);
	u = z; j = i;
	do {
		let e = P[j--][u];
		let v = g.mate(u,e);
		g.addFlow(e,v,f);
		if (trace) ts = `${g.index2string(v)}:${g.cost(e,v)} ${ts}`;
		u = v;
	} while (u != z);
	if (trace) traceString += `${f} [${ts}] ${g.totalCost()}\n`;
}
