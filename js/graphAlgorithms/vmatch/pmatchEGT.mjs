/** @file pmatchEGT.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import ReverseLists from '../../dataStructures/basic/ReverseLists.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';
import findSplit from '../misc/findSplit.mjs';
import Matching from '../match/Matching.mjs';

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

let pmax;         // largest vertex priority (assumed <= g.n)
let prio;         // prio[u] is priority of vertex u
let plists;       // ListSet with separate list per priority class
let first;        // first[k] is first vertex in priority k list
let roots;        // priority-ordered list of unmatched vertices

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
export default function pmatchEGT(G, Prio, traceFlag=false) {
	g = G; prio = Prio;

	match = new Matching(g);
	link = new Int32Array(g.n+1);
	q = new List(g.edgeRange);
	outer = new MergeSets(g.n);
	apath = new ReverseLists(g.edgeRange);
	base = new Int32Array(g.n+1);
	bridge = new Array(g.n);
	state = new Int8Array(g.n+1);
	mark = new Int8Array(g.n+1);

	plists = new ListSet(g.n);
	first = new Int32Array(g.n+1);
	roots = new List(g.n);

	trace = traceFlag; traceString = '';
	paths = bcount = 0; steps = g.n + g.edgeRange;

	// Create separate list for each priority class.
	pmax = 0;
	for (let u = 1; u <= g.n; u++) {
		first[prio[u]] = plists.join(first[prio[u]], u);
		pmax = Math.max(pmax, prio[u]);
	}
	steps += g.n;

	// First sort graph's endpoint lists by priority
	g.sortAllEplists((e1,e2,v) => prio[g.mate(v,e2)] - prio[g.mate(v,e1)]);

	// build initial matching with pretty good priority score
	// also build list of unmatched vertices, sorted by priority
	for (let k = pmax; k; k--) {
		steps++;
		if (!first[k]) continue;
		for (let u = first[k]; u; u = plists.next(u)) {
			steps++;
			if (match.at(u)) continue;
			for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
				steps++;
				if (!match.at(g.mate(u,e))) {
					match.add(e); break;
				}
			}
			if (!match.at(u)) roots.enq(u);
		}
	}

	for (let u = 1; u <= g.n; u++) base[u] = u;

	if (trace)
		traceString += `${g.toString(3,0,u => g.x2s(u) + ':' + prio[u]) }` +
					   `initial matching: ${match.toString()}\n`;

	let r = newPhase();
	while (!q.empty() || !roots.empty()) {
		steps++;
		while (q.empty() && !roots.empty()) {
			r = roots.deq(); add2q(r);
		}
		if (q.empty()) break;
		let e = q.deq(); let u = g.left(e); let U = bid(u);
		if (state[U] != +1) { u = g.right(e); U = bid(u); }
		let v = g.mate(u,e); let V = bid(v);
		if (U == V || state[V] < 0) continue;
			// skip edges internal to a blossom and edges to odd vertices

		if (state[V] == 0) {
			let ee = addBranch(u,e,r);
			if (ee) {
				// found priority-improving path
				augment(ee); r = newPhase();
			}
		} else {
			// U and V are both even
			let A = nca(U,V);
			if (A) {
				let ee = addBlossom(e,A,r);
				if (ee) {
					// found priority-improving path
					augment(ee); r = newPhase();
				}
			} else {
				// U, V are in different trees - augment and start new phase
				let r1 = root(U); let r2 = root(V);
				let ee = apath.join(apath.reverse(path(u,r1)),e);
				augment(apath.join(ee, path(v,r2)));
				r = newPhase();
			}
		}
	}

	if (trace)
		traceString += `final matching: ${match.toString()}\n`;
		
	steps += outer.getStats().steps;
	link = q = outer = apath = base = bridge = state = mark = null;
	plists = first = roots = null;
	let psum = 0;
	for (let u = 1; u <= g.n; u++) 
		if (match.at(u)) psum += prio[u];
    return [match, traceString,
			{'size': match.size(), 'psum': psum, 'paths': paths,
			 'blossoms': bcount, 'steps': steps }];
}

/** Prepare for a new phase
 *  @return the root of the current tree
 */
function newPhase() {
	outer.clear(); q.clear(); link.fill(0); state.fill(0);
	roots.clear();
	for (let k = pmax; k >= 0; k--) {
		steps++;
		if (!first[k]) continue;
		for (let u = first[k]; u; u = plists.next(u)) {
			base[u] = u; steps++;
			if (!match.at(u)) {
				state[u] = 1;
				if (k > 0) roots.enq(u);
			}
		}
	}
	let r = 0;
	while (q.empty() && !roots.empty()) {
		r = roots.deq(); add2q(r);
	}
	return r;
}

/** Extend tree at an even vertex.
 *  @param u is an even matched vertex that is not in a blossom.
 *  @param e is an edge connecting u to an unreached vertex v
 *  @param r is the root of the tree containing u
 *  @return a priority-improving path, if there is one, else 0;
 *  more specifically, set path in apath and return its first edge
 */
function addBranch(u, e, r) {
	let v = g.mate(u,e);  state[v] = -1; link[v] = e;
	let ee = match.at(v);
	let w = g.mate(v,ee); state[w] = +1; link[w] = ee;
	if (prio[w] < prio[r]) {
		if (trace)
			traceString += `branch: found ${g.x2s(r)}-${g.x2s(w)} path\n`;
		return apath.reverse(path(w,r));
	}
	add2q(w);
	if (trace) {
		traceString += `branch: ${g.x2s(u)}--${g.x2s(v)}`;
		traceString += w ? `--${g.x2s(w)}\n` : '\n';
	}
	return 0;
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

/** Add new blossom defined by edge or a priority-improving path.
 *  @param e is an edge joining two even vertices in same tree
 *  @param A is the nearest common ancestor of e's endpoints
 *  @param r is the tree root
 *  @return an odd vertex on the blossom cycle with priority <p,
 *  or 0 if there is no such vertex
 */
function addBlossom(e, A, r) {
	bcount++;
	let u = g.left(e);  let U = bid(u);
	let v = g.right(e); let V = bid(v);

	// check for presence of priority-improving path
	let x = U;
	while (x != A) {
		x = g.mate(x,link[x]); // x now odd
		if (prio[x] < prio[r]) {
			if (trace)
				traceString += `blossom: found ${g.x2s(r)}-${g.x2s(x)} path\n`;
			let ee = apath.reverse(path(v,r));
			return apath.join(apath.join(ee,e),path(u,x));
		}
		x = bid(g.mate(x,link[x]));
		steps++;
	}

	x = V;
	while (x != A) {
		x = g.mate(x,link[x]); // x now odd
		if (prio[x] < prio[r]) {
			if (trace)
				traceString += `blossom: found ${g.x2s(r)}-${g.x2s(x)} path\n`;
			let ee = apath.reverse(path(u,r));
			return apath.join(apath.join(ee,e),path(v,x));
		}
		x = bid(g.mate(x,link[x]));
		steps++;
	}

	// proceed to forming new blossom
	x = U; let s = '';
	while (x != A) {
		if (trace) s = `${g.x2s(x)}${s ? ' ' : ''}` + s;
		base[outer.merge(outer.find(x), outer.find(A))] = A;
		x = g.mate(x,link[x]); // x now odd
		if (trace) s = `${g.x2s(x)} ${s}`;
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
					   `	${outer.toString()}\n`;
	return 0;
}

/** Flip the edges along an augmenting or priority-increasing path.
 *  On return, the apath object is back in its original state.
 *  @param u is last endpoint of a path found by findpath
 *  @param e is the last edge on the path.
 */
function augment(e) {
	if (trace) traceString += 'augment:';
	while (true) {
		if (trace) traceString += ' ' + g.e2s(e,0,1);
		match.add(e);
		if (apath.isLast(e)) break;
		e = apath.pop(e); match.drop(e);
		if (trace) traceString += ' ' + g.e2s(e,0,1);
		if (apath.isLast(e)) break;
		e = apath.pop(e);
		steps++;
	}
	if (trace)
		traceString += `\n    ${match.toString()}\n`;
	paths++;
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
 *  specifically, return the first edge on the path.
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
