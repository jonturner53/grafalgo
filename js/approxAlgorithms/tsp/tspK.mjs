/** @file tspC.mjs
 * 
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import mstP from '../../graphAlgorithms/mst/mstP.mjs';
import allpairsF from '../../graphAlgorithms/spath/allpairsF.mjs';
import wperfectE from '../../graphAlgorithms/vmatch/wperfectE.mjs';

let g;      // shared reference to tsp graph
let csets;  // MergeSets of vertices in cycles
let clist;  // List of cycles
let link;   // link[u] is edge to next vertex in u's cycle
let rlink;  // rlink[u] is edge to previous vertex
let size;	// size[u] is size of u's cycle
let C;      // vertex that identifies the cycle with the most edges

let trace;
let traceString;

/** Find a traveling salesman tour, using Karp's algorithm.
 *  @param G is a weighted digraph.
 *  @return a triple [[u0,tour], ts, stats] where u0 is the first vertex
 *  of the tour and tour is an array of n edges; tour may require edges not
 *  explicitly represented in g; such edges are added to g where necessary
 */
export default function tspK(G, traceFlag=0) {
	g = G; trace = traceFlag; traceString = '';

	if (trace) traceString += `graph: ${g.toString(1)}`;

	let cyclesLength = initialCycles();
	let cycleStats = [size[C],clist.length,cyclesLength];
	clist.delete(C);
	if (trace) traceString += '\ninitial cycles: ' + cycles2string(C) + '\n';

	if (clist.length > 0) cyclesLength = merge1(cyclesLength);
	if (clist.length > 0) cyclesLength = merge2(cyclesLength);
	if (clist.length > 0) cyclesLength = merge3(cyclesLength);
	ea && assert(clist.length == 0);

	// create vector of edges in tour
	let tour = new Int32Array(g.n); let i = 0; let u = C;
	do { let e = link[u]; tour[i++] = e; u = g.head(e); } while (u != C);
	
	if (trace) traceString += `\ntsp tour: ${g.x2s(C)}` +
					`${g.elist2string(tour,0,0,1)} ${cyclesLength}\n`;

	return [[C,tour], traceString,
			{'cycleStats': cycleStats, 'tourLength':cyclesLength}];
}

/** Use match to construct initial set of cycles.
 *  @return pair [len,C] where len is the total length of the initial
 *  set of cycles and C is the id of the initial cycle with the most edges.
 */
function initialCycles() {
	// determine edges that define cycles
	let mg = new Graph(2*g.n, g.edgeRange);
	for (let e = g.first(); e; e = g.next(e)) {
		mg.join(g.tail(e), g.n+g.head(e), e); mg.weight(e, g.weight(e));
	}
	let [match] = wperfectE(mg);

	// initialize data structures used to represent cycles
	csets = new MergeSets(g.n);    
	clist = new List(g.n);         
	link = new Int32Array(g.n+1); 
	rlink = new Int32Array(g.n+1); 
	size = new Int32Array(g.n+1).fill(1); 

	// build csets and get total weight of selected edges
	let totalLength = 0;
	for (let u = 1; u <= g.n; u++) {
		let e = match.at(u); let v = g.head(e);
		link[u] = rlink[v] = e; totalLength += g.length(e);
		let cu = csets.find(u); let cv = csets.find(v);
		if (cu != cv)
			size[csets.merge(cu,cv)] = size[cu] + size[cv];
	}

	// identify largest cycle
	C = 0; 
	for (let u = 1; u <= g.n; u++) {
		let c = csets.find(u);
		if (!clist.contains(c)) clist.enq(c);
		if (C == 0 || size[c] > size[C]) C = c;
	}
	return totalLength;
}

/** Use matching to merge smaller cycles with largest.
 *  @param cyclesLength is total length of current set of cycles
 *  @param cyclesLength is updated length of cycles
 */
function merge1(cyclesLength) {
	// use matching to identify best patching operations to perform
	let mg = new Graph(2*g.n, g.edgeRange);
	if (trace) traceString += '\npotential patching edge sets\n';
	for (let c = clist.first(); c; c = clist.next(c)) {
		// find all ways to merge c with C
		let u = c;
		do {
			let uv = link[u]; let v = g.head(uv);
			for (let uy = g.firstOutof(u); uy; uy = g.nextOutof(u,uy)) {
				let y = g.head(uy);
				if (csets.find(y) != C) continue;
				let xy = rlink[y]; let x = g.tail(xy);
				let xv = g.findEdge(x,v);
				if (!xv) continue;
				if (trace) {
					traceString += `    ${g.e2s(uv,0,1)} ${g.e2s(xy,0,1)}` +
								   ` ${g.e2s(uy,0,1)} ${g.e2s(xv,0,1)}`;
				}
				mg.join(c, g.n+y, uy);
					// number in g of the cross-edge uy is used to identify 
					// specific patching operation (along with cycle info)
				mg.weight(uy, (g.length(uy) + g.length(xv)) -
							  (g.length(xy) + g.length(uv)));
				if (trace) traceString += ' ' + mg.weight(uy) + '\n';
			}
			u = v;
		} while (u != c);
	}
	if (!mg.m) return cyclesLength;

	let [match] = wperfectE(mg, Math.min(mg.m,clist.length));

	if (trace) traceString += '\nupdated cycle sets\n';
	for (let uy = match.first(); uy; uy = match.next(uy)) {
		let [u,y] = [g.tail(uy),g.head(uy)];
		let uv = link[u];  let v = g.head(uv);
		let xy = rlink[y]; let x = g.tail(xy);
		let xv = g.findEdge(x,v);
		link[u] = rlink[y] = uy; link[x] = rlink[v] = xv;
		cyclesLength += mg.weight(uy);
		let cu = csets.find(u);
		C = csets.merge(cu, C);
		clist.delete(cu);
		if (trace) traceString += '    ' + cycles2string(C) + '\n';
	}
	return cyclesLength;
}

/** Attempt to merge any remaining smaller cycles into C.
 *  @param cyclesLength is total length of current collection of cycles
 *  @return updated length of cycles
 */
function merge2(cyclesLength) {
	// merge remaining smaller cycles into C
	while (clist.length > 0) {
		let [uy,xv,cost] = bestMerge(C);
		cyclesLength += cost;
		if (!uy) return cyclesLength;
		let [u,y] = [g.tail(uy),g.head(uy)];
		let [x,v] = [g.tail(xv),g.head(xv)];
		link[u] = rlink[y] = uy; link[x] = rlink[v] = xv;
		let cu = csets.find(u);   // smaller cycle
		C = csets.merge(cu, C);
		clist.delete(cu);
		if (trace) traceString += '    ' + cycles2string(C) + '\n';
	}
	return cyclesLength;
}

/** Find least cost merge of a smaller cycle into the largest.
 *  @param C is the largest cycle
 *  @return triple [uy,xv,cost] where uy and xv are "cross-edges" linking
 *  a small cycle containing edge uv and the large cycle which includes xy;
 *  cost is the cost of merging the cycles by replacing edges uv and xy
 *  with uy and xv.
 */
function bestMerge() {
	let bestCost = Infinity; let bestPair = [0,0];
	for (let c = clist.first(); c; c = clist.next(c)) {
		// look for best way to merge c with C
		let u = c;
		do {
			let uv = link[u]; let v = g.head(uv);
			for (let uy = g.firstOutof(u); uy; uy = g.nextOutof(u,uy)) {
				let y = g.head(uy);
				if (csets.find(y) != C) continue;
				let xy = rlink[y]; let x = g.tail(xy);
				let xv = g.findEdge(x,v);
				if (!xv) continue;
				let cost = (g.length(uy) + g.length(xv)) -
						   (g.length(xy) + g.length(uv));
				if (cost < bestCost) {
					bestCost = cost; bestPair = [uy,xv];
				}
			}
		} while (u != c);
	}
	let [uy,xv] = bestPair;
	return [uy,xv,bestCost];
}

/** Complete a tour by adding infinite length cross edges.
 *  @param cyclesLength is total length of current collection of cycles
 *  @return updated length of cycles (infinity)
 */
function merge3(cyclesLength) {
	while (clist.length > 0) {
		let c = clist.deq();
		let uv = link[c]; let [u,v] = [g.tail(uv),g.head(uv)];
		let xy = link[C]; let [x,y] = [g.tail(xy),g.head(xy)];
		let uy = g.findEdge(u,y);
		if (!uy) { uy = g.join(u,y); g.length(uy,Infinity); }
		let xv = g.findEdge(x,v);
		if (!xv) { xv = g.join(x,v); g.length(xv,Infinity); }
		link[u] = rlink[y] = uy; link[x] = rlink[v] = xv;
	}
	return Infinity;
}

/** Create a string representation of the cycles.
 *  @param C is the largest cycle
 *  @return a string showing the edges in each cycle
 */
function cycles2string() {
	let s = ''; let len = 0;
	let c = C;
	do {
		if (c != C) s += ' ';
		s += g.x2s(c) + '[';
		let u = c;
		do {
			let e = link[u]; len += g.length(e);
			if (u != c) s += ' ';
			s += g.e2s(e,0,1);
			u = g.head(e);
		} while (u != c);
		s += ']';
		c = (c == C ? clist.first() : clist.next(c));
	} while (c);
	return s + ' ' + len;
}
