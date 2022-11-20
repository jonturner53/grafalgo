/** @file wmatchE.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import Matching from './Matching.mjs';
import Blossoms from './Blossoms.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

let g=null;       // shared copy of graph
let match;        // Matching object representing matching for graph
let bloss;        // Blossoms0 object representing blossoms and matching trees

let z;            // z[b] is dual variable for blossom (or vertex) b
let eq;           // list of edges with an even endpoint
let blist;        // temporary list of blossoms
let mark;         // temporary array of flags

let trace;
let traceString;

let branches;   // number of new branches formed
let blossoms;   // number of blossoms formed
let deblossoms; // number of odd blossoms expanded
let relabels;   // number of relabeling steps
let steps;      // total number of steps

/** Compute a maximum weighted matching in a graph using a
 *  Edmonds's weighted matching algorithm.
 *  @param g is an undirected graph with weights
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is an array
 *  matching a vertex u to its matched edge match[u] or 0 if u
 *  is unmatched; ts is a possibly empty trace string
 *  and stats is a statistics object
 */
export default function wmatchE(mg, traceFlag=false, subsets=null) {
	g = mg;
	match = new Matching(g);
	bloss = new Blossoms(g, match, 1);
	z = new Float32Array(bloss.n+1);
	eq = new List(g.edgeRange);
	blist = new List(bloss.n);
	mark = new Int8Array(bloss.n+1).fill(false);

	trace = traceFlag; traceString = '';
	branches = blossoms = deblossoms = relabels = 0; steps = g.n + g.edgeRange;

	let maxwt = -Infinity;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxwt = Math.max(g.weight(e),maxwt);
	}
	z.fill(maxwt/2.0,1,g.n+1);

	for (let e = g.first(); e; e = g.next(e)) {
		if (slack(e) == 0) eq.enq(e);
	}

	if (trace) { traceString += `${g.toString(1)}`; }

	while (true) {
		if (trace) {
			traceString += '\nmatching: ' +
							match.toString(e => bloss.outer(g.left(e)) !=
												bloss.outer(g.right(e))) + '\n';
			traceString += `eligible: ${eq.toString(e => g.e2s(e,0,1))}\n`;
			if (bloss.toString().length > 3)
				traceString += 'outer blossoms:\n' + bloss.toString(1);
		}
		/* check invariant when debugging
		let s = verifyInvariant();
		if (s) {
			s = traceString + 'Error: ' + s + '\n' + statusString();
			console.log(s); return [match, s];
		}
		*/

		while (!eq.empty()) {
			steps++;
			let e = eq.deq();
			let [u,v] = [g.left(e),g.right(e)];
			let [bu,bv] = [bloss.outer(u),bloss.outer(v)];
			let [sbu,sbv] = [bloss.state(bu),bloss.state(bv)];
			if (bu == bv || sbu + sbv <= 0 || slack(e) > 0) continue;
			// at least one even endpoint
			if (sbu + sbv == 1 && sbu == 0) {
				[u,v] = [v,u]; [bu,bv] = [bv,bu]; [sbu,sbv] = [sbv,sbu];
			}

			// now bu is even and bv is even or unreached
			if (sbv == 0) {
				let bw = bloss.addBranch(e,v,bv); add2eq(bw);
				if (trace) traceString += `branch: ${bloss.x2s(bu)} ${g.e2s(e,0,1)} ` +
										  `${bloss.x2s(bv)} ` +
										  `${g.e2s(match.at(bloss.base(bv)),0,1)} ` +
										  `${bloss.x2s(bw)}\n`;
				branches++; continue;
			}
			let ba = nca(bu,bv);
			if (ba) {
				blossoms++;
				let [nu,subs,sb] = bloss.addBlossom(e,ba); z[nu] = 0;
				let state = +1;
				for (let b = subs.first(); b; b = subs.next(b)) {
					if (state == -1) add2eq(b);
					state = (b == sb ? +1 : -state);
				}
				if (trace) {
					traceString += `blossom: ${bloss.x2s(nu)} ` +
								   `${subs.toString(x => bloss.x2s(x))}\n`;
				}
			} else {
				augment(e);
			}
		}
		relabels++;
		if (relabel()) break;
	}

	// before returning, verify invariant, expand remaining blossoms
	// to complete matching and finally verify termination condition
	blist.clear();
	let s = verifyInvariant();
	fassert(!s, traceString + s + '\n' + statusString());
	
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (b > g.n) blist.enq(b);
	}
	while (!blist.empty()) {
		let b = blist.deq();
		let subs = bloss.expand(b);
		for (let bb = subs.first(); bb; bb = subs.next(bb))
			if (bb > g.n) blist.enq(bb);
	}

	s = checkTerm();
	fassert(!s, traceString + s + '\n' + statusString());

	if (trace) {
		traceString += `final matching:\n    ${match.toString()}\n`;
	}
	steps += bloss.getStats().steps;

    return [match, traceString,
			{'weight':match.weight(), 'branches': branches, 'blossoms': blossoms,
			 'relabels': relabels, 'deblossoms': deblossoms, 'steps': steps}];
}


/** Augment the current matching, using the path found by findpath.
 *  @param e is an edge joining two even outer blossoms in distinct trees;
 *  the path joining the tree roots that passes through e
 *  is an augmenting path
 */
function augment(e) {
	match.add(e);

	// trace paths up to tree roots and update matching
	let ts = '';
	let x = g.left(e); let bx = bloss.outer(x);
	let [y,ee] = bloss.link(bx);
	while (y) {
		steps++;
		if (match.contains(ee)) {
			match.drop(ee); bloss.base(bx,x);
		} else {
			match.add(ee); bloss.base(bx,y);
		}
		bloss.state(bx,0); bloss.link(bx,[0,0]);
		if (trace) ts = `${g.e2s(ee,0,1)} ${bloss.x2s(bx)} ${ts}`
		x = g.mate(y,ee); bx = bloss.outer(x); [y,ee] = bloss.link(bx);
	}
	bloss.base(bx,x); bloss.state(bx,0);
	if (trace) ts = `${bloss.x2s(bx)} ${ts}${g.e2s(e,0,1)}* `

	x = g.right(e); bx = bloss.outer(x); [y,ee] = bloss.link(bx);
	while (y) {
		steps++;
		if (match.contains(ee)) {
			match.drop(ee); bloss.base(bx,x);
		} else {
			match.add(ee); bloss.base(bx,y);
		}
		if (trace) { ts += `${bloss.x2s(bx)} ${g.e2s(ee,0,1)} `; }
		bloss.state(bx,0); bloss.link(bx,[0,0]);
		x = g.mate(y,ee); bx = bloss.outer(x); [y,ee] = bloss.link(bx);
	}
	bloss.base(bx,x); bloss.state(bx,0);
	if (trace) traceString += `apath: ${ts}${bloss.x2s(bx)}`;

	newPhase();
	if (trace) {
		traceString += '\n';
		if (bloss.toString().length > 3)
			traceString += 'outer blossoms:\n' + bloss.toString(1);
	}
}

/** Prepare for next phase, following an augmentation.
 *  Expand all outer blossoms with z==0, set states of remaining outer
 *  blossoms to unreached or even and their links to null.
 *  Put all vertices in even blossoms into queue of even vertices.
 */
function newPhase() {
	// expand non-trivial outer blossoms with z == 0
	eq.clear(); blist.clear();
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (z[b] == 0 && b > g.n) blist.enq(b);
	}
	if (trace && !blist.empty()) traceString += ' :';
	while (!blist.empty()) {
		let b = blist.deq();
		if (trace) traceString += ` ${bloss.x2s(b)}`;
		let subs = bloss.expand(b); 
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			if (z[sb] == 0 && sb > g.n) blist.enq(sb);
		}
	}
	// set state and link for remaining blossoms and add their
	// eligible edges to eq
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		bloss.state(b, match.at(bloss.base(b)) ? 0 : +1);
		bloss.link(b,[0,0])
		if (bloss.state(b) == +1) add2eq(b);
	}
}

/** Adjust the labels for the vertices and blossoms.
 *  This is a brute-force version, using no special data structures.
 *  Takes O(m) time.
 *  @return tuple true if we have a max weight matching, else false
 */
function relabel() {
	let d1 = Infinity;
	for (let u = 1; u <= g.n; u++) {
		if (bloss.state(bloss.outer(u)) == +1) d1 = Math.min(d1, z[u]);
	}
	if (d1 == Infinity) d1 = 0;

	let d2 = Infinity; let d3 = Infinity; let d4 = Infinity;
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		steps++;
/*
This is O(mn) for each relabel, because of outer(v).
That makes it O(mn^3) altogether, not O(mn^2).
Can get around this by precomputing outer. Not clear that
this is the intention, but it does work.

*/
		if (bloss.state(b) == +1) {
			for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
				for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
					let v = g.mate(u,e); let bv = bloss.outer(v);
					if (bv == b) continue;
					let sv = bloss.state(bv);
						 if (sv == 0) d2 = Math.min(d2, slack(e));
					else if (sv == 1) d3 = Math.min(d3, slack(e)/2);
				}
			}
		} else if (b > g.n && bloss.state(b) == -1) {
			d4 = Math.min(d4, z[b]/2);
		}
	}

	let delta = Math.min(d1,d2,d3,d4);

	if (trace) traceString += `relab(${delta})`;
	
	// adjust the z values for vertices and outer blossoms
	for (let u = 1; u <= g.n; u++) {
		steps++;
		if (bloss.state(bloss.outer(u)) == +1) z[u] -= delta;
		if (bloss.state(bloss.outer(u)) == -1) z[u] += delta;
	}

	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		steps++;
		if (b <= g.n) continue;
		if (bloss.state(b) == +1) z[b] += 2*delta;
		if (bloss.state(b) == -1) z[b] -= 2*delta;
	}

	if (delta == d1) {
		if (trace) traceString += ' and finished\n';
		return true; // we have max weight matching
	}
	if (trace) traceString += '\n';

	// now, add new even edges to eq
	if (delta == d2 || delta == d3) {
		for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
			if (bloss.state(b) == +1) add2eq(b)
			steps++;
		}
	}

	// and expand odd blossoms with zero z in place, adding the new
	// ee and eu edges to eq
	if (delta == d4) {
		// expand odd blossoms with zero z
		blist.clear(); let ts = '';
		for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
			if (z[b] == 0 && b > g.n && bloss.state(b) == -1)
				blist.enq(b);
		}
		while (!blist.empty()) {
			let b = blist.deq();
			if (trace) {
				if (ts.length) ts += ' ';
				ts += bloss.x2s(b);
			}
			let subs = bloss.expandOdd(b); deblossoms++;
// maybe add2eq on even blossoms in subs?
// adds O(m) per phase, since these blossoms are disjoint
// by deferring, we may have to relabel sooner
		}
		if (trace) traceString += `  ob: [${ts}]\n`;
	}

	return false;
}

/** Add edges incident to an even blossom to eq.
 *  @param b is an even blossom or sub-blossom.
 */
function add2eq(b,limit=false) {
	let bb = bloss.outer(b);
	for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			let v = g.mate(u,e); let bv = bloss.outer(v);
			if (bloss.state(bv) >= 0 && bv != bb &&
				slack(e) == 0 && !eq.contains(e)) {
				eq.enq(e);
			}
			steps++;
		}
	}
}

/** Return the slack of an external edge.
 *  @param e is an edge joining two different external blossoms
 *  verifying the invariant
 */
function slack(e) {
	return z[g.left(e)] + z[g.right(e)] - g.weight(e);
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
	let bx = bu; let [x,ex] = bloss.link(bx);
	let by = bv; let [y,ey] = bloss.link(by);
	while (true) {
		steps++;
		if (bx == by) { result = bx; break; }
		if (mark[bx]) { result = bx; break; }
		if (mark[by]) { result = by; break; }
		if (!x && !y) { result = 0; break; }
		if (x) {
			mark[bx] = true;
			bx = bloss.outer(g.mate(x,ex)); [x,ex] = bloss.link(bx);
		}
		if (y) {
			mark[by] = true;
			by = bloss.outer(g.mate(y,ey)); [y,ey] = bloss.link(by);
		}
	}
	// second pass to clear mark bits
	bx = bu; [x,ex] = bloss.link(bx);
	while (mark[bx]) {
		mark[bx] = false;
		bx = bloss.outer(g.mate(x,ex)); [x,ex] = bloss.link(bx);
	}
	by = bv; [y,ey] = bloss.link(by);
	while (mark[by]) {
		mark[by] = false;
		by = bloss.outer(g.mate(y,ey)); [y,ey] = bloss.link(by);
	}
	return result;
}

function statusString() {
	let s = 'complete state\nmatch:' + match.toString() + '\nbloss:' + 
			bloss.toString(1);
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

/*
How can I verify final match weight.
Can check invariant before expanding blossoms.
Add check on slack of internal edges?
For each internal edge, compute slack offset to reflect
the z values of the blossoms containing both

What about checking optimality property on "current graph" before
expanding blossoms? Normally, this means checking z values for
vertices are zero, but can I substitute the z value of a blossom
for the vertex z value? That is, are the external matching edges
max weight if the z values for all external blossoms are 0?
Makes sense if we just view the blossom z values like vertex
labels in the current graph.

Note: only unmatched vertices must have zero z for maximality
condition to hold. So, vertices or blossoms at tree roots.
Since only the base of blossom in unmatched, we can use its
z value as the representative of the blossom in the outer
graph. But this amounts to just checking the z values of
all unmatched vertices. Maybe this doesn't work, since we
are using the z values of all vertices in the blossom to
compute slack of incident edges. So, cannot just use base's
z value for one purpose and the others for another.
*/

/** Check for unmatched vertices with non-zero z.
 */
function checkTerm() {
	for (let u = 1; u <= g.n; u++) {
		if (match.at(u) == 0 && z[u] != 0 )
			return `unmatched vertex ${g.x2s(u)} has non-zero z=${z[u]}`;
	}
}

function verifyInvariant() {
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
		if (slack(e) < 0) {
			return `edge ${g.e2s(e)} has negative slack=${slack(e)} ` +
				   `states=[${bloss.state(u)},${bloss.state(v)}] ` +
				   `z=[${z[u]},${z[v]}]`;
		}
		if (match.contains(e) && slack(e) > 0) {
			return `matched edge ${g.e2s(e)} has non-zero slack=${slack(e)}` +
				   ` states=[${bloss.state(u)},${bloss.state(v)}] ` +
				   `z=[${z[u]},${z[v]}]`;
		}
	}
	return '';
}
