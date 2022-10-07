/** @file matchVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';

let g;         // shared reference to graph
let blossoms;  // set per blossom
let origin;    // original vertex for each blossom
let state;     // state used in path search
let link;     // edge to parent in tree
let mark;      // mark bits used by nca
let match;     // matching edge at a vertex

/** Verify a maximum matching.
 *  @param mg is an undirected graph
 *  @param match is a an array of matching edges incident to vertices
 *  @return a string which is empty if match is a maximum matching,
 *  else it describes an error
 */
export default function matchVerify(mg, match) {
	g = mg;
	blossoms = new MergeSets(g.n);
	origin = new Int32Array(g.n+1);
	state = new Int8Array(g.n+1);
	link = new Int32Array(g.n+1);
	mark = new Int8Array(g.n+1);

	// state values
	const unreached = 0; const even = 1; const odd = -1;

	let q = new List(g.edgeRange); // list of edges to be processed in main loop
	for (let u = 1; u <= g.n; u++) {
		origin[u] = u;
		if (match[u] == 0) {
			state[u] = even;
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				if (!q.contains(e)) q.enq(e);
			}
		}
	}

	while (!q.empty()) {
		let e = q.deq();
		let u = g.left(e); let up = base(u);
		if (state[up] != even) { u = g.right(e); up = base(u); }
		let v = g.mate(u,e); let vp = base(v);
		if (up == vp || state[vp] == odd) continue;
		if (state[vp] == unreached) {
			// v is not contained in a blossom and is matched
			// so extend tree and add newly eligible edges to q
			let w = g.mate(v,match[v]);
			state[v] = odd;  link[v] = e;
			state[w] = even; link[w] = match[v];
			for (let ee = g.firstAt(w); ee != 0; ee = g.nextAt(w,ee)) {
				if ((ee != match[w]) && !q.contains(ee))
					q.enq(ee);
			}
			continue;
		}
		// up and vp are both even
		let a = nca(up,vp);
		if (a == 0)
			return `matchVerify: can extend matching thru ${g.edge2string(e)}`;

		// up and vp are in same tree - collapse blossom
		let x = up;
		while (x != a) {
			origin[blossoms.link(blossoms.find(x), blossoms.find(a))] = a;
			x = g.mate(x,link[x]); // x now odd
			origin[blossoms.link(x,blossoms.find(a))] = a;
			for (let ee = g.firstAt(x); ee != 0; ee = g.nextAt(x,ee)) {
				if (!q.contains(ee)) q.enq(ee);
			}
			x = base(g.mate(x,link[x]));
		}
		x = vp;
		while (x != a) {
			origin[blossoms.link(blossoms.find(x),
					      blossoms.find(a))] = a;
			x = g.mate(x,link[x]); // x now odd
			origin[blossoms.link(x,blossoms.find(a))] = a;
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
