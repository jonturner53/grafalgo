/** @file matchEG.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ReverseLists from '../../dataStructures/basic/ReverseLists.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';
import findSplit from '../misc/findSplit.mjs';
import Matching from './Matching.mjs';

let g;            // shared copy of graph
let match;        // match is a Matching object
let link;         // link[u] is parent edge of u in matching forest
let q;            // q is list of edges to be processed
let outer;        // MergeSets object partitioning graph into blossoms
let apath;        // ReverseLists object used to build augmenting paths
let base;         // base[b] is the base of an outermost blossom b
let bridge;       // bridge[x] is pair [e,u] where e is bridge in x's blossom
                  // and u is the endpoint of e that is a descendant of x
let state;        // state[u] is 0 if u is unreached, +1 if even, -1 if odd
let mark;         // mark[u] is a flag used when computing nca

let trace;
let traceString;

let paths;       // number of paths found
let bcount;      // number of blossoms formed
let steps;       // total number of steps

/** Compute a maximum matching in a graph using the Gabow's version of
 *  Edmond's algorithm.
 *  @param g is an undirected graph
 *  @param traceFlag causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching object,
 *  ts is a possibly empty trace string and stats is a statistics object.
 */
export default function matchEG(mg, traceFlag=false) {
	g = mg;
	match = new Matching(g); // match is returned
	link = new Int32Array(g.n+1);
	q = new List(g.edgeRange);
	outer = new MergeSets(g.n);
	apath = new ReverseLists(g.edgeRange);
	base = new Int32Array(g.n+1);
	bridge = new Array(g.n);
	state = new Int8Array(g.n+1);
	mark = new Int8Array(g.n+1);

	trace = traceFlag; traceString = '';
	paths = bcount = 0; steps = g.n + g.edgeRange;

	// add edges to match, yielding maximal (not maximum) matching
	for (let u = 1; u <= g.n; u++) {
		if (match.at(u)) continue;
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			steps++;
			if (!match.at(g.mate(u,e))) { match.add(e); break; }
		}
	}

	if (trace)
		traceString += `${g.toString(1)}` +
					   `initial matching: ${match.toString()}\n`;

	newPhase();
	while (!q.empty()) {
		steps++;
		let e = q.deq(); let u = g.left(e); let U = bid(u);
		if (state[U] != +1) { u = g.right(e); U = bid(u); }
		let v = g.mate(u,e); let V = bid(v);
		if (U == V || state[V] < 0) continue;
			// skip edges internal to a blossom and edges to odd vertices

		if (state[V] == 0) {
			addBranch(u,e);
		} else {
			// U and V are both even
			let A = nca(U,V);
			if (A != 0) {
				addBlossom(e, A);
			} else {
				// U, V are in different trees - augment and start new phase
				let r1 = root(U); let r2 = root(V);
				let ee = apath.join(apath.reverse(path(u, r1)), e);
				augment(apath.join(ee, path(v, r2)));
				newPhase();
			}
		}
	}

	if (trace)
		traceString += `final matching: ${match.toString()}\n`;
		
	steps += outer.getStats().steps;
	link = q = outer = apath = base = bridge = state = mark = null;
    return [match, traceString,
			{'size': match.size(), 'paths': paths,
			 'blossoms': bcount, 'steps': steps }];
}

/** Prepare for a new phase */
function newPhase() {
	outer.clear(); q.clear(); link.fill(0); state.fill(0);
	for (let u = 1; u <= g.n; u++) {
		steps++;
		base[u] = u;
		if (!match.at(u)) {
			state[u] = 1; add2q(u);
		}
	}
}

/** Extend tree at an even vertex.
 *  @param u is an even matched vertex that is not in a blossom.
 *  @param e is an edge connecting u to an unreached vertex v
 */
function addBranch(u, e) {
	let v = g.mate(u,e);  state[v] = -1; link[v] = e;
	let ee = match.at(v);
	let w = g.mate(v,ee); state[w] = +1; link[w] = ee;
	add2q(w);
	if (trace)
		traceString += `branch: ${g.x2s(u)}--${g.x2s(v)}--${g.x2s(w)}\n`
	return;
}

/** Add edges incident to a new even vertex to q.
 *  @param u is a vertex that just became even
 */
function add2q(u) {
	for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
		if (!match.contains(e) && !q.contains(e)) q.enq(e);
		steps++;
	}
}

/** Add new blossom defined by edge.
 *  @param e is an edge joining two even vertices in same tree
 *  @param A is the nearest common ancestor of e's endpoints
 */
function addBlossom(e, A) {
	bcount++;
	let u = g.left(e);  let U = bid(u);
	let v = g.right(e); let V = bid(v);
	let x = U; let s = '';
	while (x != A) {
		if (trace) s = `${g.x2s(x)}${s ? ' ' : ''}` + s;
		base[outer.merge(outer.find(x), outer.find(A))] = A;
		x = g.mate(x,link[x]); // x now odd
		if (trace) s = `${g.x2s(x)} ` + s;
		base[outer.merge(x, outer.find(A))] = A;
		bridge[x] = [e,u];
		add2q(x);
		x = bid(g.mate(x,link[x]));
		steps++;
	}
	if (trace) s = `${g.x2s(A)}${s ? ' ' : ''}` + s;
	x = V;
	while (x != A) {
		if (trace) s += ` ${g.x2s(x)}`;
		base[outer.merge(outer.find(x), outer.find(A))] = A;
		x = g.mate(x,link[x]); // x now odd
		if (trace) s += ` ${g.x2s(x)}`;
		base[outer.merge(x,outer.find(A))] = A;
		bridge[x] = [e,v];
		add2q(x);
		x = bid(g.mate(x,link[x]));
		steps++;
	}
	if (trace)
		traceString += `blossom: ${g.e2s(e)} ${g.x2s(A)} [${s}]\n` +
					   `    ${outer.toString()}\n`;
}

/** Augment the matching.
 *  @param e is the first edge in the path.
 */
function augment(e) {
	if (trace) traceString += 'augment:';
	while (true) {
		steps++;
		if (trace) traceString += ' ' + g.e2s(e,0,1);
		match.add(e);
		if (apath.isLast(e)) break;
		e = apath.pop(e); match.drop(e);
		if (trace) traceString += ' ' + g.e2s(e,0,1);
		e = apath.pop(e);
		steps++;
	}
	if (trace)
		traceString += `\n    ${match.toString()}\n`;
}

/** Get identifier of outer blossom of a vertex.
 *  @param u is some vertex
 *  @return u's the identifier of the outer blossom containing u;
 *  specifically, the base of the outer blossom u (or u, if u is outer).
 */
function bid(u) {
    return base[outer.find(u)];
}

/** Find the root of a tree.
 *  @param rv is the id for a vertex in current graph
 *  @return the root of the tree containing rv
 */
function root(rv) {
	while (link[rv] != 0) {
		rv = bid(g.mate(rv,link[rv])); steps++;
	}
	return rv;
}

/** Find the nearest common ancestor of two vertices in
 *  the current "condensed graph".
 *  To avoid excessive search time, search upwards from both vertices in
 *  parallel, using mark bits to identify the nca. Before returning,
 *  clear the mark bits by traversing the paths a second time.
 *  @param u is an external vertex or the base of a blossom
 *  @param v is another external vertex or the base of a blossom
 *  @returns the nearest common ancestor of u and v or 0 if none
 */
function nca(u, v) {
	let result;

	// first pass to find the nca
	let x = u; let y = v;
	while (true) {
		if (x == y) { result = x; break; }
		if (mark[x]) { result = x; break; }
		if (mark[y]) { result = y; break; }
		if (link[x] == 0 && link[y] == 0) { result = 0; break; }
		if (link[x] != 0) {
			mark[x] = true;
			x = g.mate(x,link[x]);
			x = bid(g.mate(x,link[x]));
		}
		if (link[y] != 0) {
			mark[y] = true;
			y = g.mate(y,link[y]);
			y = bid(g.mate(y,link[y]));
		}
		steps++;
	}
	// second pass to clear mark bits
	x = u;
	while (mark[x]) {
		mark[x] = false; x = g.mate(x,link[x]); x = bid(g.mate(x,link[x]));
		steps++;
	}
	y = v;
	while (mark[y]) {
		mark[y] = false; y = g.mate(y,link[y]); y = bid(g.mate(y,link[y]));
		steps++;
	}
	return result;
}

/** Find path joining two vertices in the same tree.
 *  @param a is a matched vertex in some tree defined by parent
 *  pointers
 *  @param b is an ancestor of a
 *  @return the ab-path that starts with the matching edge incident to a;
 *  specifically, return the index of the id of the list of vertices in
 *  the path using the apath object
 */
function path(a, b) {
	steps++;
	if (a == b) return 0;
	if (state[a] > 0) { // a is even
		let e1 = link[a];  let pa = g.mate(a,e1);
		if (pa == b) return e1;
		let e2 = link[pa]; let p2a = g.mate(pa,e2);
		let e = apath.join(e1,e2);
		if (p2a == b) return e;
		return apath.join(e, path(p2a,b));
	} else {
		let [e,v] = bridge[a]; let w = g.mate(v,e);
		e = apath.join(apath.reverse(path(v,a)), e);
		e = apath.join(e, path(w, b));
		return e;
	}
}
