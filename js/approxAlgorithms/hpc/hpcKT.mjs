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
let cmap;        // MergeSet with set for each cycle; find(u) is cycle id
let clist;       // List of the current valid cycle ids
let clen;        // clen[u] is length of cycle identified by u
let link;        // link(u,v) is edge number of connecting edge or 0
let version;     // specifies version of algorithm

let trace;
let traceString;

/** Find a Hamiltonian path or cycle using Turner's adaptation of Karp's
 *  algorithm for TSP.
 *  @param g is a graph to be searched.
 *  @param version0 specifies which version of the algorithm to use;
 *  0 specifies simple version (using unweighted matchings), 1 specifies
 *  version with weighted matching, 2 is the same as 1 but with
 *  three point splices in addition to two point
 *  @param s is a starting vertex in the case of a hamiltonian path, else 0
 *  @param t is defined when s != 0 and is either a specific termination
 *  vertex or 0, in which case any termination vertex is acceptable
 *  @return a triple [path, ts, stats] where path is an array of edge numbers
 *  of length n; in a successful search for a cycle, all array entries are
 *  non-zero; in a successful search for a path, all but the last are non-zero;
 *  unsuccessful searches leave additional zero entries at the end of the array
 */
export default function hpcKT(g0, version0=2, s=0, t=0, traceFlag=0) {
	ea && assert(s >= 0 && s <= g.n && t >= 0 && t <= g.n);
	if (s == 0) t = 0;

	trace = traceFlag; traceString = '';
	if (trace) traceString += `graph: ${g0.toString(1)}\n`;

	g = g0; version = version0;
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
	cmap = new MergeSets(g.n);
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
	while (mergeCycles() && clist.length > 1) {}

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

	if (trace) {
		traceString += `\nfinal path: ${g.elist2string(path,0,0,1)}\n`;
	}
	
	return [path, traceString, {'cycles': clist.length, 'length': len}];
}

/** Construct initial collection of cycles.
 *  @return true if all vertices could be assigned to cycles.
 */
function initialCycles() {
	// construct bipartite matching graph with weights equal to the
	// "splice potential" and find max weight matching
	let mg = new Graph(2*g.n, 2*g.edgeRange+1);
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		let w = 0;
		for (let eu = g.firstAt(u); eu; eu = g.nextAt(u,eu)) {
			if (eu == e) continue;
			let nu = g.mate(u,eu);
			for (let ev = g.firstAt(v); ev; ev = g.nextAt(v,ev)) {
				if (ev == e) continue;
				let nv = g.mate(v,ev);
				if (nu != nv && link[nu][nv]) w++;
			}
		}
		mg.join(u,g.n+v,2*e);  mg.join(v,g.n+u,2*e+1);
		if (version) { mg.weight(2*e,w); mg.weight(2*e+1,w); }
	}
	let io = new ListPair(2*g.n);
	for (let i = 1; i <= g.n; i++) io.swap(i);
	let [match] = (version ? wbimatchH(mg,io) : bimatchHK(mg,io));
	if (match.size() != g.n) [match] = bimatchHK(mg,match,io);
	if (match.size() != g.n) return false;

	for (let u = 1; u <= g.n; u++) {
		if (pi[u]) continue;
		let v = u; let c;
		do {
			let e = ~~(match.at(v)/2);
			pi[v] = g.mate(v,e); rpi[g.mate(v,e)] = v;
			c = cmap.merge(cmap.find(u),cmap.find(v));
			clen[u]++; v = pi[v];
		} while (v != u);
		clist.enq(c);
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
	let mm = clist.length*(clist.length-1)/2;
	let mg = new Graph(g.n,mm);
	let emap = new Array(mm+1);
	for (let u = clist.first(); u; u = clist.next(u)) {
		for (let v = clist.next(u); v; v = clist.next(v)) {
			let [x,y,z] = compatible(u,v);
			if (!x) continue;
			let e = mg.join(u,v); emap[e] = [x,y,z];
			if (version) mg.weight(e,clen[u]*clen[v]);
			break;
		}
	}

	let [match] = (version ? wmatchE(mg) : matchEG(mg));
	if (match.size() == 0) return false;
	for (let e = match.first(); e; e = match.next(e)) {
		let [u,v] = [mg.left(e),mg.right(e)];
		let [uu,vv,ww] = emap[e];
		splice(uu,vv,ww);
		clen[u] += clen[v]; clist.delete(v);
		let c = cmap.merge(u,v);
		if (c != u) {
			clen[c] = clen[u]; clist.delete(u); clist.enq(c);
		}
	}

	return true;
}

/** Determine if two cycles are compatible.
 *  @param c1 is a cycle
 *  @param c2 is a different cycle
 *  @return true if the cycles can be spliced together;
 *  if version<2, only two point splices are considered,
 *  if version==2, three point splices are also considered;
 */
function compatible(c1,c2) {
	let x = c1;
	// comparison for two-point splice
	// if c1 and c2 contain vertices x and y, where x is adjacent to
	// one of y's chums and y is adjacent to one of x's chums,
	// then they can be spliced
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

	if (version < 2) return [0,0,0];

	// comparison for three-point splice
	// if c1 contains vertex x and c2 contains adjacent vertices y and z
	// where z is not a chum y, then c1 and c2 can be spliced if x is
	// adjacent to one of y's chum's and the matching chum of z
	// is adjacent to one of x's chums
	x = c1;
	do {
		let y = c2;
		do {
			for (let e = g.firstAt(y); e; e = g.nextAt(y,e)) {
				let z = g.mate(y,e);
				if (cmap.find(z) != c2 || pi[y] == z || pi[z] == y)
					continue;
				// {y,z} defines a chord in cycle c2
				if ((link[x][pi[y]] &&
						(link[pi[z]][pi[x]] || link[pi[z]][rpi[x]])) ||
					(link[x][rpi[y]] &&
						(link[rpi[z]][pi[x]] || link[rpi[z]][rpi[x]])))
					return [x,y,z];
			}
			y = pi[y];
		} while (y != c2);
		x = pi[x];
	} while (x != c1);

	return [0,0,0];
}

/** Splice two cycles at a specified pair of vertices.
 *  @param x is a vertex in a cycle
 *  @param v is a vertex in a different cycle
 */
function splice(x,y,z=0) {
	if (!z) {
		if (!link[x][pi[y]]) reverseCycle(y);
		if (!link[y][pi[x]]) reverseCycle(x);
		let  px =  pi[x]; let  py =  pi[y];
		[pi[x], pi[y], rpi[py], rpi[px]] = [py, px, x, y];
		return;
	}

	if (!(link[x][pi[y]] && (link[pi[z]][pi[x]] || link[pi[z]][rpi[x]])))
		reverseCycle(y);
	if (!link[pi[x]][pi[z]]) reverseCycle(x);

	reverseCycle(pi[z],y); 

	let px = pi[x]; let py = pi[y]; let pz = pi[z];

	pi[x] = py; rpi[py] = x;
	pi[z] = y; pi[y] = rpi[y]; rpi[y] = z;
	pi[pz] = px; rpi[px] = pz;
}

/** Reverse a cycle or a portion of the cycle.
 *  @paren u is a vertex.
 *  @paren z is a vertex on the same cycle as u; this function
 *  reverses the direction of the pi and rpi mappings at every
 *  vertex from u to z (but not including z).
 *  
function reverseCycle(u,z=u) {
	let v = u;
	do {
		let pv = pi[v]; let rpv = rpi[v];
		pi[v] = rpv; rpi[v] = pv; v = pv;
	} while (v != z);
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
