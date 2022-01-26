/** @file maxflowDST.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import DynamicTrees from '../../dataStructures/misc/DynamicTrees.mjs';

let g;			// shared reference to flow graph
let level;		// level[u] is distance from source to u in residual graph
let nextEdge;	// nextEdge[u] is the next edge to be processed at u

let trees;		// dynamic trees data structure
let upEdge;		// upEdge[u] is edge in g that links u to its tree parent
let huge;		// large value used for initial cost of tree roots

let findpathCount; // number of calls to findpath
let findpathSteps; // total steps in findpath
let phaseCount;	   // number of phases

/** Compute a maximum flow in a graph using Dinic's algorithm with
 *  Sleator & Tarjan dynmic trees data structure.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowDST(fg, trace=false) {
	g = fg;
	nextEdge = new Array(g.n+1).fill(0);
	level = new Array(g.n+1).fill(0);
	trees = new DynamicTrees(g.n);
	upEdge = new Array(g.n+1).fill(0);

	huge = 1;
	for (let e = g.first(); e != 0; e = g.next(e))
		huge += g.cap(e, g.tail(e));
	for (let u = 1; u <= g.n; u++)
		trees.addcost(u, huge);

	let ts = '';
	if (trace) ts += 'augmenting paths with residual capacities\n';

	findpathCount = findpathSteps = phaseCount = 0;
	while (newphase()) {
		phaseCount++;
		while (findpath(g.source)) {
			findpathCount++;
			let [,s] = augment(trace);
			if (trace) ts += s + '\n';
		}
		endphase();
	}
	let treeStats = trees.getStats();
	findpathSteps += treeStats.spliceCount + treeStats.splaySteps;
	return [g.totalFlow(), ts,
					{'findpathCount': findpathCount,
					 'findpathSteps': findpathSteps,
					 'phaseCount': phaseCount} ];
}

/** Prepare for next phase of Dinic's algorithm.
 *  @return true if there is still residual capacity from source to sink,
 *  else false
 */
function newphase() {
	for (let u = 1; u <= g.n; u++) {
		level[u] = g.n; nextEdge[u] = g.firstAt(u);
	}
	let q = new List(g.n);
	q.enq(g.source); level[g.source] = 0;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e)) {
			let v = g.mate(u, e);
			if (g.res(e, u) > 0 && level[v] == g.n) {
				level[v] = level[u] + 1;
				if (v == g.sink) return true;
				q.enq(v);
			}
		}
	}
	return false;
}

/** Cleanup at the end of a phase of Dinic's algorithm.
 *  This involves transferring flow from remaining tree edges back
 *  into flow graph and removing treee edges.
 */
function endphase() {
	for (let u = 1; u <= g.n; u++) {
		let e = upEdge[u];
		if (e != 0) {
			trees.cut(u); let [,residual] = trees.findcost(u);
			//g.addFlow(e, u, (g.cap(e,u) - residual) - g.f(e,u));
			g.setFlow(e, u == g.tail(e) ? g.cap(e,u) - residual : residual);
			trees.addcost(u, huge - residual);
			upEdge[u] = 0;
		}
	}
}

/** Find an augmenting path from specified vertex to sink in residual graph.
 *  @param u is a vertex
 *  @return true if there is an augmenting path from u to the sink
 */
function findpath(u) {
	while (nextEdge[g.source] != 0) {
		let u = trees.findroot(g.source); let e = nextEdge[u];
		while (true) { // look for forward path
			findpathSteps++; 
			if (u == g.sink) return true;
			if (e == 0) { nextEdge[u] = 0; break; }
			let v = g.mate(u,e);
			if (g.res(e,u) > 0 && level[v]==level[u] + 1 && nextEdge[v] != 0) {
				let [,c] = trees.findcost(u);
				trees.addcost(u, g.res(e,u) - c);
				trees.link(u,v); upEdge[u] = e;
				nextEdge[u] = e;
				u = trees.findroot(g.source); e = nextEdge[u];
			} else {
				e = g.nextAt(u,e);
			}
		}
		// prune dead-end
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			findpathSteps++;
			let v = g.mate(u,e);
			if (e != upEdge[v]) continue;
			trees.cut(v); upEdge[v] = 0;
			let [,residual] = trees.findcost(v);
			//g.addFlow(e, v, (g.cap(e,v) - c) - g.f(e,v));
			g.setFlow(e, (v == g.tail(e) ? g.cap(e) - residual : residual));
			trees.addcost(v, huge - residual);
		}
	}
	return false;
}

/** Add flow to the source-sink path defined by the path in the
 *  dynamic trees data structure
 *  @return the amount of flow added to the path
 */
function augment(trace) {
	// effectively saturate source/sink path by adjusting costs
	let [u,flow] = trees.findcost(g.source);

	let ts = '';
	if (trace) {
		let ps = trees.treepath2string(g.source);
		ts += ps.slice(1, ps.search(/:[^:]+\]/));
	}

	trees.addcost(g.source, -flow);

	// now, remove tree edges with zero residual capacity
	// and saturate corresponding flow graph edges
	let f; [u,f] = trees.findcost(g.source);
	while (f == 0) {
		let e = upEdge[u];
		g.setFlow(e, u == g.tail(e) ? g.cap(e) : 0);

		trees.cut(u); upEdge[u] = 0; trees.addcost(u, huge);
		[u,f] = trees.findcost(g.source);
	}
	return [flow, ts];
}
