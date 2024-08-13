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
let  link;  // link[u] is edge to next vertex in u's cycle
let rlink;  // rlink[u] is edge to previous vertex
let  size	// size[u] is size of u's cycle

/** Find a traveling salesman tour, using Karp's algorithm.
 *  @param G is a weighted digraph.
 *  @return a triple [[u0,tour], ts, stats] where u0 is the first vertex
 *  of the tour and tour is an array of n edges; tour may require edges not
 *  explicitly represented in g; such edges are added to g where necessary
 */
export default function tspK(G, trace=0) {
	g = G;

	let traceString = '';
	if (trace) traceString += `graph: ${g.toString(1)}`;

	// determine edges that define cycles
	let mg = new Graph(2*g.n, g.edgeRange);
	for (let e = g.first(); e; e = g.next(e)) {
		mg.join(g.tail(e), g.n+g.head(e), e); mg.weight(e, g.weight(e));
	}
	let [match] = wperfectE(mg);

	// initialize working data structures
	csets = new MergeSets(g.n);    
	clist = new List(g.n);         
	link = new Int32Array(g.n+1); 
	rlink = new Int32Array(g.n+1); 
	size = new Int32Array(g.n+1).fill(1); 

	// build csets and get total weight of selected edges
	let cyclesLength = 0;
	for (let u = 1; u <= g.n; u++) {
		let e = match.at(u); let v = g.head(e);
		link[u] = rlink[v] = e; cyclesLength += g.length(e);
		let cu = csets.find(u); let cv = csets.find(v);
		if (cu != cv)
			size[csets.merge(cu,cv)] = size[cu] + size[cv];
	}
	let tourLength = cyclesLength;

	let bigc = 0;
	for (let u = 1; u <= g.n; u++) {
		let c = csets.find(u);
		if (!clist.contains(c)) clist.enq(c);
		if (bigc == 0 || size[c] > size[bigc]) bigc = c;
	}
	let cycleCount = clist.length;
	clist.delete(bigc);
	if (trace) traceString += '\ninitial cycles: ' + cycles2string(bigc) + '\n';

	if (clist.length > 0) {
		// use matching to identify best patching operations to perform
		mg = new Graph(2*g.n, g.edgeRange);
		if (trace) traceString += '\npotential patching edge sets\n';
		for (let c = clist.first(); c; c = clist.next(c)) {
			// find all ways to merge c with bigc
			let u = c;
			do {
				let uv = link[u]; let v = g.head(uv);
				for (let uy = g.firstOutof(u); uy; uy = g.nextOutof(u,uy)) {
					let y = g.head(uy);
					if (csets.find(y) != bigc) continue;
					let xy = rlink[y]; let x = g.tail(xy);
					let xv = g.findEdge(x,v);
					if (!xv) continue;
					if (trace) {
						traceString += `    ${g.e2s(uv,0,1)} ${g.e2s(uy,0,1)}` +
									   ` ${g.e2s(xy,0,1)} ${g.e2s(xv,0,1)}`;
					}
					mg.join(c, g.n+y, uy);
					mg.weight(uy, (g.length(uy) + g.length(xv)) -
								  (g.length(xy) + g.length(uv)));
					if (trace) traceString += ' ' + mg.weight(uy) + '\n';
				}
				u = g.head(uv);
			} while (u != c);
		}
		if (mg.m) {
			let [match2] = wperfectE(mg, Math.min(mg.m,clist.length));
		
			if (trace) traceString += '\nupdated cycle sets\n';
			for (let uy = match2.first(); uy; uy = match2.next(uy)) {
				let [u,y] = [g.tail(uy),g.head(uy)];
				let uv = link[u];  let v = g.head(uv);
				let xy = rlink[y]; let x = g.tail(xy);
				let xv = g.findEdge(x,v);
				link[u] = rlink[y] = uy; link[x] = rlink[v] = xv;
				tourLength += mg.weight(uy);
				let cu = csets.find(u);
				bigc = csets.merge(cu, bigc);
				clist.delete(cu);
				if (trace) traceString += '    ' + cycles2string(bigc) + '\n';
			}
		}

		// merge remaining smaller cycles into bigc
		while (clist.length > 0) {
			let [uy,xv,cost] = bestMerge(bigc);
			tourLength += cost;
			if (!uy) return null;
			let [u,y] = [g.tail(uy),g.head(uy)];
			let [x,v] = [g.tail(xv),g.head(xv)];
			link[u] = rlink[y] = uy; link[x] = rlink[v] = xv;
			let cu = csets.find(u);   // smaller cycle
			bigc = csets.merge(cu, bigc);
			clist.delete(cu);
			if (trace) traceString += '    ' + cycles2string(bigc) + '\n';
		}
	}

	// create vector of edges in tour
	let tour = new Int32Array(g.n); let i = 0;
	let u = bigc;
	do {
		let e = link[u]; tour[i++] = e; u = g.head(e);
	} while (u != bigc);
	
	if (trace) traceString += `\ntsp tour: ${g.x2s(bigc)}` +
					`${g.elist2string(tour,0,0,1)} ${tourLength}\n`;

	return [[bigc,tour], traceString,
			{'cycleCount': cycleCount, 'cyclesLength':cyclesLength,
			 'tourLength':tourLength}];
}

/** Find least cost merge of a smaller cycle into the largest.
 *  @param bigc is the largest cycle
 *  @return triple [uy,xv,cost] where uy and xv are "cross-edges" linking
 *  a small cycle containing edge uv and the large cycle which includes xy;
 *  cost is the cost of merging the cycles by replacing edges uv and xy
 *  with uy and xv.
 */
function bestMerge(bigc) {
	let bestCost = Infinity; let bestPair = [0,0];
	for (let c = clist.first(); c; c = clist.next(c)) {
		// look for best way to merge c with bigc
		let u = c;
		do {
			let uv = link[u]; let v = g.head(uv);
			for (let uy = g.firstOutof(u); uy; uy = g.nextOutof(u,uy)) {
				let y = g.head(uy);
				if (csets.find(y) != bigc) continue;
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

/** Create a string representation of the cycles.
 *  @param bigc is the largest cycle
 *  @return a string showing the edges in each cycle
 */
function cycles2string(bigc) {
	let s = ''; let len = 0;
	let c = bigc;
	do {
		if (c != bigc) s += ' ';
		s += g.x2s(c) + '[';
		let u = c;
		do {
			let e = link[u]; len += g.length(e);
			if (u != c) s += ' ';
			s += g.e2s(e,0,1);
			u = g.head(e);
		} while (u != c);
		s += ']';
		c = (c == bigc ? clist.first() : clist.next(c));
	} while (c);
	return s + ' ' + len;
}
