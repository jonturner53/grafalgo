/** @file wbimatchH.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Matching from './Matching.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import findSplit from '../misc/findSplit.mjs';

let g;            // shared copy of graph
let weight;       // copy of edge weights
let match;        // match is a Matching object
let lab;          // lab[u] is vertex label at u
let link;         // link[u] is edge to parent of u in shortest path forest
let free;         // list containing free vertices in first subset
let border;       // heap containing border in forest
let cost;         // cost[u]=cost of shortest path to u in forest

let trace;
let traceString;

let paths;       // number of paths found
let steps;       // total number of steps

/** Compute a maximum weighted matching in a bipartite graph using the
 *  Hungarian algorithm.
 *  @param g is an undirected bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is an array
 *  mapping a vertex u to its matched edge match[u];
 *  ts is a possibly empty trace string and stats is a statistics object
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function wbimatchH(bg, io=0, traceFlag=0) {
	g = bg; match = new Matching(g);

	// adjust weights to avoid numerical issues arising from
	// small differences
	weight = new Float32Array(g.edgeRange+1);
	for (let e = g.first(); e; e = g.next(e)) {
		weight[e] = g.weight(e);
		if (Math.abs(weight[e]) < 1) {
			let scale = 2**20;
			weight[e] = Math.floor(weight[e]*scale) / scale;
		}
	}

	link = new Int32Array(g.n+1);
	lab = new Float32Array(g.n+1);
	free = new List(g.n); free.hasReverse = true
	border = new ArrayHeap(g.n,4);
	cost = new Float32Array(g.n+1);

	trace = traceFlag; traceString = '';
	paths = steps = 0;

	// divide vertices into two independent sets
	if (!io) { io = findSplit(g); steps += g.m; }
	if (!io) return [];

	if (trace) {
		traceString += `${g.toString(1)}augmenting path, path weight\n`;
	}

	// add unmatched vertices from first subset to free
	for (let u = io.first(1); u; u = io.next(u)) {
		if (g.firstAt(u)) free.enq(u);
		steps++;
	}

	// initialize vertex labels
	initLabels(io);

	// augment the matching until no augmenting path remains
	let u = findpath();
	while (u != 0) {
		augment(u); u = findpath(); paths++;
	}
	if (trace) {
		traceString += 'matching: ' + match.toString() + '\n';
	}
	return [match, traceString, {'weight': match.weight(), 'paths': paths,
								 'steps': steps }];
}

/*
function checkLabels() {
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		if (match.contains(e)) {
			if (io.in(u,1)) [u,v] = [v,u];
			assert(weight[e] + (lab[u]-lab[v]) >= 0, 
				   ''+lab[u]+' '+lab[v]+' '+(weight[e] + (lab[u]-lab[v])));
		} else {
			if (io.in(u,2)) [u,v] = [v,u];
			assert(-weight[e] + (lab[u]-lab[v]) >= 0,
					''+weight[e]+' '+(-weight[e] + (lab[u]-lab[v])));
		}
	}
}
*/

/** Compute values for labels that give non-negative transformed costs.
 *  The labels are the least cost path distances from an imaginary
 *  vertex with a length 0 edge to every vertex in io's set1.
 *  Edges are treated as directed from set1 to set2.
 */
function initLabels(io) {
	lab.fill(0);
	for (let u = io.first(1); u; u = io.next(u)) {
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			let v = g.mate(u,e);
			if (lab[v] > lab[u] - weight[e]) {
				lab[v] = lab[u] - weight[e];
			}
			steps++;
		}
	}
}

/** Find a least cost augmenting path.
 *  Unmatched edges are "directed" from io's set1 to its set2.
 *  Matched edges are "directed" from set2 to set1.
 *  The cost of a path is the weight of its matched edges minus the
 *  weight of its unmatched edges.
 *  @returns the sink vertex of the path found, or 0 if no such path
 */
function findpath() {
	link.fill(0); cost.fill(Infinity); border.clear(); border.clearStats();
	for (let u = free.first(); u; u = free.next(u)) {
		cost[u] = 0; border.insert(u,0); steps++;
	}

	let bestSink = 0; let bestPathCost = Infinity;
	let maxcost = -Infinity;
	while (!border.empty()) {
		let u = border.deletemin(); // u is in set1
		maxcost = Math.max(maxcost, cost[u]);
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			steps++;
			if (e == match.at(u)) continue;
			let v = g.mate(u,e);
			if (cost[v] > cost[u] + (-weight[e] + (lab[u]-lab[v]))) {
				link[v] = e;
				cost[v] = cost[u] + (-weight[e] + (lab[u]-lab[v]));
				let ee = match.at(v);
				if (ee == 0) {
					// select best sink based on "true path cost"
					if (cost[v] + lab[v] < bestPathCost) {
						bestSink = v; bestPathCost = cost[v] + lab[v] ;
					}
					continue;
				}
				let x = g.mate(v,ee);
				link[x] = ee;
				cost[x] = cost[v] + weight[ee] + (lab[v]-lab[x]);
				if (!border.contains(x)) border.insert(x,cost[x]);
				else border.changekey(x,cost[x]);
			}
		}
	}
	steps += border.getStats().steps;

	// update labels for next round
	for (let u = 1; u <= g.n; u++) {
		steps++;
		lab[u] += (cost[u] == Infinity ? maxcost : cost[u]);
	}

	if (bestSink == 0 || bestPathCost >= 0) return 0;

	return bestSink;
}

/** Flip the edges along an augmenting path
 *  @param[in] u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the link pointers
 */
function augment(u) {
	let e = link[u];
	let ts; if (trace) ts = g.x2s(u);
	while (e) {
		steps++;
		if (trace) ts = `${g.e2s(e)} ${ts}`
		match.add(e);  u = g.mate(u,e); e = link[u];
		if (!e) break;
		let ts; if (trace) ts = g.x2s(u);
		match.drop(e); u = g.mate(u,e); e = link[u];
	}
	free.delete(u);
	if (trace) {
		traceString += `${g.x2s(u)} ${ts} ${pathCost}\n`
	}
}
