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
let blossoms;     // MergeSets object partitioning graph into blossoms
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
	blossoms = new MergeSets(g.n);
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

	let e = findpath();
	while (e) {
		augment(e); e = findpath(); paths++;
	}

	if (trace)
		traceString += `final matching: ${match.toString()}\n`;
		
	steps += blossoms.getStats().steps;
	link = q = blossoms = apath = base = bridge = state = mark = null;
    return [match, traceString,
			{'size': match.size(), 'paths': paths,
			 'blossoms': bcount, 'steps': steps }];
}

/** Search for an augmenting path.
 *  @return an unmatched edge on the augmenting path or 0 if
 *  no augmenting path is found; on success, the list in the apath data
 *  structure that includes the returned edge defines the augmenting path.
 */
function findpath() {
	blossoms.clear(); q.clear(); link.fill(0); state.fill(0);
	for (let u = 1; u <= g.n; u++) {
		steps++;
		base[u] = u;
		if (!match.at(u)) {
			state[u] = 1; // u is an even vertex
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				if (!q.contains(e)) q.enq(e);
				steps++;
			}
		}
	}

	while (!q.empty()) {
		steps++;
		let e = q.deq(); let u = g.left(e); let ru = rep(u);
		if (state[ru] != +1) { u = g.right(e); ru = rep(u); }
		let v = g.mate(u,e); let rv = rep(v);
		if (ru == rv || state[rv] < 0) continue;
			// skip edges internal to a blossom and edges to odd vertices
		if (state[rv] == 0) { addBranch(u,e); continue; }
		// ru and rv are both even
		let a = nca(ru,rv);
		if (a != 0) { addBlossom(e, a); continue; }
		// ru, rv are in different trees - construct path & return
		let ur = root(ru); let vr = root(rv);
		let ee = apath.join(apath.reverse(path(u, ur)), e);
		return apath.join(ee, path(v, vr));
	}
	return 0;
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
		traceString += `add branch: ${g.x2s(u)} ${g.e2s(e)} ${g.e2s(ee)}\n`
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
 *  @param a is the nearest common ancestor of e's endpoints
 */
function addBlossom(e, a) {
	bcount++;
	let u = g.left(e);  let ru = rep(u);
	let v = g.right(e); let rv = rep(v);
	let x = ru;
	while (x != a) {
		base[blossoms.merge(blossoms.find(x), blossoms.find(a))] = a;
		x = g.mate(x,link[x]); // x now odd
		base[blossoms.merge(x, blossoms.find(a))] = a;
		bridge[x] = [e,u];
		add2q(x);
		x = rep(g.mate(x,link[x]));
		steps++;
	}
	x = rv;
	while (x != a) {
		base[blossoms.merge(blossoms.find(x), blossoms.find(a))] = a;
		x = g.mate(x,link[x]); // x now odd
		base[blossoms.merge(x,blossoms.find(a))] = a;
		bridge[x] = [e,v];
		add2q(x);
		x = rep(g.mate(x,link[x]));
		steps++;
	}
	if (trace)
		traceString += `add blossom: ${g.e2s(e)} ${g.x2s(a)} ${blossoms.toString()}\n`;
}

/** Augment the matching.
 *  @param e is the first edge in the path.
 */
function augment(e) {
	if (trace) traceString += 'augment:';
	while (true) {
		steps++;
		if (trace) traceString += ' ' + g.e2s(e);
		match.add(e);
		if (apath.isLast(e)) break;
		e = apath.pop(e); match.drop(e);
		if (trace) traceString += ' ' + g.e2s(e);
		e = apath.pop(e);
		steps++;
	}
	if (trace)
		traceString += `\n         ${match.toString()}\n`;
}

/** Get the representative of a vertex in current graph.
 *  @param u is some vertex
 *  @return u's representative in the current graph; specifically,
 *  the base of the blossom containing u (or u, if u is external).
 */
function rep(u) {
    return base[blossoms.find(u)];
}

/** Find the root of a tree.
 *  @param rv is the representative for a vertex in current graph
 *  @return the root of the tree containing rv
 */
function root(rv) {
	while (link[rv] != 0) {
		rv = rep(g.mate(rv,link[rv])); steps++;
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
			x = rep(g.mate(x,link[x]));
		}
		if (link[y] != 0) {
			mark[y] = true;
			y = g.mate(y,link[y]);
			y = rep(g.mate(y,link[y]));
		}
		steps++;
	}
	// second pass to clear mark bits
	x = u;
	while (mark[x]) {
		mark[x] = false; x = g.mate(x,link[x]); x = rep(g.mate(x,link[x]));
		steps++;
	}
	y = v;
	while (mark[y]) {
		mark[y] = false; y = g.mate(y,link[y]); y = rep(g.mate(y,link[y]));
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
