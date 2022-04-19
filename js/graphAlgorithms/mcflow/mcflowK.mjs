/** @file mcflowK.js
 * 
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';

let g;		  // shared reference to flow graph
let pedge;	  // pedge[] is parent edge of u
let cycleIds; // array used to label cycles with an integer identifier

let cycleCount;		  // number of negative cycles found
let findCycleSteps;  // steps involved in searching for cycles
let findCyclePasses;  // number of passes in findCycle

/** Find minimum cost flow in a weighted flow graph using
 *  Klein's cycle reduction method. 
 *  @param fg is a flow graph with edge costs and an initial flow;
 *  on return, the flow is a minimum cost flow with the same value
 *  as the initial flow
 */
export default function mcflowK(fg, trace=false) {
	g = fg;
	pedge = new Int32Array(g.n+1);
	cycleIds = new Int8Array(g.n+1);

	cycleCount = findCycleSteps = findCyclePasses = 0;

	let ts = '';
	if (trace) {
		ts += 'initial cost: ' + g.totalCost() + '\n' +
			  'cycleCapacity cycle totalCost\n';
	}

	let u = findCycle();
	while (u != 0) {
		cycleCount++;
		let s = augment(u, trace);
		if (trace) ts += s;
		u = findCycle();
	}
	if (trace) ts += g.toString(0,1);
	return [ ts, { 'cycleCount': cycleCount,
				   'findCyclePasses': findCyclePasses,
				   'findCycleSteps': findCycleSteps} ];
}

/** Add flow to a negative-cost cycle.
 *  Adds as much flow as possible to the cycle, reducing the cost
 *  without changing the flow value.
 *  @param z is a vertex on a cycle defined by the pedge array
 */
function augment(z, trace=false) {
	// determine residual capacity of cycle
	let u = z; let e = pedge[u]; let f = Infinity;
	do {
		let v = g.mate(u,e);
		f = Math.min(f,g.res(e,v));
		u = v; e = pedge[u];
	} while (u != z);

	// add flow to saturate cycle
	let ts = '';
	if (trace) ts += g.index2string(z);
	u = z; e = pedge[u];
	do {
		let v = g.mate(u,e);
		g.addFlow(e,v,f);
		if (trace) ts = `${g.index2string(v)}:${g.cost(e,v)} ${ts}`;
		u = v; e = pedge[u];
	} while (u != z);
	if (trace) ts = `${f} [${ts}] ${g.totalCost()}\n`;
	return ts;
}

/** Find a negative cost cycle in the residual graph.
 *  @return some vertex on the cycle, or 0 if no negative
 *  cycle is present in the residual graph; the edges in the
 *  cycle are found by traversing the pedge pointers, starting
 *  at pedge[returnedVertex].
 */
function findCycle() {
	let c = new Float32Array(g.n+1);
	let q = new List(g.n);

	for (let u = 1; u <= g.n; u++) { 
		pedge[u] = 0; c[u] = 0; q.enq(u);
	}

	let last = q.last(); // each pass completes when last removed from q
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			findCycleSteps++;
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e);
			if (c[v] > c[u] + g.cost(e,u)) {
				pedge[v] = e;
				c[v] = c[u] +  g.cost(e,u);
				if (!q.contains(v)) q.enq(v);
			}
		}

		if (u == last) {
			findCyclePasses++;
			let v = cycleCheck();
			if (v != 0) return v;
			last = q.last();
		}
	}
	return 0;
}

/** Check for a cycle in the pedge pointers.
 *  @return a vertex on a cycle or 0, if none found
 */
function cycleCheck() {
	cycleIds.fill(0);
	let u = 1; let id = 1;
	while (u <= g.n) {
		// follow parent pointers from u, labeling new vertices
		// seen with the value of id, so we can recognize a loop
		let v = u; let e;
		while (cycleIds[v] == 0) {
			cycleIds[v] = id;
			e = pedge[v];
			if (e == 0) break;
			v = g.mate(v,e);
		}
		if (cycleIds[v] == id && e != 0) return v;
		
		// find next unlabeled vertex 
		while (u <= g.n && cycleIds[u] != 0) u++;
		id++;
	}
	return 0;
}
