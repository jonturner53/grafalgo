/** @file wperfectE.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Matching from '../match/Matching.mjs';
import Blossoms from '../match/Blossoms.mjs';
import List from '../../dataStructures/basic/List.mjs';
import matchEG from '../match/matchEG.mjs';

let g             // shared copy of graph
let match;        // Matching object representing matching for graph
let bloss;        // Blossoms object representing blossoms and matching trees

let z;            // z[b] is dual variable for blossom (or vertex) b
let slack;        // slack[e] is slack in dual constraint for e
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

/** Compute a matching of specified size in a graph using Edmonds's algorithm.
 *  @param G is an undirected graph with weights
 *  @param size is the specified number of edges in the returned matching;
 *  0 can be used to specify a perfect matching
 *  giving a perfect matching)
 *  @param max is a flag, which if true, causes a max weight matching of the
 *  specified size to be computed (by default, a min weight matching of
 *  the specified size is returned)
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching object
 *  (if there is no matching of the specified size, the returned matching is
 *  one of maximum size and among all such matchings has minimum (or maximum)
 *  weight);
 *  ts is a possibly empty trace string and stats is a statistics object;
 *  if assertion-checking is enabled, the correctness of the solution is
 *  verified before returning
 */
export default function wperfectE(G, size=0, max=0, traceFlag=false) {
	g = G;
	if (!size) size = g.n/2;
	assert(size == Math.trunc(size));

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

	let Wmax = 0;
	if (max) { // complement weights
		for (let e = g.first(); e; e = g.next(e))
			Wmax = Math.max(Wmax,g.weight(e));
		for (let e = g.first(); e; e = g.next(e))
			g.weight(e, Wmax-g.weight(e));
	}

	for (let e = g.first(); e; e = g.next(e)) {
		slack[e] = g.weight(e);
		if (slack[e] == 0) q.enq(e);
	}

	if (trace) {
		traceString += `${g.toString(1)}`;
		traceString += `eligible: ${q.toString(e => g.e2s(e,0,1))}\n`;
	}

	while (true) {
		ea && assert(!verifyInvariant(size),
					 verifyInvariant(size) + traceString);
		while (match.size() < size && !q.empty()) {
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
					let state = +1; // add edges to q that are incident to
									// formerly odd blossoms used to form b
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
		if (match.size() == size) break;
		relabels++;
		if (!relabel()) break;
	}

	bloss.rematchAll(); // extend matching to blossoms and sub-blossoms

	// verify solution when assertion checking is enabled
	if (ea) {
		let s = verifyInvariant(size, true);
		assert(!s, `${s}\n${traceString}${match.toString()}\n` +
				   `${bloss.toString()}\n${statusString()}`);
	}

	if (max) { // restore original weights
		for (let e = g.first(); e; e = g.next(e))
			g.weight(e, Wmax-g.weight(e));
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
	match.add(e);

	// trace paths up to tree roots and update matching
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
	let d1 = Infinity; let d2 = Infinity; let d3 = Infinity;
	let smallOddBloss = 0; // odd n.t. outer blossom with smallest z[b]
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (bloss.state(b) == +1) {
			for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
				steps++;
				for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
					let v = g.mate(u,e); let V = bloss.outer(v);
					if (V == b) continue;
					let sV = bloss.state(V);
						 if (sV == 0) d1 = Math.min(d1, slack[e]);
					else if (sV == 1) d2 = Math.min(d2, slack[e]/2);
				}
			}
		} else if (bloss.state(b) == -1) {
			if (b > g.n && z[b] < d3) {
				d3 = z[b]; smallOddBloss = b;
			}
			steps++;
		}
	}

	let delta = Math.min(d1,d2,d3);

	if (trace) traceString += `relab(${d1} ${d2} ${d3})`;
	if (delta == Infinity || delta == 0 && !smallOddBloss) {
		if (trace) traceString += '\n';
		return false;
	}
	
	// adjust the z values for outer blossoms and slack values of outer edges
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (bloss.state(b) == +1) z[b] += delta;
		if (bloss.state(b) == -1) z[b] -= delta;
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

	if (delta == d3 && smallOddBloss) {
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
		if (s.length > 2 && delta == d3) traceString += `    ${s}\n`;
		s = bloss.blossoms2string(1);
		if (s.length > 2 && delta == d3) traceString += `    ${s}\n`;
	}
	return true;
}

/** Add edges incident to an even blossom to q.
 *  @param b is an even blossom or sub-blossom.
 */
function add2q(b) {
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

/** Return the slack of an edge.
 *  @param e is an edge in the graph
 *  @param zsum is an array that maps a blossom b to the sum of
 *  the z values for b and its ancestors in the blossom forest;
 *  if zsum is omitted, e is assumed to be an external edge.
 *  @param ncba is an array mapping an edge to the nearest common
 *  ancestor of its endpoints in the blossom forest
 *  @return the slack of e
function slack(e,zsum=0,ncba=0) {
	let s = g.weight(e) - (z[g.left(e)] + z[g.right(e)]);
	return !zsum ? s : s + zsum[ncba[e]];
}
 */

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

/** Verify that current primal and dual solutions are feasible.
 *  @param final is a flag that causes the entire matching to be checked;
 *  otherwise, only the matching in the outer graph is checked.
 */
function verifyInvariant(size, final=false) {
	let outer = (final ?
					0 : e => bloss.outer(g.left(e)) != bloss.outer(g.right(e))
				);
	let s = match.verify(outer); if (s) return s;
	s = bloss.verify();			 if (s) return s;

	// verify that dual variables of non-trivial blossoms are non-negative
	for (let b = g.n+1; b <= bloss.n; b++) {
		if (bloss.validBid(b) && z[b] < 0)
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
	if (size != g.n/2 || !final) return;

	// finally, verify termination condition
	if (match.size() != g.n/2) return `not a perfect matching`;

	if (dualObjective() != match.weight()) {
		return `dual objective = ${dualObj} does not equal ` +
			   `matching weight = ${match.weight()}`;
	}

	return '';
}

function dualObjective() {
	let dualObj = 0;
	for (let u = 1; u <= g.n; u++) dualObj += z[u];
	for (let B = g.n+1; B <= bloss.n; B++) {
		if (bloss.validBid(B)) dualObj += z[B]
	}
	return dualObj;
}
