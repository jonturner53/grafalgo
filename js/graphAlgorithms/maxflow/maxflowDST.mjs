/** @file maxflowDST.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import DynamicTrees from '../../dataStructures/specialty/DynamicTrees.mjs';

let g;           // shared reference to flow graph
let level;       // level[u] is distance from source to u in residual graph
let nextEdge;    // nextEdge[u] is the next edge to be processed at u

let trees;       // dynamic trees data structure
let upEdge;      // upEdge[u] is edge in g that links u to its tree parent
let huge;        // large value used for initial cost of tree roots

let paths;       // number of calls to findpath
let steps;       // total steps in findpath
let phases;      // number of phases

let extendCnt;
let pruneCnt;
let newphaseTime;
let fpt0;
let apt0;
let apt1;
let apt2;

/** Compute a maximum flow in a graph using Dinic's algorithm with
 *  Sleator & Tarjan dynmic trees data structure.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowDST(fg, trace=false) {
	g = fg;
	nextEdge = new Int32Array(g.n+1);
	level = new Int32Array(g.n+1);
	trees = new DynamicTrees(g.n);
	upEdge = new Int32Array(g.n+1);

	paths = steps = phases = 0;

	huge = 1;
	for (let e = g.first(); e != 0; e = g.next(e))
		huge += g.cap(e);
	for (let u = 1; u <= g.n; u++)
		trees.addcost(u, huge);
	steps += g.n;

	let ts = '';
	if (trace) {
		ts += g.toString(1) +
			  '\naugmenting paths with residual capacities\n';
	}

	while (newphase()) {
		phases++; 
		while (findpath()) {
			paths++;
			let [,s] = augment(trace);
			if (trace) ts += s + '\n';
		}
	}
	if (trace) ts += '\nflow: ' + g.toString(9);
	let treeStats = trees.getStats();
	steps += treeStats.steps;
	return [ts, {'flow': g.flowStats().totalFlow, 'phases': phases,
                 'paths': paths, 'steps': steps }];
}

/** Find an augmenting path from specified vertex to sink in residual graph.
 *  @return true if there is an augmenting path from source to the sink
 */
function findpath() {
	while (nextEdge[g.source] != 0) {
		let u = trees.findroot(g.source); let e = nextEdge[u];
		// look for unsaturated path from u to sink
		while (true) {
			steps++; 
			if (u == g.sink) return true;
			if (e == 0) { nextEdge[u] = 0; break; }
			let v = g.mate(u,e);
			if (g.res(e,u) > 0 && level[v]==level[u] + 1 && nextEdge[v]) {
				extend(u, e);
				u = trees.findroot(g.source); e = nextEdge[u];
			} else {
				e = nextEdge[u] = g.nextAt(u,e);
			}
		}
		// no path found, prune dead-end
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			steps++;
			let v = g.mate(u,e);
			if (e == upEdge[v])  {
				prune(v); nextEdge[v] = g.nextAt(v, e);
			}
		}
	}
	return false;
}

/** Extend a dynamic tree.
 *  @param u is a root of some tree in the dynamic trees data structure
 *  @param e is an edge incident to u with positive residual capacity from u,
 *  through which tree is extended by linking it to the other endpoint of e,
 *  while setting cost(u) to the residual capacity of e.
 */
function extend(u, e) {
	let [,c] = trees.findcost(u);  // this is just the cost of u
	trees.addcost(u, g.res(e,u) - c);
	trees.graft(u, g.mate(u,e));
	upEdge[u] = e;
}

/** Prune a subtree in dynamic trees data structure.
 *  @param u is a vertex to be cut from its parent; residual flow in cost(u)
 *  is transferred to flow graph, and cost(u) becomes huge
 */
function prune(u) {
	let e = upEdge[u];
	trees.prune(u); upEdge[u] = 0;
	let [,ucost] = trees.findcost(u);
	g.flow(e, (u == g.tail(e) ? g.cap(e) - ucost : ucost));
	trees.addcost(u, huge - ucost);
}

/** Add flow to the source-sink path defined by the path in the
 *  dynamic trees data structure
 *  @return the amount of flow added to the path
 */
function augment(trace) {
	let ts = ''; let path;
	if (trace) {
		let p = trees.findpath(g.source); let s = '';
		for (let u = trees.first(p); u; u = trees.next(u)) {
			if (s) s += ' ';
			s += g.x2s(u);
			if (trees.next(u)) s += ':' + trees.cost(u);
		}
		ts += s;
	}

	// effectively saturate source/sink path by adjusting costs
	let [u,rcap] = trees.findcost(g.source);
	trees.addcost(g.source, -rcap);

	// now, remove tree edges with zero residual capacity
	// and saturate corresponding flow graph edges
	let c; [u,c] = trees.findcost(g.source);
	while (c == 0) {
		steps++;
		let e = upEdge[u]; 
		if (e) { prune(u); nextEdge[u] = g.nextAt(u, e); }
		[u,c] = trees.findcost(g.source);
	}
	return [rcap, ts];
}

/** Prepare for next phase of Dinic's algorithm.
 *  @return true if there is still residual capacity from source to sink,
 *  else false
 */
function newphase() {
	for (let u = 1; u <= g.n; u++) {
		level[u] = g.n; nextEdge[u] = g.firstAt(u);
		if (upEdge[u] != 0) prune(u);  // cleanup from last phase
		steps++;
	}
	let q = new List(g.n);
	q.enq(g.source); level[g.source] = 0;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e; e = g.nextAt(u, e)) {
			let v = g.mate(u, e);
			if (g.res(e, u) > 0 && level[v] == g.n) {
				level[v] = level[u] + 1;
				if (v == g.sink) return true;
				q.enq(v);
			}
			steps++;
		}
	}
	return false;
}
