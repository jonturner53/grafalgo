/** @file matchVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Matching from './Matching.mjs';
import Blossoms from './Blossoms.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

export default function matchVerify(g, match) {
	let s = match.verify(); if (s) return s;
	let optMatch = computeMatch(g);
	if (optMatch == null) return 'matchVerify: program error';
	if (optMatch.weight() != match.weight())
		return `matching's weight (${match.weight()}) does not equal ` +
			   `optimal value (${optMatch.weight()})`;
	return '';
}

let g             // shared copy of graph
let match;        // Matching object representing matching for graph
let bloss;        // Blossoms0 object representing blossoms and matching trees

let z;            // z[b] is dual variable for blossom (or vertex) b
let slack;        // slack[e] is slack of dual constraint for edge e
let q;            // list of tight edges with an even endpoint
let blist;        // temporary list of blossoms
let mark;         // temporary array of flags

/** Compute a maximum weighted matching in a graph using a
 *  Edmonds's weighted matching algorithm.
 *  @return a Matching object representing the max weight matching or
 *  null on error
 */
function computeMatch(mg) {
	g = mg;
	match = new Matching(g);
	bloss = new Blossoms(g, match, 1);
	z = new Float32Array(bloss.n+1);
	slack = new Float32Array(g.edgeRange+1);
	q = new List(g.edgeRange);
	blist = new List(bloss.n);
	mark = new Int8Array(bloss.n+1).fill(false);

	let maxwt = -Infinity;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxwt = Math.max(g.weight(e),maxwt);
	}
	z.fill(maxwt/2.0,1,g.n+1);

	for (let e = g.first(); e; e = g.next(e)) {
		slack[e] = maxwt - g.weight(e);
		if (slack[e] == 0) q.enq(e);
	}

	while (true) {
		while (!q.empty()) {
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
					augment(e); newPhase();
				} else {
					let [B,subs,sb] = bloss.addBlossom(e,A); z[B] = 0;
					let state = +1;
					for (let b = subs.first(); b; b = subs.next(b)) {
						if (state == -1) add2q(b);
						state = (b == sb ? +1 : -state);
					}
				}
			} else if (sV == 0) {
				let W = bloss.addBranch(e,v,V); add2q(W);
			}
		}
		if (relabel()) break;
	}
	bloss.rematchAll();
    return verifyInvariant ? match : null;
}


/** Augment the current matching, using the path found by findpath.
 *  @param e is an edge joining two even outer blossoms in distinct trees;
 *  the path joining the tree roots that passes through e
 *  is an augmenting path
 */
function augment(e) {
	match.add(e);
	let x = g.left(e); let X = bloss.outer(x);
	let [y,ee] = bloss.link(X);
	while (y) {
		if (match.contains(ee)) {
			match.drop(ee); bloss.base(X,x);
		} else {
			match.add(ee); bloss.base(X,y);
		}
		x = g.mate(y,ee); X = bloss.outer(x); [y,ee] = bloss.link(X);
	}
	bloss.base(X,x);

	x = g.right(e); X = bloss.outer(x); [y,ee] = bloss.link(X);
	while (y) {
		if (match.contains(ee)) {
			match.drop(ee); bloss.base(X,x);
		} else {
			match.add(ee); bloss.base(X,y);
		}
		x = g.mate(y,ee); X = bloss.outer(x); [y,ee] = bloss.link(X);
	}
	bloss.base(X,x);
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
	}
	while (!blist.empty()) {
		let b = blist.deq();
		let subs = bloss.expand(b); 
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			if (z[sb] == 0 && sb > g.n) blist.enq(sb);
		}
	}

	// set state and link for remaining blossoms 
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		bloss.state(b, match.at(bloss.base(b)) ? 0 : +1);
		bloss.link(b,[0,0])
	}
	// and add eligible edges to q
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b))
		if (bloss.state(b) == +1) add2q(b);
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
		}
	}

	let delta = Math.min(d1,d2,d3,d4);

	// adjust the dual variables for vertices
	for (let u = 1; u <= g.n; u++) {
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
		return true; // we have max weight matching
	}

	// now, add new even edges to q
	if (delta == d2 || delta == d3) {
		for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
			if (bloss.state(b) == +1) add2q(b)
		}
	}

	if (delta == d4) {
		// expand an odd blossom with zero z
		let subs = bloss.expandOdd(smallOddBloss);
		for (let b = subs.first(); b; b = subs.next(b)) {
			if (bloss.state(b) == +1) add2q(b);
		}
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

/** Verify that current primal and dual solutions are feasible.
 *  @param outer is a function that returns true if an edge e is outer;
 *  used to limit edges that are checked for matching consistency;
 *  since algorithm does not propagate matching changes to inner edges,
 *  this is needed to prevent spurious errors
 */
function verifyInvariant() {
	let s = match.verify(); if (s) return s;
	s = bloss.verify(); 	if (s) return s;

	// verify that dual variables are non-negative
	for (let b = 1; b <= bloss.n; b++) {
		if (z[b] < 0 && (b <= g.n || bloss.validBid(b)))
			return false;
	}

	// verify dual constraints for external edges
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		if (bloss.outer(u) == bloss.outer(v)) continue;
		let s = slack[e];
		if (s < 0) return false;
		if (match.contains(e) && s > 0) {
			return false;
		}
	}

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
			return false;
		}
		if (match.contains(e) && s > 0) {
			return false;
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
		return false;
	}
	for (let u = 1; u <= g.n; u++) {
		if (match.at(u) == 0 && z[u] != 0 )
			return false;
	}

	return true
}

//let g;            // shared copy of graph
//let match;        // Matching object representing matching for graph
//let bloss;        // Blossoms object representing blossoms and matching trees
//
//let z;            // z[b] is dual variable for blossom (or vertex) b
//let q;            // list of tight edges with an even endpoint
//let blist;        // temporary list of blossoms
//let mark;         // temporary array of flags
//
///** Compute a maximum weighted matching in a graph using a
// *  Edmonds's weighted matching algorithm.
// *  @param g is an undirected graph with weights
// *  @return a Matching object of maximum weight
// */
//function computeMatch(g0) {
//	g = g0;
//	match = new Matching(g);
//	bloss = new Blossoms(g, match, 1);
//	z = new Float32Array(bloss.n+1);
//	q = new List(g.edgeRange);
//	blist = new List(bloss.n);
//	mark = new Int8Array(bloss.n+1).fill(false);
//
//	let maxwt = -Infinity;
//	for (let e = g.first(); e; e = g.next(e)) {
//		if (Math.abs(g.weight(e)) < 1) {
//			// reduce potential for numerical issues
//			let scale = 2**20;
//			let w = Math.floor(g.weight(e)*scale) / scale;
//			g.weight(e,w);
//		}
//		maxwt = Math.max(g.weight(e),maxwt);
//	}
//	z.fill(maxwt/2.0,1,g.n+1);
//
//	for (let e = g.first(); e; e = g.next(e)) {
//		if (slack(e) == 0) q.enq(e);
//	}
//
//	while (true) {
//		while (!q.empty()) {
//			let e = q.deq();
//			let [u,v] = [g.left(e),g.right(e)];
//			let [U,V] = [bloss.outer(u),bloss.outer(v)];
//			let [sU,sV] = [bloss.state(U),bloss.state(V)];
//			if (U == V || sU + sV <= 0 || slack(e) > 0) continue;
//			// at least one even endpoint
//			if (sU + sV == 1 && sU == 0) {
//				[u,v] = [v,u]; [U,V] = [V,U]; [sU,sV] = [sV,sU];
//			}
//
//			// now U is even and V is even or unbound
//			if (sV == 0) {
//				let W = bloss.addBranch(e,v,V); add2q(W);
//				continue;
//			}
//			let A = nca(U,V);
//			if (A) {
//				let [B,subs,sb] = bloss.addBlossom(e,A); z[B] = 0;
//				let state = +1;
//				for (let b = subs.first(); b; b = subs.next(b)) {
//					if (state == -1) add2q(b);
//					state = (b == sb ? +1 : -state);
//				}
//			} else {
//				augment(e); newPhase();
//			}
//		}
//		if (relabel()) break;
//	}
//	bloss.rematchAll();
//    return (verifyInvariant() ? match : null);
//}
//
//
///** Augment the current matching, using the path found by findpath.
// *  @param e is an edge joining two even outer blossoms in distinct trees;
// *  the path joining the tree roots that passes through e
// *  is an augmenting path
// */
//function augment(e) {
//	// trace paths up to tree roots and update matching
//	match.add(e);
//	let x = g.left(e); let X = bloss.outer(x);
//	let [y,ee] = bloss.link(X);
//	while (y) {
//		if (match.contains(ee)) {
//			match.drop(ee); bloss.base(X,x);
//		} else {
//			match.add(ee); bloss.base(X,y);
//		}
//		x = g.mate(y,ee); X = bloss.outer(x); [y,ee] = bloss.link(X);
//	}
//	bloss.base(X,x);
//
//	x = g.right(e); X = bloss.outer(x); [y,ee] = bloss.link(X);
//	while (y) {
//		if (match.contains(ee)) {
//			match.drop(ee); bloss.base(X,x);
//		} else {
//			match.add(ee); bloss.base(X,y);
//		}
//		x = g.mate(y,ee); X = bloss.outer(x); [y,ee] = bloss.link(X);
//	}
//	bloss.base(X,x);
//}
//
///** Prepare for next phase, following an augmentation.
// *  Expand all outer blossoms with z==0, set states of remaining outer
// *  blossoms to unbound or even and their links to null.
// *  Put all vertices in even blossoms into queue of even vertices.
// */
//function newPhase() {
//	// expand non-trivial outer blossoms with z == 0
//	q.clear(); blist.clear();
//	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
//		if (z[b] == 0 && b > g.n) blist.enq(b);
//	}
//	while (!blist.empty()) {
//		let b = blist.deq();
//		let subs = bloss.expand(b); 
//		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
//			if (z[sb] == 0 && sb > g.n) blist.enq(sb);
//		}
//	}
//
//	// set state and link for remaining blossoms and add their
//	// eligible edges to q
//	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
//		bloss.state(b, match.at(bloss.base(b)) ? 0 : +1);
//		bloss.link(b,[0,0])
//		if (bloss.state(b) == +1) add2q(b);
//	}
//}
//
///** Adjust the labels for the vertices and blossoms.
// *  This is a brute-force version, using no special data structures.
// *  Takes O(m) time.
// *  @return tuple true if we have a max weight matching, else false
// */
//function relabel() {
//	let d1 = Infinity;
//	for (let u = 1; u <= g.n; u++) {
//		if (bloss.state(bloss.outer(u)) == +1) d1 = Math.min(d1, z[u]);
//	}
//	if (d1 == Infinity) d1 = 0;
//
//	let d2 = Infinity; let d3 = Infinity; let d4 = Infinity;
//	let smallOddBloss = 0; // odd blossom with smallest z[b]
//	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
//		if (bloss.state(b) == +1) {
//			for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
//				for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
//					let v = g.mate(u,e); let V = bloss.outer(v);
//					if (V == b) continue;
//					let sV = bloss.state(V);
//						 if (sV == 0) d2 = Math.min(d2, slack(e));
//					else if (sV == 1) d3 = Math.min(d3, slack(e)/2);
//				}
//			}
//		} else if (b > g.n && bloss.state(b) == -1) {
//			if (z[b]/2 < d4) {
//				d4 = z[b]/2; smallOddBloss = b;
//			}
//		}
//	}
//
//	let delta = Math.min(d1,d2,d3,d4);
//
//	// adjust the z values for vertices and outer blossoms
//	for (let u = 1; u <= g.n; u++) {
//		if (bloss.state(bloss.outer(u)) == +1) z[u] -= delta;
//		if (bloss.state(bloss.outer(u)) == -1) z[u] += delta;
//	}
//
//	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
//		if (b <= g.n) continue;
//		if (bloss.state(b) == +1) z[b] += 2*delta;
//		if (bloss.state(b) == -1) z[b] -= 2*delta;
//	}
//
//	if (delta == d1) return true; // we have max weight matching
//
//	// now, add new even edges to q
//	if (delta == d2 || delta == d3) {
//		for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
//			if (bloss.state(b) == +1) add2q(b)
//		}
//	}
//
//	if (delta == d4) {
//		// expand an odd blossom with zero z
//		let subs = bloss.expandOdd(smallOddBloss); 
//		for (let b = subs.first(); b; b = subs.next(b)) {
//			if (bloss.state(b) == +1) add2q(b);
//		}
//	}
//	return false;
//}
//
///** Add edges incident to an even blossom to q.
// *  @param b is an even blossom or sub-blossom.
// */
//function add2q(b,limit=false) {
//	let B = bloss.outer(b);
//	for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
//		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
//			let v = g.mate(u,e); let V = bloss.outer(v);
//			if (bloss.state(V) >= 0 && V != B &&
//				slack(e) == 0 && !q.contains(e)) {
//				q.enq(e);
//			}
//		}
//	}
//}
//
///** Return the slack of an edge.
// *  @param e is an edge in the graph
// *  @param zsum is an array that maps a blossom b to the sum of
// *  the z values for b and its ancestors in the blossom forest;
// *  if z is omitted, e is assumed to be an external edge.
// *  @param ncba is an array mapping an edge to the nearest common
// *  ancestor of its endpoints in the blossom forest
// *  @return the slack of e
// */
//function slack(e,zsum=0,ncba=0) {
//	let s = z[g.left(e)] + z[g.right(e)] - g.weight(e);
//	return !zsum ? s : s + zsum[ncba[e]];
//}
//
///** Find the nearest common ancestor of two vertices in
// *  the current graph.
// *  To avoid excessive search time, search upwards from both vertices in
// *  parallel, using mark bits to identify the nca. Before returning,
// *  clear the mark bits by traversing the paths a second time.
// *  @param U is an outer blossom
// *  @param V is another outer blossom
// *  @returns the nearest common ancestor of u and v or 0 if none
// */
//function nca(U, V) {
//	let result;
//	// first pass to find the nca
//	let X = U; let [x,ex] = bloss.link(X);
//	let Y = V; let [y,ey] = bloss.link(Y);
//	while (true) {
//		if (X == Y) { result = X; break; }
//		if (mark[X]) { result = X; break; }
//		if (mark[Y]) { result = Y; break; }
//		if (!x && !y) { result = 0; break; }
//		if (x) {
//			mark[X] = true;
//			X = bloss.outer(g.mate(x,ex)); [x,ex] = bloss.link(X);
//		}
//		if (y) {
//			mark[Y] = true;
//			Y = bloss.outer(g.mate(y,ey)); [y,ey] = bloss.link(Y);
//		}
//	}
//	// second pass to clear mark bits
//	X = U; [x,ex] = bloss.link(X);
//	while (mark[X]) {
//		mark[X] = false;
//		X = bloss.outer(g.mate(x,ex)); [x,ex] = bloss.link(X);
//	}
//	Y = V; [y,ey] = bloss.link(Y);
//	while (mark[Y]) {
//		mark[Y] = false;
//		Y = bloss.outer(g.mate(y,ey)); [y,ey] = bloss.link(Y);
//	}
//	return result;
//}
//
//
///** Verify that current primal and dual solutions are feasible.
// *  and that termination condition holds.
// *  @return true on success, false on failure.
// */
//function verifyInvariant() {
//	if (match.verify()) return false;
//	if (bloss.verify()) return false;
//
//	// verify that dual variables are non-negative
//	for (let b = 1; b <= bloss.n; b++) {
//		if (z[b] < 0 && (b <= g.n || bloss.validBid(b)))
//			return false;
//	}
//
//	// verify dual constraints for external edges
//	for (let e = g.first(); e; e = g.next(e)) {
//		let [u,v] = [g.left(e),g.right(e)];
//		if (bloss.outer(u) == bloss.outer(v)) continue;
//		let s = slack(e);
//		if (s < 0) return 'matchVerify: program error';
//		if (match.contains(e) && s > 0) {
//			return false;
//		}
//	}
//
//	// for non-trivial blossoms b, compute
//	// zsum[b] = sum of z values for b and its blossom ancestors
//	let zsum = new Int32Array(bloss.n+1);
//	let q = new List(bloss.n);
//	for (let B = bloss.firstOuter(); B; B = bloss.nextOuter(B)) {
//		if (B <= g.n) continue;
//		zsum[B] = z[B];
//		q.enq(B);
//		while (!q.empty()) {
//			let b = q.deq();
//			for (let bb = bloss.firstSub(b); bb; bb = bloss.nextSub(bb)) {
//				if (bb <= g.n) continue;
//				zsum[bb] = z[bb] + zsum[b];
//				q.enq(bb);
//			}
//		}
//	}
//	let ncba = bloss.ncba();
//
//	// now verify dual constraints for all internal edges
//	for (let e = g.first(); e; e = g.next(e)) {
//		let [u,v] = [g.left(e),g.right(e)];
//		if (bloss.outer(u) != bloss.outer(v)) continue;
//		let s = slack(e,zsum,ncba);
//		if (s < 0) return false;
//		if (match.contains(e) && s > 0) return false;
//	}
//
//	// finally, verify termination condition
//	let dualObj = 0;
//	for (let u = 1; u <= g.n; u++) dualObj += z[u];
//	for (let B = g.n+1; B <= bloss.n; B++) {
//		if (bloss.validBid(B))
//			dualObj += z[B] * (bloss.blossomSize(B)-1)/2;
//	}
//	if (dualObj != match.weight()) {
//		return false;
//	}
//	for (let u = 1; u <= g.n; u++) {
//		if (match.at(u) == 0 && z[u] != 0 )
//			return false;
//	}
//
//	return true;
//}
