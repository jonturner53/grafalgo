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
let C;        // C[u] is cost of path to u from source in findCycle
let link;	  // link[] is parent edge of u
let q;        // queue used in findCycle
let cycleIds; // array used to label cycles with an integer identifier

let cycles;   // number of negative cycles found
let passes;   // number of passes in findCycle
let steps;    // steps involved in searching for cycles

/** Find minimum cost flow in a weighted flow graph using
 *  Klein's cycle reduction method. 
 *  @param fg is a flow graph with edge costs and an initial flow;
 *  on return, the flow is a minimum cost flow with the same value
 *  as the initial flow
 */
export default function mcflowK(fg, trace=false) {
	g = fg;

	C = new Float32Array(g.n+1);
	link = new Int32Array(g.n+1);
	q = new List(g.n);
	cycleIds = new Int8Array(g.n+1);

	cycles = steps = passes = 0;

	let ts = '';
	if (trace) {
		ts += 'initial cost: ' + g.totalCost() + '\n' +
			  'cycleCapacity cycle totalCost\n';
	}

	let u = findCycle();
	while (u != 0) {
		cycles++;
		let s = augment(u, trace);
		if (trace) ts += s;
		u = findCycle();
	}
	if (trace) ts += g.toString(1);
	return [ ts, { 'cycles': cycles, 'passes': passes, 'steps': steps} ];
}

/** Find a negative cost cycle in the residual graph.
 *  @return some vertex on the cycle, or 0 if no negative
 *  cycle is present in the residual graph; the edges in the
 *  cycle are found by traversing the link pointers, starting
 *  at link[returnedVertex].
 */
function findCycle() {
	C.fill(0); link.fill(0); q.clear();
	for (let u = 1; u <= g.n; u++) q.enq(u);

	let last = q.last(); // each pass completes when last removed from q
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			steps++;
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e);
			if (C[v] > C[u] + g.costFrom(e,u)) {
				link[v] = e;
				C[v] = C[u] +  g.costFrom(e,u);
				if (!q.contains(v)) q.enq(v);
			}
		}

		if (u == last) {
			passes++;
			let v = cycleCheck();
			if (v != 0) return v;
			last = q.last();
		}
	}
	return 0;
}

/** Check for a cycle in the link pointers.
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
			e = link[v];
			if (e == 0) break;
			v = g.mate(v,e);
			steps++;
		}
		if (cycleIds[v] == id && e != 0) return v;
		
		// find next unlabeled vertex 
		while (u <= g.n && cycleIds[u] != 0) u++;
		id++;
	}
	return 0;
}

/** Add flow to a negative-cost cycle.
 *  Adds as much flow as possible to the cycle, reducing the cost
 *  without changing the flow value.
 *  @param z is a vertex on a cycle defined by the link array
 */
function augment(z, trace=false) {
	// determine residual capacity of cycle
	let u = z; let e = link[u]; let f = Infinity;
	do {
		let v = g.mate(u,e);
		f = Math.min(f,g.res(e,v));
		u = v; e = link[u];
		steps++;
	} while (u != z);

	// add flow to saturate cycle
	let ts = '';
	if (trace) ts += g.index2string(z);
	u = z; e = link[u];
	do {
		let v = g.mate(u,e);
		g.addFlow(e,v,f);
		if (trace) ts = `${g.index2string(v)}:${g.costFrom(e,v)} ${ts}`;
		u = v; e = link[u];
	} while (u != z);
	if (trace) ts = `${f} [${ts}] ${g.totalCost()}\n`;
	return ts;
}
