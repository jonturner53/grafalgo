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
import dcsGT from '../../graphAlgorithms/vmatch/dcsGT.mjs';

let g;
let pi;          // permutation on 1..n that defines cycles in g
let rpi;         // reverse of permutation pi
let clist;       // List of the current valid cycle ids
let clen;        // clen[u] is length of cycle identified by u
let link;        // link[u][v] is edge number of connecting edge or 0

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
 *  if no path/cycle is found, null is returned in place of path
 */
export default function hpcKT(G, s=0, t=0, traceFlag=0) {
	g = G; 
	ea && assert(s >= 0 && s <= g.n && t >= 0 && t <= g.n);
	if (s == 0) t = 0;

	trace = traceFlag; traceString = '';
	if (trace == 1) traceString += `graph: ${G.toString(1)}\n`;

	if (s) {
		// for hamiltonian paths, reduce to hamiltonian cycle problem
		if (t) {
			g = new Graph(G.n+1,G.edgeRange+2); g.assign(G,1);
			let x = G.n+1; g.join(x,s); g.join(t,x);
			// G has an s-t HP if and only if g has a HC
		} else {
			g = new Graph(G.n+2,G.edgeRange+G.n+1); g.assign(G,1);
			let x = G.n+1; let y = G.n+2;
			g.join(x,s); g.join(x,y);
			for (let u = 1; u <= G.n; u++) {
				if (u != s) g.join(u,y);
			}
			// G has a HP starting at s if and only if g has a HC
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

	let path = new Int32Array(G.n);

	if (!initialCycles())
		return [null, traceString, {'cycles': 0, 'length': 0}];

	let splices = 0;
	while (clist.length > 1) {
		if (trace == 1) traceString +=  traceCycles() + '\n';
		else if (trace) traceString += cycleLengths() + '\n';
		let cp = compatiblePair();
		if (!cp) return [null, traceString, {'cycles': 0, 'length': 0}];
		let [c1,c2,u,v] = cp;
		splice(u,v); clen[c1] += clen[c2]; clist.delete(c2);
		splices++;
	}

	// identify longest cycle
	let lc = clist.first();
	for (let u = clist.next(lc); u; u = clist.next(u))
		if (clen[u] > clen[lc]) lc = u;

	// create array of edges in path/cycle, skipping added edges
	let v0 = (s ? s : lc); let v = v0; let i = 0; let len = 0;
	do {
		let e = link[v][pi[v]];
		if (G.validEdge(e)) { path[i++] = e; len++; }
		v = pi[v];
	} while(v != v0);

	// reverse path in special case of HP where nextEdge[s] (in g) is not in G
	if (s && g.left(path[0]) != s && g.right(path[0]) != s && path[G.n-2]) {
		// special case requiring path reversal
		for (let i = 0; i < (G.n-2)-i; i++) 
			[path[i],path[(G.n-2)-i]] = [path[(G.n-2)-i],path[i]]
	}

	if (trace == 1) {
		traceString += `\nfinal ${s ? 'path' : 'cycle'}: ` +
					   `${G.elist2string(path,0,0,1)} ${len}\n`;
	} else if (trace) {
		traceString += cycleLengths() + '\n';
	}
	
	return [path, traceString, {'cycles': clist.length, 'length': len,
								'splices': splices}];
}

/** Find an initial set of cycles by finding a degree constrained subgraph
 *  with exactly two edges at each vertex.
 */
function initialCycles() {
	let hi = new Int32Array(g.n+1); hi.fill(2,1);
	let [sub] = dcsGT(g,hi);
	if (sub.m != g.n) return false;

	pi.fill(0); rpi.fill(0);
	while (sub.m) {
		let e = sub.first();
		let u = g.left(e); let v = u;
		do {
			pi[v] = g.mate(v,e); rpi[g.mate(v,e)] = v;
			sub.delete(e); clen[u]++;
			v = pi[v]; e = sub.firstAt(v);
		} while (v != u);
		clist.enq(u);
	}
	return true;
}

/** Search for a compatible pair in clist.
 *  @return a tuple [c1,c2,u,v] on success, or null on failure;
 *  c1 and c2 are a pair of compatible cycles; u and v are vertices
 *  at which the cycles can be spliced.
 */
function compatiblePair() {
	for (let c1 = clist.first(); c1; c1 = clist.next(c1)) {
		for (let c2 = clist.next(c1); c2; c2 = clist.next(c2)) {
			let pair = compatible(c1,c2);
			if (pair) {
				let [u,v] = pair;
				return [c1,c2,u,v];
			}
		}
	}
	return null;
}

/** Determine if two cycles are compatible.
 *  @param c1 is a cycle
 *  @param c2 is a different cycle
 *  @return a vertex pair [x,y], one from each cycle that can be
 *  used to splice the cycles together; or null on failure
 */
function compatible(c1,c2) {
	let u = c1;
	do {
		let v = c2;
		do {
			if ((link[u][pi[v]] || link[u][rpi[v]]) &&
				(link[v][pi[u]] || link[v][rpi[u]]))
				return [u,v];
			v = pi[v];
		} while (v != c2);
		u = pi[u];
	} while (u != c1);

	return null;
}

/** Splice two cycles at a specified pair of vertices.
 *  @param u is a vertex in a cycle
 *  @param v is a vertex in a different cycle
 */
function splice(u,v) {
	if (!link[u][pi[v]]) reverseCycle(v);
	if (!link[v][pi[u]]) reverseCycle(u);
	let  pu =  pi[u]; let  pv =  pi[v];
	[pi[u], pi[v], rpi[pv], rpi[pu]] = [pv, pu, u, v];
}

/** Reverse a cycle.
 *  @paren u is a vertex on some cycle.
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
