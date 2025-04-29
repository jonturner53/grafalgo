/** @file pmatchVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';

let g;         // shared reference to graph
let blossoms;  // set per blossom
let origin;    // original vertex for each blossom
let link;      // edge to parent in tree
let mark;      // mark bits used by nca

/** Verify a maximum priority matching.
 *  @param G is an undirected graph
 *  @param prio is a vector of vertex priorities..
 *  @param match is a Matching object
 *  @return a string which is empty if match is a maximum priority matching,
 *  otherwise it describes an error
 */
export default function pmatchVerify(G, prio, match) {
	g = G;
	blossoms = new MergeSets(g.n);
	origin = new Int32Array(g.n+1);
	link = new Int32Array(g.n+1);
	mark = new Int8Array(g.n+1);
	let root = new Int32Array(g.n+1);
	let state = new Int8Array(g.n+1);

	// state values
	const unreached = 0; const even = 1; const odd = -1;

	// create a list of vertices with positive priority
	// ordered by priority and initialize origin, state and root
	let vlist = new Int32Array(g.n+1); let i = 0;
	for (let u = 1; u <= g.n; u++) {
		origin[u] = u;
		if (!match.at(u)) {
			if (prio[u] > 0) vlist[i++] = u;
			state[u] = even; root[u] = u;
		}
	}
	if (!i) return '';
	vlist = vlist.slice(0,i);
	vlist.sort((u,v) => vlist[u]-vlist[v]);

	// create list of edges to be processed in main loop
	// ordered by their highest priority endpoint
	let q = new List(g.edgeRange);
	for (const u of vlist) {
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
			if (!q.contains(e)) q.enq(e);
	}

	while (!q.empty()) {
		let e = q.deq();
		let u = g.left(e); let U = base(u);
		if (state[U] != even) { u = g.right(e); U = base(u); }
		let v = g.mate(u,e); let V = base(v);
		if (U == V || state[V] == odd) continue;
		let r = root[u];
		if (state[V] == unreached) {
			// v is not contained in a blossom and is matched
			// so extend tree and add newly eligible edges to q
			let w = g.mate(v,match.at(v));
			state[v] = odd;  link[v] = e;
			state[w] = even; link[w] = match.at(v);
			if (prio[w] < prio[r]) {
				return `higher priority by flipping ` +
					   `alt path from ${g.x2s(r)} to ${g.x2s(w)}`;
			}
			root[v] = root[w] = r;
			for (let ee = g.firstAt(w); ee != 0; ee = g.nextAt(w,ee)) {
				if ((ee != match.at(w)) && !q.contains(ee))
					q.push(ee);  // add to front of queue
			}
			continue;
		}
		// U and V are both even
		let a = nca(U,V);
		if (a == 0) {
			return  `can augment matching thru ${g.e2s(e)} `;
		}

		// U and V are in same tree - collapse blossom
		let x = U;
		while (x != a) {
			origin[blossoms.merge(blossoms.find(x), blossoms.find(a))] = a;
			x = g.mate(x,link[x]); // x now odd
			if (prio[x] < prio[r]) {
				return `can improve matching by flipping ` +
					   `path from ${g.x2s(r)} to ${g.x2s(x)}`;
			}
			origin[blossoms.merge(x,blossoms.find(a))] = a;
			for (let ee = g.firstAt(x); ee != 0; ee = g.nextAt(x,ee)) {
				if (!q.contains(ee)) q.enq(ee);
			}
			x = base(g.mate(x,link[x]));
		}
		x = V;
		while (x != a) {
			origin[blossoms.merge(blossoms.find(x),
					      blossoms.find(a))] = a;
			x = g.mate(x,link[x]); // x now odd
			if (prio[x] < prio[r]) {
				return `higher priority by flipping ` +
					   `alt path from ${g.x2s(r)} to ${g.x2s(w)}`;
			}
			origin[blossoms.merge(x,blossoms.find(a))] = a;
			for (let ee = g.firstAt(x); ee != 0; ee = g.nextAt(x,ee)) {
				if (!q.contains(ee)) q.enq(ee);
			}
			x = base(g.mate(x,link[x]));
		}
	}

	return '';
}

function base(u) { return origin[blossoms.find(u)]; }

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
 			x = base(g.mate(x,link[x]));
		}
		if (link[y] != 0) {
			mark[y] = true;
			y = g.mate(y,link[y]);
			y = base(g.mate(y,link[y]));
		}
	}
	// second pass to clear mark bits
	x = u;
	while (mark[x]) {
		mark[x] = false;
		x = g.mate(x,link[x]); x = base(g.mate(x,link[x]));
	}
	y = v;
	while (mark[y]) {
		mark[y] = false;
		y = g.mate(y,link[y]); y = base(g.mate(y,link[y]));
	}
	return result;
}
