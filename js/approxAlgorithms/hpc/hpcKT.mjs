/** @file hpcKT.mjs
 * 
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import wbimatchH from '../../graphAlgorithms/match/wbimatchH.mjs';
import matchEG from '../../graphAlgorithms/match/matchEG.mjs';
import wmatchE from '../../graphAlgorithms/match/wmatchE.mjs';

let g;
let pi;          // permutation on 1..n that defines cycles in g
let rpi;         // reverse of permutation pi
let clist;       // List of the current valid cycle ids
let clen;        // clen[u] is length of cycle identified by u
let link;        // link(u,v) is edge number of connecting edge or 0

let trace;
let traceString;

/** Find a Hamiltonian path or cycle using Turner's adaptation of Karp's
 *  algorithm for TSP.
 *  @param g is a graph to be searched.
 *  @param s is a starting vertex in the case of a hamiltonian path, else 0
 *  @param t is defined when s != 0 and is either a specific termination
 *  vertex or 0, in which case any termination vertex is acceptable
 *  @return a triple [path, ts, stats] where path is an array of edge numbers
 *  of length n; in a successful search for a cycle, all array entries are
 *  non-zero; in a successful search for a path, all but the last are non-zero;
 *  unsuccessful searches leave additional zero entries at the end of the array
 */
export default function hpcKT(g0, s=0, t=0, traceFlag=0) {
	ea && assert(s >= 0 && s <= g.n && t >= 0 && t <= g.n);
	if (s == 0) t = 0;

	trace = traceFlag; traceString = '';
	if (trace == 1) traceString += `graph: ${g0.toString(1)}\n`;

	g = g0; 
	if (s) {
		// for hamiltonian paths, reduce to hamiltonian cycle problem
		if (t) {
			g = new Graph(g0.n+1,g0.edgeRange+2); g.assign(g0,1);
			let x = g0.n+1; g.join(x,s); g.join(t,x);
			// g0 has an s-t HP if and only if g has a HC
		} else {
			g = new Graph(g0.n+2,g0.edgeRange+g0.n+1); g.assign(g0,1);
			let x = g0.n+1; let y = g0.n+2;
			g.join(x,s); g.join(x,y);
			for (let u = 1; u <= g0.n; u++) {
				if (u != s) g.join(u,y);
			}
			// g0 has a HP starting at s if and only if g has a HC
		}
	}

	pi  = new Int32Array(g.n+1);
	rpi = new Int32Array(g.n+1);
	clist = new List(g.n);
	clen = new Int32Array(g.n+1);

	link = new Array(g.n+1);
	for (let u = 1; u <= g.n; u++)
		link[u] = new Int32Array(g.n+1);
	for (let e = g.first(); e; e = g.next(e)) {
		link[g.left(e)][g.right(e)] = e;
		link[g.right(e)][g.left(e)] = e;
	}

	let path = new Int32Array(g0.n);

	if (!initialCycles())
		return [path, traceString, {'cycles': 0, 'length': 0}];

	while (clist.length > 1 && mergeCycles()) {}

	// identify longest cycle
	let lc = clist.first();
	for (let u = clist.first(); u; u = clist.next(u))
		if (clen[u] > clen[lc]) lc = u;

	// create array of edges in path/cycle, skipping added edges
	let v0 = s ? s : lc; let v = v0; let i = 0; let len = 0;
	do {
		let e = link[v][pi[v]];
		if (g0.validEdge(e)) { path[i++] = e; len++; }
		v = pi[v];
	} while(v != v0);

	// reverse path in special case of HP where nextEdge[s] (in g) is not in g0
	if (s && g.left(path[0]) != s && g.right(path[0]) != s && path[g0.n-2]) {
		// special case requiring path reversal
		for (let i = 0; i < (g0.n-2)-i; i++) 
			[path[i],path[(g0.n-2)-i]] = [path[(g0.n-2)-i],path[i]]
	}

	if (trace == 1) {
		traceString += `\nfinal ${s ? 'path' : 'cycle'}: ` +
					   `${g0.elist2string(path,0,0,1)} ${len}\n`;
	}
	
	return [path, traceString, {'cycles': clist.length, 'length': len}];
}

function initialCycles() {
	// partition graph into cycles by finding a perfect matching on
	// a "matching graph"; the matching graph has a cluster for every
	// vertex and an edge joining each cluster for each original edge;
	// the inter-cluster edges have same edge number as the original edge

	// preliminaries
	let n = 0; let m = g.m;
	let d = new Int32Array(g.n+1);    // d[u]=degree(u)
	let base = new Int32Array(g.n+1); // base[u]=first vertex in u's cluster
	let b = 1;
	for (let u = 1; u <= g.n; u++) {
		d[u] = g.degree(u); if (d[u] < 2) return false;
		base[u] = b; let nu = 2*d[u]-2; b += nu;
		n += nu; m += d[u]*(d[u]-2);
	}

	let mg = new Graph(n, m >= g.edgeRange ? m : g.edgeRange);
	// define inter-custer edges
	let offset = new Int32Array(g.n+1);
		// offset[u] determines position of next edge in u's cluster
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		mg.join(base[u] + offset[u]++, base[v] + offset[v]++, e); 
	}
	// define intra-cluster edges
	for (let u = 1; u <= g.n; u++) {
		for (let i = 0; i < d[u]; i++) {
			for (let j = 0; j < d[u]-2; j++) {
				let me = mg.join(base[u]+i, base[u]+d[u]+j);
			}
		}
	}

	let [match] = matchEG(mg);
	if (match.size() != mg.n/2) return false;

	let cycleEdges = new List(g.edgeRange);
	for (let e = match.first(); e; e = match.next(e)) {
		if (g.validEdge(e)) cycleEdges.enq(e);
	}
	// every vertex is incident to two edges in cycleEdges

	pi.fill(0); rpi.fill(0);
	while (!cycleEdges.empty()) {
		let e = cycleEdges.first();
		let u = g.left(e);
		let v = u; let c;
		do {
			pi[v] = g.mate(v,e); rpi[g.mate(v,e)] = v;
			cycleEdges.delete(e);
			clen[u]++;
			v = pi[v];
			for (e = g.firstAt(v); e; e = g.nextAt(v,e))
				if (cycleEdges.contains(e)) break;
		} while (v != u);
		clist.enq(u);
	}
	return true;
}

/** Merge cycles in current set by solving a matching problem.
 *  @return true if at least one pair of cycles was matched
 */
function mergeCycles() {
	if (trace == 1) traceString += traceCycles() + '\n';
	else if (trace) traceString += cycleLengths() + '\n';
	ea && assert(!verifyPi(), traceString + verifyPi());

	let mg = new Graph(g.n, clist.length*(clist.length-1)/2);

	for (let u = clist.first(); u; u = clist.next(u)) {
		for (let v = clist.next(u); v; v = clist.next(v)) {
			if (!compatible(u,v)) continue;
			let e = mg.join(u,v);
			break;
		}
	}

	if (clist.length > mg.m+1) return false;
	let [match] = matchEG(mg);
	if (match.size() == 0) return false;

	for (let e = match.first(); e; e = match.next(e)) {
		let [u,v] = [mg.left(e),mg.right(e)];
		splice(compatible(u,v));
		clen[u] += clen[v]; clist.delete(v);
	}

	return true;
}

/** Determine if two cycles are compatible.
 *  @param c1 is a cycle
 *  @param c2 is a different cycle
 *  @return a vertex pair [x,y], one from each cycle that can be
 *  used to splice the cycles together; or null on failure
 */
function compatible(c1,c2) {
	let x = c1;
	do {
		let y = c2;
		do {
			if ((link[x][pi[y]] || link[x][rpi[y]]) &&
				(link[y][pi[x]] || link[y][rpi[x]]))
				return [x,y];
			y = pi[y];
		} while (y != c2);
		x = pi[x];
	} while (x != c1);

	return null;
}

/** Splice two cycles at a specified pair of vertices.
 *  @param x is a vertex in a cycle
 *  @param y is a vertex in a different cycle
 */
function splice([x,y]) {
	if (!link[x][pi[y]]) reverseCycle(y);
	if (!link[y][pi[x]]) reverseCycle(x);
	let  px =  pi[x]; let  py =  pi[y];
	[pi[x], pi[y], rpi[py], rpi[px]] = [py, px, x, y];
}

/** Reverse a cycle or a portion of the cycle.
 *  @paren u is a vertex.
 */  
function reverseCycle(u) {
	let v = u;
	do {
		let pv = pi[v]; let rpv = rpi[v];
		pi[v] = rpv; rpi[v] = pv; v = pv;
	} while (v != u);
}

/** Check consistency of pi and rpi arrays. */
function verifyPi() {
	for (let u = 1; u <= g.n; u++) {
		if (!link[u][pi[u]])
			return `no edge for cycle chums ${g.x2s(u)} and ${g.x2s(pi[u])}`;
		if (!link[u][rpi[u]])
			return `no edge for cycle chums ${g.x2s(u)} and ${g.x2s(rpi[u])}`;
		if (rpi[pi[u]] != u)
			return `rpi[pi[${g.x2s(u)}]] = ${g.x2s(rpi[pi[u]])} != ${g.x2s(u)}`;
	}
	return ''
}

/** Return a string representation of the current cycles. */
function traceCycles() {
	let s = '{';
	for (let u = clist.first(); u; u = clist.next(u)) {
		if (u != clist.first()) s += ' ';
		s += '[';
		let v = u;
		do {
			let e = link[v][pi[v]];
			if (v != u) s += ' ';
			s += g.x2s(v);
			v = pi[v];
		} while (v != u);
		if (pi[u] == rpi[u]) sp /= 2;
		s += ']';
	}
	s += '}';
	return s;
}

/** Return a string representation of the current cycle lengths. */
function cycleLengths() {
	let s = '';
	for (let u = clist.first(); u; u = clist.next(u))
		if (clen[u] > 2) s += clen[u] + ' ';
	return s;
}
