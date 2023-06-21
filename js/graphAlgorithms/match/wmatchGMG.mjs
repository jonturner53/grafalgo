/** @file wmatchGMG.mjs
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
import GroupHeap from '../../dataStructures/specialty/GroupHeap.mjs';

let g=null;       // shared copy of graph
let match;        // Matching object representing matching for graph
let bloss;        // Blossoms object representing blossoms and matching trees

let z;            // z[b] is dual variable for blossom (or vertex) b
let bq;           // temporary list of blossoms
let mark;         // temporary array of flags

let ovh;          // heap of odd vertices, with key[u]=z[u]
let evh;          // heap of even vertices, with key[u]=z[u]
let obh;          // heap of odd outer blossoms, with key[b]=z[b]/2
let ebh;          // heap of even outer blossoms, with key[b]=z[b]/2

let eeh;          // heap of edges with two even endpoints
				  // key(e) = slack(e)/2
let exh;          // GroupHeap object containing a group of edges incident
				  // to each odd or unbound blossom, key(e) = slack(e)
let firstVertex;  // firstVertex[b] is first vertex in blossom b

let trace;
let traceString;

let phases;     // number of phases
let branches;   // number of new branches formed
let blossoms;   // number of blossoms formed
let relabels;   // number of relabeling operations
let deblossoms; // number of odd blossoms expanded
let steps;      // total number of steps

/** Compute a maximum weighted matching in a graph using a simplified
 *  version of Galil, Micali and Gabows' implementation of Edmonds's
 *  weighted matching algorithm.
 *  @param g is an undirected graph with weights
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is an array
 *  matching a vertex u to its matched edge match[u] or 0 if u
 *  is unmatched; ts is a possibly empty trace string
 *  and stats is a statistics object xx
 */
export default function wmatchGMG(mg, traceFlag=false) {
	g = mg;
	match = new Matching(g);
	bloss = new Blossoms(g, match, 2);
	z = new Float32Array(bloss.n+1);
	bq = new List(bloss.n);
	mark = new Int8Array(bloss.n+1).fill(false);
	
	ovh = new ArrayHeap(g.n);
	evh = new ArrayHeap(g.n);
	obh = new ArrayHeap(bloss.n);
	ebh = new ArrayHeap(bloss.n);
	eeh = new ArrayHeap(g.edgeRange);
	exh = new GroupHeap(g.edgeRange+g.n, bloss.n);
	firstVertex = new Int32Array(bloss.n+1);

	trace = traceFlag; traceString = '';

	phases = branches = blossoms = deblossoms = relabels = 0;
	steps = g.n + g.edgeRange;

	let maxwt = -Infinity;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxwt = Math.max(g.weight(e),maxwt);
	}
	z.fill(maxwt/2.0,1,g.n+1);

	for (let u = 1; u <= g.n; u++) {
		evh.insert(u,z[u]); firstVertex[u] = u;
	}
	for (let e = g.first(); e != 0; e = g.next(e)) {
		eeh.insert(e,slack(e)/2);
	}

	if (trace) {
		traceString += `${g.toString(1)}eligible: ${eligibleEdgeString()}\n`;
	}

	let finished = false;
	while (!finished) {
		ea && assert(!verifyInvariant(), verifyInvariant());

		// process eligible edges with an even endpoint
		while (true) {
			steps++;

			let ee = eeh.findmin();
			let eu = exh.findmin();
			if (ee && eeh.key(ee) == 0) {
				eeh.delete(ee)
				let [u,v] = [g.left(ee),g.right(ee)];
				let [U,V] = [bloss.outer(u),bloss.outer(v)];
				if (U == V) continue;
				let A = nca(U,V);
				if (A == 0) {
					// augment matching and prepare for next phase
					augment(ee); newPhase();
					continue;
				}

				// add new blossom
				let [B,subs] = bloss.addBlossom(ee,A);
				z[B] = 0; ebh.insert(B,0);
				firstVertex[B] = firstVertex[subs.first()];

				// now update heaps for former outer blossoms
				for (let b = subs.first(); b; b = subs.next(b)) {
					if (b > g.n && ebh.contains(b)) {
						// b no longer an outer blossom, but its vertices
						// are still even
						z[b] = 2*ebh.key(b); ebh.delete(b);
					} if (b >  g.n && obh.contains(b) ||
						  b <= g.n && ovh.contains(b)) {
						if (b > g.n) {
							z[b] = 2*obh.key(b); obh.delete(b);
						}
						for (let u = bloss.firstIn(b); u;
									 u = bloss.nextIn(b,u)) {
							z[u] = ovh.key(u); ovh.delete(u);
							evh.insert(u, z[u]);
						}
						exh.clear(b); addEXedges(b)
					}
				}
				if (trace) {
					traceString += `blossom: ${g.e2s(ee)} ${bloss.x2s(A)} ` +
								   `${bloss.x2s(B)}` +
								   `${subs.toString(x => bloss.x2s(x))}\n`;
					let s = bloss.trees2string(1);
					if (s.length > 2)
						traceString += `	${s}\n`;
				}
				blossoms++;
			} else if (eu && eu <= g.edgeRange) {
				let [u,v] = [g.left(eu),g.right(eu)];
				let [U,V] = [bloss.outer(u),bloss.outer(v)];
				if (bloss.state(U) != +1) [u,v,U,V] = [v,u,V,U];
				if (exh.key(eu, V) != 0) break;
				let W = bloss.addBranch(eu,v,V);

				// update heaps
				if (V > g.n)
					obh.insert(V, z[V]/2);
				for (let u = bloss.firstIn(V); u; u = bloss.nextIn(V,u))
					ovh.insert(u,z[u]);
				exh.delete(eu, V); exh.deactivate(V);

				if (W > g.n) ebh.insert(W, z[W]/2);
				for (let u = bloss.firstIn(W); u; u = bloss.nextIn(W,u))
					evh.insert(u,z[u]);
				exh.clear(W); addEXedges(W);
				branches++;

				if (trace) {
					traceString +=
						`branch: ${bloss.x2s(U)}-${g.e2s(eu,0,1)}-` +
								`${bloss.x2s(V)}-` +
								`${g.e2s(match.at(bloss.base(V)),0,1)}-` +
								`${bloss.x2s(W)}\n`;
				}
			} else {
				break;
			}
		}

		// adjust vertex/blossom labels, creating more eligible edges
		// and/or reducing number of vertices in odd blossoms
		relabels++; finished = relabel();
	}

	bloss.rematchAll(); // make matching consistent

	// verify solution when assertion checking is enabled
	if (ea) {
		let s = verifyInvariant(true);
		assert(!s, `${s}\n${traceString}${match.toString()}\n` +
				   `${bloss.toString()}\n${statusString()}`);
	}

	if (trace) {
		traceString += `final matching: ${match.toString()}\n`;
	}
	steps += bloss.getStats().steps; +
			 obh.getStats().steps + ebh.getStats().steps +
			 ovh.getStats().steps + evh.getStats().steps +
			 exh.getStats().steps + eeh.getStats().steps;

	return [match, traceString,
			{'weight': match.weight(), 'phases': phases, 'branches': branches,
			 'blossoms': blossoms, 'relabels': relabels,
			 'deblossoms': deblossoms, 'steps': steps}];
}


/** Return the slack of an edge.
 *  @param e is an edge in the graph
 *  @param zsum is an array that maps a blossom b to the sum of
 *  the z values for b and its ancestors in the blossom forest;
 *  if z is omitted, e is assumed to be an external edge.
 *  @param ncba is an array mapping an edge to the nearest common
 *  ancestor of its endpoints in the blossom forest
 *  @return the slack of e
 */
function slack(e,zsum=0,ncba=0) {
	let s = zz(g.left(e)) + zz(g.right(e)) - g.weight(e);
	return !zsum ? s : s + zsum[ncba[e]];
}

/** Get the corrected z value of a blossom.
 *  @param b is a blossom (possibly trivial)
 *  @return the corrected value of z; if b is in a blossom heap,
 *  the key in the heap is its corrected value.
 */
function zz(b) {
	if (b <= g.n) {
		return evh.contains(b) ? evh.key(b) :
			   (ovh.contains(b) ? ovh.key(b) : z[b]);
	} else {
		return ebh.contains(b) ? 2*ebh.key(b) :
			   (obh.contains(b) ? 2*obh.key(b) : z[b]);
	}
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
		if (trace) ts = `${g.e2s(ee,0,1)}-${bloss.x2s(X)}-${ts}`
		x = g.mate(y,ee); X = bloss.outer(x); [y,ee] = bloss.link(X);
	}
	bloss.base(X,x);
	if (trace) ts = `${bloss.x2s(X)}-${ts}${g.e2s(e,0,1)}!-`

	x = g.right(e); X = bloss.outer(x); [y,ee] = bloss.link(X);
	while (y) {
		steps++;
		if (match.contains(ee)) {
			match.drop(ee); bloss.base(X,x);
		} else {
			match.add(ee); bloss.base(X,y);
		}
		if (trace) { ts += `${bloss.x2s(X)}-${g.e2s(ee,0,1)}-`; }
		x = g.mate(y,ee); X = bloss.outer(x); [y,ee] = bloss.link(X);
	}
	bloss.base(X,x);
	if (trace) {
		let [u,v] = [g.left(e),g.right(e)];
		let [U,V] = [bloss.outer(u),bloss.outer(v)];
		if (!bloss.link(U)[0] && !bloss.link(V)[0]) {
			traceString += `augment: ${g.e2s(e)} ${ts}${bloss.x2s(X)}\n`;
		} else {
			traceString += `augment: ${g.e2s(e)}\n`;
			if (trees.length > 2) traceString += `	${trees}\n`;
			traceString += `	${ts}${bloss.x2s(X)}\n`;
			traceString += `	${match.toString(
				e => bloss.outer(g.left(e)) != bloss.outer(g.right(e)))}\n`
		}
	}
}

/** Prepare for next phase, following an augmentation.
 *  Expand all outer blossoms with z==0, set states of remaining outer
 *  blossoms to unbound or even and their links to null.
 */
function newPhase() {
	// expand outer blossoms with z == 0 (note: these are even)
	phases++;
	bq.clear();
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (zz(b) == 0) bq.enq(b);  // note: b must be even
		steps++;
	}
	while (!bq.empty()) {
		let b = bq.deq();
		let subs = bloss.expand(b); 
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			if (zz(sb) == 0 && sb > g.n) bq.enq(sb);
			steps++;
		}
	}

	// set states/links of remaining outer blossoms based on matching status
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		bloss.state(b, match.at(bloss.base(b)) ? 0 : +1); bloss.link(b,[0,0]);
		steps++;
	}

	// rebuild the heaps from scratch
	// update the z variables while clearing the vertex and blossom heaps
	for (let u = evh.findmin(); u; u = evh.findmin()) {
		z[u] = evh.key(u); evh.delete(u); steps++;
	}
	for (let u = ovh.findmin(); u; u = ovh.findmin(u)) {
		z[u] = ovh.key(u); ovh.delete(u); steps++;
	}
	for (let b = ebh.findmin(); b; b = ebh.findmin(b)) {
		z[b] = 2*ebh.key(b); ebh.delete(b); steps++;
	}
	for (let b = obh.findmin(); b; b = obh.findmin(b)) {
		z[b] = 2*obh.key(b); obh.delete(b); steps++;
	}
	exh.clear(); eeh.clear();
	// rebuild vertex heaps and edge heaps, using new states
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (bloss.state(b) == +1) {
			if (b > g.n) ebh.insert(b, z[b]/2);
			// add ee edges to eeh
			for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
				evh.insert(u,z[u]);
				for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
					let v = g.mate(u,e); let V = bloss.outer(v);
					if (V != b && bloss.state(V) == +1 && !eeh.contains(e))
						eeh.insert(e, slack(e)/2);
				}
				steps++;
			}
		} else {
			// build subheaps for unbound blossoms in exh
			// order of edges with subheaps matches order of vertices within
			// outer blossoms
			let laste = 0;
			for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
				// insert dummy edge for u in b's subheap within exh
				let e = u + g.edgeRange;
				exh.insertAfter(e, b, Infinity, laste); laste = e;
				for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
					let v = g.mate(u,e); let V = bloss.outer(v);
					if (bloss.state(V) == +1) {
						exh.insertAfter(e, b, slack(e), laste); laste = e;
					}
				}
				steps++;
			}
			exh.activate(b);
		}
	}
	if (trace) {
		let s = bloss.blossoms2string(1);
		if (s.length > 2) traceString += `	${s}\n`;
	}
}

/** Adjust the labels for the vertices and blossoms.
 *  Takes O(m) time.
 *  @return tuple true if we have a max weight matching, else false
 */
function relabel() {
	let d1 = evh.empty() ? 0 : evh.key(evh.findmin());

	let e = exh.findmin();
	let d2 = (e && e <= g.edgeRange ? slack(e) : Infinity);

	e = eeh.findmin();
	while (e && bloss.outer(g.left(e)) == bloss.outer(g.right(e))) {
		eeh.delete(e); e = eeh.findmin(); steps++;
	}
	let d3 = (e ? eeh.key(e) : Infinity);

	let d4 = obh.empty() ? Infinity : obh.key(obh.findmin());

	let delta = Math.min(d1,d2,d3,d4);

	if (trace) traceString += `relab(${d1} ${d2} ${d3} ${d4})`;

	evh.add2keys(-delta);   ovh.add2keys(+delta);
	ebh.add2keys(+delta);   obh.add2keys(-delta);
	eeh.add2keys(-delta);   exh.add2keys(-delta);

	if (delta == d4) {
		let b = obh.deletemin();
		z[b] = 0; 
		let subs = bloss.expandOdd(b); deblossoms++;
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			let next = subs.next(sb);
			let e = (next ? firstVertex[next] + g.edgeRange : 0);
			exh.divide(b, e, sb);
		}
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			if (bloss.state(sb) == -1) {
				if (sb > g.n) obh.insert(sb,z[sb]/2);
			} else {
				for (let u = bloss.firstIn(sb); u; u = bloss.nextIn(sb,u)) {
					z[u] = ovh.key(u); ovh.delete(u);
					if (bloss.state(sb) == +1) evh.insert(u,z[u]);
				}
				if (bloss.state(sb) == 0) {
					exh.activate(sb);
				} else {
					if (sb > g.n) ebh.insert(sb,z[sb]/2);
					exh.clear(sb); addEXedges(sb);
				}
			}
			steps++;
		}
	}

	if (delta == d1) {
		if (trace) traceString += ' and finished\n';
		return true; // we have max weight matching
	}

	if (trace) {
		let s = eligibleEdgeString();
		if (s.length > 2) traceString += `\n  ${s}\n`;
		s = bloss.trees2string(1);
		if (s.length > 2 && delta == d4) traceString += `  ${s}\n`;
		s = bloss.blossoms2string(1);
		if (s.length > 2 && delta == d4) traceString += `  ${s}\n`;
	}

	return false;
}

/** Construct a string listing eligible edges */
function eligibleEdgeString() {
	let exs = exh.toString(0,e => {
							if (!g.validEdge(e)) return '';
							let [u,v] = [g.left(e),g.right(e)];
							let [U,V] = [bloss.outer(u),bloss.outer(v)];
							let B = bloss.state(u) == 0 ? U : V;
							return exh.key(e,B) == 0 ? g.e2s(e,0,1) : ''
						});
	let ees = eeh.toString(0,e => eeh.key(e) == 0 ? g.e2s(e,0,1) : '')
	if (exs.length > 2 && ees.length > 2)
		return `${exs.slice(0,-1)} ${ees.slice(1)}`;
	else if (exs.length > 2) return exs;
	else if (ees.length > 2) return ees;
}

/** Add ex edges incident to an even blossom or sub-blossom.
 *  @param b is an even blossom or sub-blossom; edges
 *  incident to b in a different outer blossom are added
 *  to either eeh or exh as appropriate 
 */
function addEXedges(b) {
	let bb = bloss.outer(b);
	for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			steps++;
			let v = g.mate(u,e); let V = bloss.outer(v);
			if (V == bb) continue;
			if (bloss.state(V) == +1)
				eeh.insert(e,slack(e)/2);
			else {// V is odd or unbound
				exh.insertAfter(e, V, slack(e), v+g.edgeRange);
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

/** Verify that current primal and dual solutions are feasible.
 *  @param final is a boolean that enables verification of the
 *  algrithm's termination conditions, in addition to the invariants
 *  that must hold throughout execution.
 *  @return the empty string if the verification is successful,
 *  an error string if it is not.
 */
function verifyInvariant(final=false) {
	let outer = (final ? 0 : e => bloss.outer(g.left(e)) != bloss.outer(g.right(e)));
	let s = match.verify(outer); if (s) return s;
	s = bloss.verify(); if (s) return s;

	// verify odd/unreached group heap
	let exhv = exh.groups.verify(); if (exhv) return exhv;

	// verify that no vertex is in a blossom heap
	for (let u = 1; u <= g.n; u++) {
		if (ebh.contains(u) || obh.contains(u))
				return `vertex ${g.x2s(u)} in blossom heap`;
	}

	// check that state of each outer blossom and vertex matches the
	// heap that it's in
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		let bstate = bloss.state(b);
		if (b <= g.n && (ebh.contains(b) || obh.contains(b)))
			return `vertex ${g.x2s(b)} in blossom heap`;
		if (b > g.n) {
			if (ebh.contains(b) && bstate != +1)
				return `blossom ${b} in ebh has state ${bstate}`;
			if (obh.contains(b) && bstate != -1)
				return `blossom ${b} in obh has state ${bstate}`;
			if (!ebh.contains(b) && bstate == +1)
				return `even blossom ${b} is not in ebh`;
			if (!obh.contains(b) && bstate == -1)
				return `odd blossom ${b} is not in obh`;
		}
		for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
			if (evh.contains(u) && bstate != +1)
				return `vertex ${g.x2s(u)} in evh has state ${bstate}`;
			if (ovh.contains(u) && bstate != -1)
				return `vertex ${g.x2s(u)} in ovh has state ${bstate}`;
			if (!evh.contains(u) && bstate == +1)
				return `even vertex ${g.x2s(u)} is not in evh`;
			if (!ovh.contains(u) && bstate == -1)
				return `odd vertex ${g.x2s(u)} is not in ovh`;
		}
	}

	// check that the endpoint states of each edge match its edge heap
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		let [U,V] = [bloss.outer(u),bloss.outer(v)];
		if (U == V) continue;
		let stateSum = bloss.state(U) + bloss.state(V);
		if (eeh.contains(e) && stateSum != +2)
			return `eeh contains incompatible edge ${g.e2s(e)} ${stateSum}`;
		if (!eeh.contains(e) && stateSum == +2)
			return `eeh is missing edge ${g.e2s(e)}`;
		if ((exh.contains(e,U) || exh.contains(e,V)) && stateSum != +1)
			return `exh contains incompatible edge ${g.e2s(e)} ${stateSum}`;
		if (!exh.contains(e,U) && !exh.contains(e,V) && stateSum == +1)
			return `exh is missing edge ${g.e2s(e)}`;
	}
	for (let b = ebh.first(); b; b = ebh.next(b)) {
		if (b <= g.n || bloss.outer(b) != b)
			return `blossom ${bloss.x2s(b)} in ebh is not a non-trivial ` +
				   `outer blossom`;
	}
	for (let b = obh.first(); b; b = obh.next(b)) {
		if (b <= g.n || bloss.outer(b) != b)
			return `blossom ${bloss.x2s(b)} in obh is not a non-trivial ` +
				   `outer blossom`;
	}
	for (let e = eeh.first(); e; e = eeh.next(e)) {
		if (eeh.key(e) != slack(e)/2)
			return `eeh.key(${g.e2s(e)})=${eeh.key(e)} != ` +
				   `slack(${g.e2s(e)})/2=${slack(e)/2}`;
	}

	// verify dual constraints for external edges
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		if (bloss.outer(u) == bloss.outer(v)) continue;
		let s = slack(e);
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
		zsum[B] = zz(B);
		q.enq(B);
		while (!q.empty()) {
			let b = q.deq();
			for (let bb = bloss.firstSub(b); bb; bb = bloss.nextSub(bb)) {
				if (bb <= g.n) continue;
				zsum[bb] = zz(bb) + zsum[b];
				q.enq(bb);
			}
		}
	}

	// Compute nearest common blossom ancestors for all edges
	let ncba = bloss.ncba();

	// now verify dual constraints for all internal edges
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		if (bloss.outer(u) != bloss.outer(v)) continue;
		let s = slack(e,zsum,ncba);
		if (s < 0) {
			return `edge ${g.e2s(e)} has negative slack=${s} `;
		}
		if (match.contains(e) && s > 0) {
			return `matched edge ${g.e2s(e)} has non-zero slack=${s}`;
		}
	}

	// finally, verify termination condition
	let dualObj = 0;
	for (let u = 1; u <= g.n; u++) dualObj += zz(u);
	for (let B = g.n+1; B <= bloss.n; B++) {
		if (bloss.validBid(B))
			dualObj += zz(B) * (bloss.blossomSize(B)-1)/2;
	}
	if (dualObj != match.weight()) {
		return `dual objective = ${dualObj} does not equal ` +
			   `matching weight = ${match.weight()}`;
	}
	for (let u = 1; u <= g.n; u++) {
		if (match.at(u) == 0 && zz(u) != 0 )
			return `unmatched vertex with z[${g.x2s(u)}] = ${zz(u)}`;
	}

	return '';
}

function statusString() {
	let s = 'complete state\nmatch:' + match.toString() +
			'\nouter blossoms: ' + bloss.blossoms2string() +
			'\n         trees: ' + bloss.trees2string();
	s += 'z values\n';
	for (let u = 1; u <= g.n; u++) {
		if (u > 1) s += ' ';
		s += `${g.x2s(u)}:${zz(u)}`
	}
	s += '\n';
	let first = true
	for (let b = g.n+1; b <= bloss.n; b++) {
		if (!bloss.validBid(b)) continue;
		if (first) first = false;
		else s += ' ';
		s += `${bloss.x2s(b)}:${zz(b)}`
	}
	s += '\n' + heaps2string();
	return s;
}

function heaps2string() {
	let s = '';
	if (!evh.empty())
		s += 'evh: ' + evh.toString() + '\n';
	if (!ovh.empty())
		s += 'ovh: ' + ovh.toString() + '\n';
	if (!ebh.empty())
		s += 'ebh: ' + ebh.toString(0,b => `${b}:${ebh.key(b)}`) + '\n';
	if (!obh.empty())
		s += 'obh: ' + obh.toString(0,b => `${b}:${obh.key(b)}`) + '\n';
	if (!eeh.empty()) {
		s += 'eeh: ' + eeh.toString(0,e => 
				g.n > 26 ? g.e2s(e) : g.x2s(g.left(e)) + g.x2s(g.right(e)) +
							':' + eeh.key(e)) + '\n';
	}
	if (!exh.empty()) {
		s += 'exh: ' + exh.toString(0,e => 
				e > g.edgeRange ? g.x2s(e-g.edgeRange) :
				 (g.n > 26 ? g.e2s(e) : g.x2s(g.left(e)) + g.x2s(g.right(e))));
		s += '\n';
	}
	return s;
}
