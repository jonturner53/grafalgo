/** @file wmatchE.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Matching from './Matching.mjs';
import Blossoms from './Blossoms.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

let g             // shared copy of graph
let match;        // Matching object representing matching for graph
let bloss;        // Blossoms0 object representing blossoms and matching trees

let z;            // z[b] is dual variable for blossom (or vertex) b
let slack;        // slack[e] is slack of dual constraint for edge e
let q;            // list of tight edges with an even endpoint
let blist;        // temporary list of blossoms
let mark;         // temporary array of flags

let trace;
let traceString;

let phases;		// number of phases
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
 *  and stats is a statistics object; if assertion-checking is enabled,
 *  the correctness of the solution is verified before returning
 */
export default function wmatchE(mg, traceFlag=false) {
	g = mg;
	match = new Matching(g);
	bloss = new Blossoms(g, match, 1);
	z = new Float32Array(bloss.n+1);
	slack = new Float32Array(g.edgeRange+1);
	q = new List(g.edgeRange);
	blist = new List(bloss.n);
	mark = new Int8Array(bloss.n+1).fill(false);

	trace = traceFlag; traceString = '';
	phases = branches = blossoms = deblossoms = relabels = 0;
	steps = g.n + g.edgeRange;

	let maxwt = -Infinity;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxwt = Math.max(g.weight(e),maxwt);
	}
	if (maxwt == 0)
		return [match, trace ? 'no positive weights' : '', {'weight':0}];
	z.fill(maxwt/2.0,1,g.n+1);

	for (let e = g.first(); e; e = g.next(e)) {
		slack[e] = maxwt - g.weight(e);
		if (slack[e] == 0) q.enq(e);
	}

	if (trace) {
		traceString += `${g.toString(1)}`;
		traceString += `eligible: ${q.toString(e => g.e2s(e,0,1))}\n`;
	}

	while (true) {
		ea && assert(!verifyInvariant(), verifyInvariant() + traceString);
		while (!q.empty()) {
			steps++;
			let e = q.deq();
			let [u,v] = [g.left(e),g.right(e)];
			let [U,V] = [bloss.outer(u),bloss.outer(v)];
			let [sU,sV] = [bloss.state(U),bloss.state(V)];
			if (U == V || sU + sV <= 0 || slack[e] > 0) continue;
			// at least one even endpoint
			if (sU + sV == 1 && sU == 0) {
				[u,v] = [v,u]; [U,V] = [V,U]; [sU,sV] = [sV,sU];
			}

			// now e is tight, U is even and V is even or unbound
			if (sV == +1) {
				let A = nca(U,V);
				if (A == 0) {
					augment(e); newPhase(); phases++;
				} else {
					blossoms++;
					let [B,subs,sb] = bloss.addBlossom(e,A); z[B] = 0;
					let state = +1;
					for (let b = subs.first(); b; b = subs.next(b)) {
						if (state == -1) add2q(b);
						state = (b == sb ? +1 : -state);
					}
					if (trace) {
						traceString += `blossom: ${g.e2s(e)} ${bloss.x2s(A)} ` +
									   `${bloss.x2s(B)}[`
						let [lv,ee] = bloss.link(subs.last());
						lv = g.mate(lv,ee);
						for (let sb = subs.first(); sb; sb = subs.next(sb)) {
							let [rv,ee] = bloss.link(sb);
							traceString += (sb == subs.first() ? '' : ' ') +
											bloss.pathItem2string(lv,sb,rv);
							[lv,ee] = bloss.link(sb); lv = g.mate(lv,ee);
						}
						traceString += ']\n';
						let s = bloss.trees2string(1);
						if (s.length > 2) traceString += `    ${s}\n`;
					}
				}
			} else if (sV == 0) {
				let W = bloss.addBranch(e,v,V); add2q(W);
				if (trace) {
					traceString += `branch: ${bloss.pathItem2string(0,U,u)} `;
					traceString += bloss.pathItem2string(v,V,bloss.base(V));
					let bW = bloss.base(W);
					traceString += ` ${bloss.pathItem2string(bW,W,0)}\n`;
				}
				branches++;
			}
		}
		relabels++;
		if (relabel()) break;
	}

	bloss.rematchAll();
		// make matching consistent without expanding remaining blossoms
		// this allows the correctness of the solution to be fully verified
		// before returning

	// verify solution when assertion checking is enabled
	if (ea) {
		let s = verifyInvariant(true);
		assert(!s, `${s}\n${traceString}${match.toString()}\n` +
				   `${bloss.toString()}\n${statusString()}`);
	}
	
	if (trace) {
		traceString += `final matching:\n    ${match.toString()}\n`;
	}
	steps += bloss.getStats().steps;

    return [match, traceString,
			{'weight':match.weight(), 'phases': phases, 'branches': branches,
			 'blossoms': blossoms, 'relabels': relabels,
			 'deblossoms': deblossoms, 'steps': steps}];
}


/** Augment the current matching, using the path found by findpath.
 *  @param e is an edge joining two even outer blossoms in distinct trees;
 *  the path joining the tree roots that passes through e
 *  is an augmenting path
 */
function augment(e) {
	let ts = ''; let trees = '';
	if (trace) trees = bloss.trees2string(1);

	// trace paths up to tree roots and update matching
	match.add(e);
	let x = g.left(e); let X = bloss.outer(x);
	let [y,ee] = bloss.link(X);
	while (y) {
		steps++;
		if (match.contains(ee)) {
			match.drop(ee); bloss.base(X,x);
		} else {
			match.add(ee); bloss.base(X,y);
		}
		if (trace) ts = `${bloss.pathItem2string(x,X,y)}${(ts?' ':'') + ts}`;
		x = g.mate(y,ee); X = bloss.outer(x); [y,ee] = bloss.link(X);
	}
	bloss.base(X,x);
	if (trace) ts = `${bloss.pathItem2string(0,X,x)}${(ts?' ':'') + ts}--`;

	x = g.right(e); X = bloss.outer(x); [y,ee] = bloss.link(X);
	while (y) {
		steps++;
		if (match.contains(ee)) {
			match.drop(ee); bloss.base(X,x);
		} else {
			match.add(ee); bloss.base(X,y);
		}
		if (trace) ts += `${bloss.pathItem2string(x,X,y)} `;
		x = g.mate(y,ee); X = bloss.outer(x); [y,ee] = bloss.link(X);
	}
	bloss.base(X,x);
	if (trace) {
		let [u,v] = [g.left(e),g.right(e)];
		let [U,V] = [bloss.outer(u),bloss.outer(v)];
		if (!bloss.link(U)[0] && !bloss.link(V)[0]) {
			traceString += `augment: ${g.e2s(e)} ${ts}` +
						   `${bloss.pathItem2string(x,X,0)}\n`;
		} else {
			traceString += `augment: ${g.e2s(e)}\n`;
			if (trees.length > 2) traceString += `    ${trees}\n`;
			traceString += `    ${ts}${bloss.pathItem2string(x,X,0)}\n`;
			traceString += `    ${match.toString(
				e => bloss.outer(g.left(e)) != bloss.outer(g.right(e)))}\n`
		}
	}
}

/** Prepare for next phase, following an augmentation.
 *  Expand all outer blossoms with z==0, set states of remaining outer
 *  blossoms to unbound or even and their links to null.
 *  Put all vertices in even blossoms into queue of even vertices.
 */
function newPhase() {
	// expand non-trivial outer blossoms with z == 0
	q.clear(); blist.clear();
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (z[b] == 0 && b > g.n) blist.enq(b);
		steps++;
	}
	while (!blist.empty()) {
		let b = blist.deq();
		let subs = bloss.expand(b); 
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			if (z[sb] == 0 && sb > g.n) blist.enq(sb);
			steps++;
		}
	}

	// set state and link for remaining blossoms 
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		bloss.state(b, match.at(bloss.base(b)) ? 0 : +1);
		bloss.link(b,[0,0])
		steps++;
	}
	// and add eligible edges to q
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b))
		if (bloss.state(b) == +1) add2q(b);
	if (trace) {
		let s = bloss.blossoms2string(1);
		if (s.length > 2) traceString += `    ${s}\n`;
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
	let smallOddBloss = 0; // odd blossom with smallest z[b]
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (bloss.state(b) == +1) {
			for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
				steps++;
				for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
					let v = g.mate(u,e); let V = bloss.outer(v);
					if (V == b) continue;
					let sV = bloss.state(V);
						 if (sV == 0) d2 = Math.min(d2, slack[e]);
					else if (sV == 1) d3 = Math.min(d3, slack[e]/2);
				}
			}
		} else if (b > g.n && bloss.state(b) == -1) {
			if (z[b]/2 < d4) {
				d4 = z[b]/2; smallOddBloss = b;
			}
			steps++;
		}
	}

	let delta = Math.min(d1,d2,d3,d4);

	if (trace) traceString += `relab(${d1} ${d2} ${d3} ${d4})`;
	
	// adjust the dual variables for vertices
	for (let u = 1; u <= g.n; u++) {
		steps++;
		if (bloss.state(bloss.outer(u)) == +1) z[u] -= delta;
		if (bloss.state(bloss.outer(u)) == -1) z[u] += delta;
	}

	// adjust dual variables for outer blossoms and
	// slacks of outer edge constraints (slacks for inner edges don't change)
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (b > g.n) {
			if (bloss.state(b) == +1) z[b] += 2*delta;
			if (bloss.state(b) == -1) z[b] -= 2*delta;
		}
		for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
			for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
				steps++;
				if (u != g.left(e)) continue;
				let v = g.right(e); let V = bloss.outer(v);
				if (b == V) continue;
				let ss = bloss.state(b) + bloss.state(V);
				slack[e] -= ss * delta;
				if (slack[e] == 0 && !q.contains(e))
					ss == 2 ? q.push(e) : q.enq(e);
			}
		}
	}

	if (delta == d1) {
		if (trace) traceString += ' and finished\n';
		return true; // we have max weight matching
	}

	// now, add new even edges to q
	if (delta == d2 || delta == d3) {
		for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
			if (bloss.state(b) == +1) add2q(b)
			steps++;
		}
	}

	if (delta == d4) {
		// expand an odd blossom with zero z
		let subs = bloss.expandOdd(smallOddBloss); deblossoms++;
		for (let b = subs.first(); b; b = subs.next(b)) {
			if (bloss.state(b) == +1) add2q(b);
			steps++;
		}
		if (trace) {
			traceString += ` ${bloss.x2s(smallOddBloss)}` +
						   `[${subs.toString(b => bloss.x2s(b))}]`
		}
	}
	if (trace) {
		traceString += `\n    ${q.toString(e => g.e2s(e,0,1))}\n`;
		let s = bloss.trees2string(1);
		if (s.length > 2 && delta == d4) traceString += `    ${s}\n`;
		s = bloss.blossoms2string(1);
		if (s.length > 2 && delta == d4) traceString += `    ${s}\n`;
	}

	return false;
}

/** Add edges incident to an even blossom to q.
 *  @param b is an even blossom or sub-blossom.
 */
function add2q(b,limit=false) {
	let B = bloss.outer(b);
	for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			let v = g.mate(u,e); let V = bloss.outer(v);
			if (bloss.state(V) >= 0 && V != B && slack[e] == 0) {
				if (bloss.state(V) == 0 && !q.contains(e))
					q.enq(e);
				if (bloss.state(V) == +1) {
					if (q.contains(e)) q.delete(e);
					q.push(e);
					// put ee edges at front of queue
					// eu edges at back
				}
			}
			steps++;
		}
	}
}

/** Find the nearest common ancestor of two vertices in
 *  the current graph.
 *  To avoid excessive search time, search upwards from both vertices in
 *  parallel, using mark bits to identify the nca. Before returning,
 *  clear the mark bits by traversing the paths a second time.
 *  @param U is an outer blossom
 *  @param V is another outer blossom
 *  @returns the nearest common ancestor of u and v or 0 if none
 */
function nca(U, V) {
	let result;
	// first pass to find the nca
	let X = U; let [x,ex] = bloss.link(X);
	let Y = V; let [y,ey] = bloss.link(Y);
	while (true) {
		steps++;
		if (X == Y) { result = X; break; }
		if (mark[X]) { result = X; break; }
		if (mark[Y]) { result = Y; break; }
		if (!x && !y) { result = 0; break; }
		if (x) {
			mark[X] = true;
			X = bloss.outer(g.mate(x,ex)); [x,ex] = bloss.link(X);
		}
		if (y) {
			mark[Y] = true;
			Y = bloss.outer(g.mate(y,ey)); [y,ey] = bloss.link(Y);
		}
	}
	// second pass to clear mark bits
	X = U; [x,ex] = bloss.link(X);
	while (mark[X]) {
		mark[X] = false;
		X = bloss.outer(g.mate(x,ex)); [x,ex] = bloss.link(X);
	}
	Y = V; [y,ey] = bloss.link(Y);
	while (mark[Y]) {
		mark[Y] = false;
		Y = bloss.outer(g.mate(y,ey)); [y,ey] = bloss.link(Y);
	}
	return result;
}

function statusString() {
	let s = 'complete state\nmatch:' + match.toString() + '\nbloss:' + 
			bloss.toString(1) + '\n';
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

/** Check termination conditions. */
function checkTerm() {
	let dualObj = 0;
	for (let u = 1; u <= g.n; u++) dualObj += z[u];
	for (let B = g.n+1; B <= bloss.n; B++) {
		if (bloss.validBid(B))
			dualObj += z[B] * (bloss.blossomSize(B)-1)/2;
	}
	if (dualObj != match.weight()) {
		return `dual objective = ${dualObj} does not equal ` +
			   `matching weight = ${match.weight()}`;
	}
	for (let u = 1; u <= g.n; u++) {
		if (match.at(u) == 0 && z[u] != 0 )
			return `unmatched vertex with z[${g.x2s(u)}] = ${z[u]}`;
	}
}

/** Verify that current primal and dual solutions are feasible.
 *  @param final is a flag indicating that a final verification is required
 *  @return an error message if the invariant is not satisfied, else ''.
 */
function verifyInvariant(final=false) {
	let outer =
		(final ? 0 : e => bloss.outer(g.left(e)) != bloss.outer(g.right(e)));
	let s = match.verify(outer);
	if (s) return s;
	s = bloss.verify(); if (s) return s;

	// verify that dual variables are non-negative
	for (let b = 1; b <= bloss.n; b++) {
		if (z[b] < 0 && (b <= g.n || bloss.validBid(b)))
			return `z[${bloss.x2s(b)}]=${z[b]} < 0`;
	}

	// verify dual constraints for external edges
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		if (bloss.outer(u) == bloss.outer(v)) continue;
		let s = slack[e];
		if (s < 0) return `edge ${g.e2s(e)} has negative slack=${s} `;
		if (match.contains(e) && s > 0) {
			return `matched edge ${g.e2s(e)} has non-zero slack=${s}`;
		}
	}
	if (!final) return;

	// for non-trivial blossoms b, compute
	// zsum[b] = sum of z values for b and its blossom ancestors
	let zsum = new Int32Array(bloss.n+1);
	let q = new List(bloss.n);
	for (let B = bloss.firstOuter(); B; B = bloss.nextOuter(B)) {
		if (B <= g.n) continue;
		zsum[B] = z[B];
		q.enq(B);
		while (!q.empty()) {
			let b = q.deq();
			for (let bb = bloss.firstSub(b); bb; bb = bloss.nextSub(bb)) {
				if (bb <= g.n) continue;
				zsum[bb] = z[bb] + zsum[b];
				q.enq(bb);
			}
		}
	}
	let ncba = bloss.ncba();

	// now verify dual constraints for all internal edges
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		if (bloss.outer(u) != bloss.outer(v)) continue;
		let s = slack[e];
		if (s < 0) {
			return `edge ${g.e2s(e)} has negative slack=${s} `;
		}
		if (match.contains(e) && s > 0) {
			return `matched edge ${g.e2s(e)} has non-zero slack=${s}` +
				   ` z[left]=${z[g.left(e)]} z[right]=${z[g.right(e)]}` +
				   ` ncba[e]=${ncba[e]} + ${bloss.toString()}`;
		}
	}

	// finally, verify termination condition
	let dualObj = 0;
	for (let u = 1; u <= g.n; u++) dualObj += z[u];
	for (let B = g.n+1; B <= bloss.n; B++) {
		if (bloss.validBid(B))
			dualObj += z[B] * (bloss.blossomSize(B)-1)/2;
	}
	if (dualObj != match.weight()) {
		return `dual objective = ${dualObj} does not equal ` +
			   `matching weight = ${match.weight()}`;
	}
	for (let u = 1; u <= g.n; u++) {
		if (match.at(u) == 0 && z[u] != 0 )
			return `unmatched vertex with z[${g.x2s(u)}] = ${z[u]}`;
	}

	return '';
}
