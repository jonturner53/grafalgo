/** @file wmatchGMGa.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import Matching from './Matching.mjs';
import Blossoms from './Blossoms.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Sets from '../../dataStructures/basic/Sets.mjs';

let g=null;       // shared copy of graph
let match;        // Matching object representing matching for graph
let bloss;        // Blossoms object representing blossoms and matching trees

let z;            // z[b] is dual variable for blossom (or vertex) b
let q;            // list of even vertices
let blist;        // temporary list of blossoms
let mark;         // temporary array of flags

let ovh;          // ho is heap of odd vertices, with key[u]=z[u]
let evh;          // he is heap of even vertices, with key[u]=z[u]
let obh;          // ho is heap of odd outer blossoms, with key[b]=z[b]/2
let ebh;          // he is heap of even outer blossoms, with key[b]=z[b]/2
let heu;          // heu is heap of edges with one even, one unreached endpoint
                  // key[e={u,v}] = z[u]+z[v]-weight(e)

let trace;
let traceString;

let paths;      // number of paths found
let blossoms;   // number of blossoms formed
let deblossoms; // number of odd blossoms expanded
let relabels;   // number of relabeling steps
let steps;      // total number of steps

/** Compute a maximum weighted matching in a graph using Galil, Micali
 *  Gabows' implementation of Edmonds's weighted matching algorithm.
 *  @param g is an undirected graph with weights
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is an array
 *  matching a vertex u to its matched edge match[u] or 0 if u
 *  is unmatched; ts is a possibly empty trace string
 *  and stats is a statistics object
 */
export default function wmatchGMG(mg, traceFlag=false, subsets=null) {
	g = mg;
	match = new Matching(g);
	bloss = new Blossoms(g, match);
	z = new Float32Array(bloss.n+1);
	q = new List(bloss.n);
	blist = new List(bloss.n);
	mark = new Int8Array(bloss.n+1).fill(false);
	
	ovh = new ArrayHeap(g.n);
	evh = new ArrayHeap(g.n);
	obh = new ArrayHeap(bloss.n);
	ebh = new ArrayHeap(bloss.n);

	trace = traceFlag; traceString = '';
	paths = blossoms = deblossoms = relabels = 0; steps = g.n + g.edgeCapacity;

	let maxwt = -Infinity;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxwt = Math.max(g.weight(e),maxwt);
	}
	z.fill(maxwt/2.0,1,g.n+1);

	for (let u = 1; u <= g.n; u++) q.enq(u);

	if (trace) {
        traceString += `${g.toString(0,1)}\n`;
	}

	while (true) {
		if (trace) {
			if (bloss.toString().length > 3) {
				traceString += `outer blossoms:\n    ${''+bloss}\n`;
			}
		}
		let s = verifyInvariant();
		if (s) {
			s = traceString + 'Error: ' + s + '\n' + statusString();
			console.log(s); return [match, s];
		}

		while (!euh.empty() || !evh.empty()) {
			steps++;
			if (!euh.empty()) {
				let e = euh.deletemin();
				newBranch(e);
			} else if (!eeh.empty()) {
				let ba = nca(e);
				if (ba == 0) {
					augment(e);
				} else {
					newBlossom(e);
				}
			}
		}

		relabels++;
		if (relabel()) break;
	}

	if (trace) {
		traceString += `final matching:\n    ${match.toString()}\n`;
	}
	steps += bloss.getStats().steps;

	let s = verify(); assert(!s,s);

    return [match, traceString,
			{'paths': paths, 'blossoms': blossoms, 'deblossoms': deblossoms,
			 'relabels': relabels, 'steps': steps}];
}

/** Add vertices in an even outer blossom to the pending blossom queue.
 *  @param b is an even outer blossom to be added to q
 */
function addBloss2q(b) {
	for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
		steps++;
		if (!q.contains(u)) q.enq(u);
	}
}

function newBranch(e) {
	let u = g.left(e); let v = g.right(e);
	let bu = bloss.outer(u); let bv = bloss.outer(v);
	if (bloss.state(u) != +1) [u,v,bu,bv] = [v,u,bv,bu];
	let bw = bloss.addBranch(e,v,bv);

	// now, update the heaps to reflect new states of bv and bw

	// add bv to obh and vertices in bv to ovh; update euh
	if (bv > g.n) obh.insert(bv,z[bv]/2);
	for (let x = bloss.firstIn(bv); x; x = bloss.nextIn(bv,x)) {
		ovh.insert(x,z[x]);
		for (let ex = g.firstAt(x); ex; ex = g.nextAt(x,ex)) {
			if (euh.contains(ex)) euh.delete(ex);
		}
	}
	
	// add bw to ebh and vertices in bw to evh; update euh and eeh
	if (bw > g.n) ebh.insert(bw,z[bw]/2);
	for (let x = bloss.firstIn(bx); x; x = bloss.nextIn(bx,x)) {
		evh.insert(x,z[x]);
		for (let ex = g.firstAt(x); ex; ex = g.nextAt(x,ex)) {
			let y = g.mate(x,e); let by = bloss.outer(y);
			if (bloss.state(y) == 0) {
				euh.insert(ex,slack(ex));
			} else if (bloss.state(y) == +1) {
				euh.delete(ex);
				if (by != bx) eeh.insert(ex, slack(ex)/2);
			}
		}
	}
}

/** Perform one step in augmenting search.
 *  The step either adds a branch to a matching tree, forms a new blossom,
 *  or augments the matching.
 *  @param e is an edge with an even endpoint
 *  @param u is an endpoint of e
 *  @param bu is the even outer blossom containing u
 *  @param v is the other endpoint of e
 *  @param bv is the outer blossom containing v
 *  @return true if an augmenting path or blossom is found, else false
 */
function searchStep(e,u,v,bu,bv) {
	if (bloss.state(bv) == 0) {
		let bw = bloss.addBranch(e,v,bv);
		addBloss2q(bw);
		if (trace) traceString += `branch: ${g.x2s(u)} ${g.e2s(e)} ` +
								  `${g.e2s(match.at(bloss.base(bv)))}\n`;
		return false;
	} else if (bloss.state(bv) == +1) {
		let ba = nca(bu,bv);
		if (ba == 0) {
			// augment the path without expanding blossoms
			paths++;
			augment(e);
			if (trace) traceString += ' :';
			newPhase();
			if (trace) {
				traceString += '\n';
				if (bloss.toString().length > 3)
					traceString += `outer blossoms:\n    ${''+bloss}\n`;
			}
		} else {
			blossoms++;
			let [b,subs] = bloss.addBlossom(e,ba);
			addBloss2q(b);
			z[b] = 0;
			if (trace) {
				traceString += `blossom: ${bloss.x2s(b)} ` +
							   `${subs.toString(x => bloss.x2s(x))}\n`;
			}
		}
		return true;
	}
}

function newBlossom(e) {
	blossoms++;
	let [b,subs] = bloss.addBlossom(e,ba);
	z[b] = 0;
	if (trace) {
		traceString += `blossom: ${bloss.x2s(b)} ` +
					   `${subs.toString(x => bloss.x2s(x))}\n`;
	}

	// now update heaps
	ebh.add(b,z[b]);
	for (let sb = subs.first(); sb; sb = subs.next(sb)) {
		if (sb <= g.n) {
			if (ovh.contains(sb)) {
				ovh.delete(sb); evh.insert(sb,z[sb]);
			}
		} else {
			// remove sub-blossoms from outer blossom heaps
			if (ebh.contains(sb)) {
				ebh.delete(sb);
			} else {
				obh.delete(sb);
				for (let u = bloss.firstIn(sb); u; u = bloss.nextIn(sb,u)) {
					ovh.delete(u); evh.insert(u,z[u]);
				}
			}
		}
	}
}

/** Return the slack of an "outer edge".
 *  @param e is an edge joining vertices in different outer blossoms
 */
let slack = (e => z[g.left(e)] + z[g.right(e)] - g.weight(e));

/** Augment the current matching, using the path found by findpath.
 *  @param e is an edge joining two even outer blossoms in distinct trees;
 *  the path joining the tree roots that passes through e
 *  is an augmenting path
 */
function augment(e) {
	match.add(e);

	// trace paths up to tree roots and update matching
	let ts = '';
	if (trace) traceString += 'apath: ';
	let x = g.left(e); let bx = bloss.outer(x); let lx = bloss.link(bx);
	while (lx) {
		steps++;
		let [y,ee] = lx;
		if (match.contains(ee)) {
			bloss.flip(bx,x); match.drop(ee);
		} else {
			bloss.flip(bx,y); match.add(ee);
		}
		bloss.state(bx,0); bloss.link(bx,null);
		if (trace) ts = `${g.e2s(e)} ${bloss.x2s(bx)}${ts}`
		x = g.mate(y,ee); bx = bloss.outer(x); lx = bloss.link(bx);
	}
	bloss.flip(bx,x); bloss.state(bx,0);
	if (trace) ts = `${bloss.x2s(bx)}${ts}${g.e2s(e)}* `

	x = g.right(e); bx = bloss.outer(x); lx = bloss.link(bx);
	while (lx) {
		steps++;
		let [y,ee] = lx;
		if (match.contains(ee)) {
			bloss.flip(bx,x); match.drop(ee);
		} else {
			bloss.flip(bx,y); match.add(ee);
		}
		if (trace) { ts += `${bloss.x2s(bx)}${g.e2s(ee)} `; }
		bloss.state(bx,0); bloss.link(bx,null);
		x = g.mate(y,ee); bx = bloss.outer(x); lx = bloss.link(bx);
	}
	bloss.flip(bx,x); bloss.state(bx,0);
	if (trace) traceString += `${ts}${bloss.x2s(bx)} :`;

	newPhase();
	if (trace) {
		traceString += '\n';
		if (bloss.toString().length > 3)
			traceString += `outer blossoms:\n    ${''+bloss}\n`;
	}
}

/** Prepare for next phase, following an augmentation.
 *  Expand all outer blossoms with z==0, set states of remaining outer
 *  blossoms to unreached or even and their links to null.
 *  Put all vertices in even blossoms into queue of even vertices.
 */
function newPhase() {
	// expand outer blossoms with z == 0
	blist.clear();
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (z[b] == 0 && b > g.n) blist.enq(b);
	}
	while (!blist.empty()) {
		let b = blist.deq();
		if (trace) traceString += ` ${bloss.x2s(b)}`;
		let subs = bloss.expandBlossom(b); deblossoms++;
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			if (z[sb] == 0 && sb > g.n) {
				blist.enq(sb);
			}
		}
	}

	// set states of remaining outer blossoms based on matching status
	// and update vertex heaps and blossom heaps
	evh.clear(); ovh.clear(); ebh.clear(); obh.clear();
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		bloss.state(b, match.at(bloss.base(b)) ? 0 : +1); bloss.link(b,null);
		if (bloss.state(b) == 0) continue;
		if (b > g.n) ebh.insert(u, z[u]);
		for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
			evh.insert(u, z[u]);
		}
	}

	// add eligible edges to euh or eeh as appropriate
	for (let e = g.first(); e; e = g.next(e)) {
		if (slack(e) > 0) continue;
		let u = g.left(e); let v = g.right(e);
		let bu = bloss.outer(u); let bv = bloss.outer(v);
		if (bu == bv) continue;
		if (bloss.state(bu) + bloss.state(bv) == +2)
			eeh.insert(e, slack(e)/2); 
		else if (bloss.state(bu) + bloss.state(bv) == +1)
			add e to euh
	}
}

/** Adjust the labels for the vertices and blossoms.
 *  This is a brute-force version, using no special data structures.
 *  Takes O(m) time.
 *  @return tuple true if we have a max weight matching, else false
 */
function relabel() {
	// first initialize outer blossom of all vertices and sub-blossoms
	let outer = new Int32Array(bloss.n);
	blist.clear();
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		blist.enq(b);
		while (!blist.empty()) {
			steps++;
			let bb = blist.deq(); outer[bb] = b;
			for (let sb = bloss.firstSub(bb); sb; sb = bloss.nextSub(sb))
				blist.enq(sb);
		}
	}

	let d1 = evh.key(evh.findmin());

	let d2 = Infinity; let d3 = Infinity;
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		let u = g.left(e); let v = g.right(e);
		if (outer[u] == outer[v]) continue;
		let su = bloss.state(outer[u]); let sv = bloss.state(outer[v]);
		if (su + sv == +1) {
			d2 = Math.min(d2, slack(e));
		}
	}

	let d3 = eeh.empty() ? Infinity : eeh.key(eeh.findmin());

	let d4 = obh.empty() ? Infinity : obh.key(obh.findmin());

	let delta = Math.min(d1,d2,d3,d4);

	if (trace) traceString += `relab(${delta})`;

	evh.add2keys(-delta);   ovh.add2keys(+delta);
	ebh.add2keys(+2*delta); obh.add2keys(-2*delta);
	eeh.add2keys(-2*delta);
	
	if (evh.findmin() == 0) {
		if (trace) traceString += ' and finished\n';
		return true; // we have max weight matching
	}






	// now, add new even vertices to q
	if (trace) traceString += '\n    [';
	if (delta == d2) {
		let first = true;
		for (let e = g.first(); e; e = g.next(e)) {
			steps++;
			let u = g.left(e);  let bu = bloss.outer(u);
			let v = g.right(e); let bv = bloss.outer(v);
			if (bu == bv || slack(e) != 0) continue;
			if (bloss.state(bu) == +1 && bloss.state(bv) == 0) {
				if (!q.contains(u)) q.enq(u);
			} else if (bloss.state(bv) == +1 && bloss.state(bu) == 0) {
				if (!q.contains(v)) q.enq(v);
			}
			if (trace && bloss.state(bu) + bloss.state(bv) == 1) {
				if (first) first = false;
				else traceString += ' ';
				traceString += `${g.e2s(e)}`;
			}
		}
	}
	if (trace) traceString += ']\n    [';
	if (delta == d3) {
		let first = true;
		for (let e = g.first(); e; e = g.next(e)) {
			steps++;
			let u = g.left(e);  let bu = bloss.outer(u);
			let v = g.right(e); let bv = bloss.outer(v);
			if (bu == bv || slack(e) != 0) continue;
			if (bloss.state(bu) + bloss.state(bv) == +2) {
				if (!q.contains(u)) q.enq(u);
				if (!q.contains(v)) q.enq(v);
				if (trace) {
					if (first) first = false;
					else traceString += ' ';
					traceString += `${g.e2s(e)}`;
				}
			}
		}
	}
	if (trace) traceString += ']\n    [';

	// and expand odd blossoms with zero z in place, adding the new
	// vertices in new even outer blossoms to q
	if (delta == d4) {
		let first = true;
		for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
			if (b <= g.n || bloss.state(b) != -1 || z[b] != 0) continue;
			let blist = bloss.expandInplace(b); deblossoms++;
			if (trace) {
				if (first) first = false;
				else traceString += ' ';
				traceString += `${bloss.x2s(b)}`;
			}
			for (let sb = blist.first(); sb; sb = blist.next(sb)) {
				steps++;
				if (bloss.state(sb) == +1) {
					if 
			}
		}
	}
	if (trace) traceString += ']\n';

	return false;
}

/** Find the nearest common ancestor of two vertices in
 *  the current graph.
 *  To avoid excessive search time, search upwards from both vertices in
 *  parallel, using mark bits to identify the nca. Before returning,
 *  clear the mark bits by traversing the paths a second time.
 *  @param bu is an outer blossom
 *  @param bv is another outer blossom
 *  @returns the nearest common ancestor of u and v or 0 if none
 */
function nca(bu, bv) {
	let result;
	// first pass to find the nca
	let bx = bu; let lx = bloss.link(bx);
	let by = bv; let ly = bloss.link(by);
	while (true) {
		steps++;
		if (bx == by) { result = bx; break; }
		if (mark[bx]) { result = bx; break; }
		if (mark[by]) { result = by; break; }
		if (!lx && !ly) { result = 0; break; }
		if (lx) {
			mark[bx] = true;
			bx = bloss.outer(g.mate(lx[0],lx[1])); lx = bloss.link(bx);
		}
		if (ly) {
			mark[by] = true;
			by = bloss.outer(g.mate(ly[0],ly[1])); ly = bloss.link(by);
		}
	}
	// second pass to clear mark bits
	bx = bu; lx = bloss.link(bx);
	while (mark[bx]) {
		mark[bx] = false;
		bx = bloss.outer(g.mate(lx[0],lx[1])); lx = bloss.link(bx);
	}
	by = bv; ly = bloss.link(by);
	while (mark[by]) {
		mark[by] = false;
		by = bloss.outer(g.mate(ly[0],ly[1])); ly = bloss.link(by);
	}
	return result;
}

export function verify() {
	let s = verifyInvariant();
	if (!s) {
		for (let u = 1; u <= g.n; u++) {
			if (!match.at(u) && z[u] > 0) {
				s += `for unmatched vertex ${bloss.x2s(u)}, ` +
					   `z(${bloss.x2s(u)})=${z[u]}`;
				break;
			}
		}
	}
	if (s) {
		s = traceString + 'Error(f): ' + s + '\n' + statusString();
		console.log(s + g.toString(0,1));
	}
	return s;
}

function verifyInvariant() {
	let mv = match.verify(); if (mv) return mv;
	let bv = bloss.verify(); if (bv) return bv;
	for (let b = 1; b <= bloss.n; b++) {
		if (b <= g.n && z[b] < 0)
			return `vertex ${bloss.x2s(b)} has negative z=${z[b]}`;
		else if (b > g.n && bloss.validBid(b) && z[b] < 0)
			return `blossom ${bloss.x2s(b)} has negative z=${z[b]}`;
	}
	for (let e = g.first(); e; e = g.next(e)) {
		let u = g.left(e); let v = g.right(e);
		if (bloss.outer(u) == bloss.outer(v)) continue;
		if (slack(e) < 0)
			return `edge ${g.e2s(e)} has negative slack=${slack(e)}` +
				   `states=[${bloss.state(u)},bloss.state(v)}] ` +
				   `z=[${z[u]},z[v]}]`;
		if (match.contains(e) && slack(e) > 0) {
			return `matched edge ${g.e2s(e)} has non-zero slack=${slack(e)}` +
				   `states=[${bloss.state(u)},bloss.state(v)}] ` +
				   `z=[${z[u]},z[v]}]`;
		}
	}
	return '';
}

function statusString() {
	let s = 'complete state\nmatch:' + match.toString() + '\nbloss:' + 
			bloss.toString(1,1);
	s += 'z values\n';
	for (let u = 1; u <= g.n; u++) {
		if (u > 1) s += ' ';
		s += `${g.x2s(u)}:${z[u]}`
	}
	s += '\n';
	let first = true
	for (let b = g.n+1; b <= bloss.n; b++) {
		if (!bloss.validBid(b)) continue;
		if (first) first = false;
		else s += ' ';
		s += `${bloss.x2s(b)}:${z[b]}`
	}
	s += '\n';
	return s;
}
