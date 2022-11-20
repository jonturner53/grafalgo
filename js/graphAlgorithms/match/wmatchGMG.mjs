/** @file wmatchGMG.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, fassert } from '../../common/Errors.mjs';
import Matching from './Matching.mjs';
import Blossoms from './Blossoms.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

let g=null;       // shared copy of graph
let match;        // Matching object representing matching for graph
let bloss;        // Blossoms object representing blossoms and matching trees

let z;            // z[b] is dual variable for blossom (or vertex) b
let bq1;          // temporary list of blossoms
let bq2;          // ditto
let mark;         // temporary array of flags

let ovh;          // heap of odd vertices, with key[u]=z[u]
let evh;          // heap of even vertices, with key[u]=z[u]
let obh;          // heap of odd outer blossoms, with key[b]=z[b]/2
let ebh;          // heap of even outer blossoms, with key[b]=z[b]/2
let eeh;          // heap of edges with two even endpoints
                  // key[e={u,v}] = (z[u]+z[v]-weight(e))/2
let euh;          // heap of edges with one even, one unbound endpoint
                  // key[e={u,v}] = z[u]+z[v]-weight(e)

let trace;
let traceString;

let branches;   // number of branches found
let blossoms;   // number of blossoms formed
let relabels;   // number of relabeling steps
let deblossoms; // number of odd blossoms expanded
let steps;      // total number of steps


let cnt=0;

/** Compute a maximum weighted matching in a graph using a simplified
 *  version of Galil, Micali and Gabows' implementation of Edmonds's
 *  weighted matching algorithm.
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
	bloss = new Blossoms(g, match, 2);
	z = new Float32Array(bloss.n+1);
	bq1 = new List(bloss.n);
	bq2 = new List(bloss.n);
	mark = new Int8Array(bloss.n+1).fill(false);
	
	ovh = new ArrayHeap(g.n);
	evh = new ArrayHeap(g.n);
	obh = new ArrayHeap(bloss.n);
	ebh = new ArrayHeap(bloss.n);
	eeh = new ArrayHeap(g.edgeRange);
	euh = new ArrayHeap(g.edgeRange);

	trace = traceFlag; traceString = '';
	branches = blossoms = deblossoms = relabels = 0;
	steps = g.n + g.edgeRange;

	let maxwt = -Infinity;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		maxwt = Math.max(g.weight(e),maxwt);
	}
	z.fill(maxwt/2.0,1,g.n+1);
	for (let u = 1; u <= g.n; u++) evh.insert(u,z[u]);
	for (let e = g.first(); e != 0; e = g.next(e)) eeh.insert(e,slack(e)/2);

	if (trace) {
        traceString += `${g.toString(1)}\n`;
	}

	let finished = false;
	while (!finished) {
		if (trace) {
			traceString += '\nmatching: ' + 
							match.toString(e => bloss.outer(g.left(e)) !=
												bloss.outer(g.right(e))) + '\n';
			traceString += heaps2string();
			if (bloss.toString().length > 3) {
				traceString += `outer blossoms:\n${bloss.toString(1)}`;
			}
		}

		// process eligible edges with an even endpoint
		while (true) {
			/*
			let s = verifyInvariant();
			if (s) {
				s = traceString + 'ERROR: ' + s;
				s += '\n' + statusString();
				console.log(s); return [match, s];
			}
			*/

			steps++;
			let ee = eeh.findmin();
			let eu = euh.findmin();
			if (ee && eeh.key(ee) == 0) {
				eeh.delete(ee)
				let [u,v] = [g.left(ee),g.right(ee)];
				let [bu,bv] = [bloss.outer(u),bloss.outer(v)];
				if (bu == bv) continue;
				let ba = nca(bu,bv);
				if (ba == 0) { augment(ee); continue; }
				let [b,subs] = bloss.addBlossom(ee,ba);
				z[b] = 0; ebh.insert(b,0);
				// now update heaps for former outer blossoms
				for (let sb = subs.first(); sb; sb = subs.next(sb)) {
					if (ebh.contains(sb)) {
						// sb no longer an outer heap, but its vertices
						// are still even
						z[sb] = 2*ebh.key(sb); ebh.delete(sb);
					} else if (obh.contains(sb)) {
						shrinkHeaps(sb); growHeaps(sb);
					} else if (sb <= g.n && ovh.contains(sb)) {
						z[sb] = ovh.key(sb); ovh.delete(sb);
						growHeaps(sb)
					}
				}
				if (trace) {
					traceString += `blossom: ${bloss.x2s(b)} ` +
								   `${subs.toString(x => bloss.x2s(x))}\n`;
				}
				blossoms++;
			} else if (eu && euh.key(eu) == 0) {
				euh.delete(eu);
				let [u,v] = [g.left(eu),g.right(eu)];
				let [bu,bv] = [bloss.outer(u),bloss.outer(v)];
				if (bloss.state(bu) != +1) [u,v,bu,bv] = [v,u,bv,bu];
				let bw = bloss.addBranch(eu,v,bv);
				shrinkHeaps(bv); shrinkHeaps(bw);
				growHeaps(bv); growHeaps(bw);
				branches++;

				if (trace) {
					traceString +=
						`branch: ${bloss.x2s(bu)} ${g.e2s(eu,0,1)} ` +
								`${bloss.x2s(bv)} ` +
								`${g.e2s(match.at(bloss.base(bv)),0,1)} ` +
								`${bloss.x2s(bw)}\n`;
				}
			} else {
				break;
			}
		}

		// adjust vertex/blossom labels, creating more eligible edges
		// and/or reducing number of vertices in odd blossoms
		relabels++;
		finished = relabel();
	}

	// before returning, verify invariant, expand remaining blossoms
	// to complete matching and finally verify termination condition
	bq1.clear();
	let s = verifyInvariant();
	fassert(!s, traceString + s + '\n' + statusString());
	
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (b > g.n) bq1.enq(b);
	}
	while (!bq1.empty()) {
		let b = bq1.deq();
		let subs = bloss.expand(b);
		for (let bb = subs.first(); bb; bb = subs.next(bb))
			if (bb > g.n) bq1.enq(bb);
	}

	s = checkTerm();
	fassert(!s, traceString + s + '\n' + statusString());

	if (trace) {
		traceString += `final matching: ` +
							match.toString(e => bloss.outer(g.left(e)) !=
												bloss.outer(g.right(e))) + '\n';
	}
	steps += bloss.getStats().steps; +
			 obh.getStats().steps + ebh.getStats().steps +
			 ovh.getStats().steps + evh.getStats().steps +
			 eeh.getStats().steps + euh.getStats().steps;

    return [match, traceString,
			{'weight': match.weight(), 'branches': branches, 'blossoms': blossoms,
			 'relabels': relabels, 'deblossoms': deblossoms, 'steps': steps}];
}

/** Return the slack of an "outer edge".
 *  @param e is an edge joining vertices in different outer blossoms
 */
function slack(e) {
	return zz(g.left(e)) + zz(g.right(e)) - g.weight(e);
}

/** Get the corrected z value of a blossom and update it.
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
			traceString += '\nmatching: ' + 
							match.toString(e => bloss.outer(g.left(e)) !=
												bloss.outer(g.right(e))) + '\n';
			traceString += heaps2string();
		if (bloss.toString().length > 3)
			traceString += 'outer blossoms:\n' + bloss.toString(1);
	}
}

/** Prepare for next phase, following an augmentation.
 *  Expand all outer blossoms with z==0, set states of remaining outer
 *  blossoms to unbound or even and their links to null.
 */
function newPhase() {
	// expand outer blossoms with z == 0
	bq1.clear();
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (zz(b) == 0) bq1.enq(b);  // note: b must be even
		steps++;
	}
	if (trace) traceString += ' :'
	while (!bq1.empty()) {
		let b = bq1.deq();
		if (trace) traceString += ` ${bloss.x2s(b)}`;
		let subs = bloss.expand(b); 
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			if (zz(sb) == 0 && sb > g.n) bq1.enq(sb);
			steps++;
		}
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
	euh.clear(); eeh.clear();
	// set states/links of remaining outer blossoms based on matching status
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		bloss.state(b, match.at(bloss.base(b)) ? 0 : +1); bloss.link(b,[0,0]);
		steps++;
	}
	// update vertex heaps and blossom heaps, using new states
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (bloss.state(b) == +1) growHeaps(b);
		steps++;
	}
}

/** Adjust the labels for the vertices and blossoms.
 *  Takes O(m) time.
 *  @return tuple true if we have a max weight matching, else false
 */
function relabel() {
	let d1 = evh.empty() ? 0 : evh.key(evh.findmin());
	let d2 = euh.empty() ? Infinity : euh.key(euh.findmin());

/*
	let d2 = Infinity;
	while (!eeh.empty()) {
		let e = eeh.findmin();
		if (bloss.outer(g.left(e)) != bloss.outer(g.right(e))) {
			d2 = eeh.key(e); break;
		}
		eeh.delete(e);
	}
*/

	let d3 = Infinity;
	while (!eeh.empty()) {
		let e = eeh.findmin();
		if (bloss.outer(g.left(e)) != bloss.outer(g.right(e))) {
			d3 = eeh.key(e); break;
		}
		eeh.delete(e);
		steps++;
	}

	//let d3 = eeh.empty() ? Infinity : eeh.key(eeh.findmin());
	let d4 = obh.empty() ? Infinity : obh.key(obh.findmin());
	let delta = Math.min(d1,d2,d3,d4);

	if (trace) traceString += `relab(${delta} ${d1} ${d2} ${d3} ${d4})`;

	evh.add2keys(-delta);   ovh.add2keys(+delta);
	ebh.add2keys(+delta);   obh.add2keys(-delta);
	eeh.add2keys(-delta);   euh.add2keys(-delta);

	// expand odd blossoms with zero z
	if (trace) traceString += ' [';
	if (delta == d4) {
		bq1.clear();
		// expand all odd blossoms with z=0 and make list of all new
		// even or unbound outer blossoms
		for (let b = obh.findmin(); obh.key(b) == 0; b = obh.findmin()) {
			z[b] = 0; obh.delete(b); bq1.enq(b); steps++;
		}
		let first = true;
		while (!bq1.empty()) {
			let b = bq1.deq();
			if (trace) {
				if (first) first = false;
				else traceString += ' ';
				traceString += b;
			}
			let subs = bloss.expandOdd(b); deblossoms++;
			for (let sb = subs.first(); sb; sb = subs.next(sb)) {
				if (bloss.state(sb) == -1) {
					if (z[sb] == 0 && sb > g.n) bq1.enq(sb);
					else if (sb > g.n) obh.insert(sb,z[sb]/2);
				} else {
					bq2.enq(sb);
				}
				steps++;
			}
		}
		// now, process new even/unbound outer blossoms 
		while (!bq2.empty()) {
			let b = bq2.deq();
			shrinkHeaps(b); growHeaps(b);
			steps++;
		}
	}

	if (delta == d1) {
		if (trace) traceString += '] and finished\n';
		return true; // we have max weight matching
	} else if (trace) {
		traceString += ']\n';
	}
	return false;
}

/** Add blossom components to the appropriate heaps.
 *  @param b is an outer blossom or sub-blossom
 */
function growHeaps(b) {
	let bstate = bloss.state(bloss.outer(b));
	if (b > g.n && !bloss.parent(b)) {
		if (bstate == -1) obh.insert(b,z[b]/2);
		if (bstate == +1) ebh.insert(b,z[b]/2);
	}
	for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
		if (bstate == -1) { ovh.insert(u,z[u]); continue; }
		if (bstate == +1) evh.insert(u,z[u]);
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			let v = g.mate(u,e); let bv = bloss.outer(v);
			if (bv == b) continue;
			let stateSum = bstate + bloss.state(bv);
			if (stateSum == 1)
				euh.insert(e,slack(e));
			else if (stateSum == 2)
				eeh.insert(e,slack(e)/2);
			steps++;
		}
	}
}

/** Remove blossom components from their heaps.
 *  @param b is an odd or unbound blossom or sub-blossom
 */
function shrinkHeaps(b) {
	if (b > g.n && obh.contains(b)) {
		z[b] = 2*obh.key(b); obh.delete(b);
	}
	for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
		if (ovh.contains(u)) { z[u] = ovh.key(u); ovh.delete(u); }
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			let v = g.mate(u,e); let bv = bloss.outer(v);
			if (euh.contains(e)) euh.delete(e);
			steps++;
		}
	}
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


/** Check for unmatched vertices with non-zero z. */
function checkTerm() {
	for (let u = 1; u <= g.n; u++) {
		if (match.at(u) == 0 && zz(u) != 0 )
			return `unmatched vertex ${g.x2s(u)} has non-zero z=${zz(u)}`;
	}
}

function verifyInvariant() {
	//let mv = match.verify(); if (mv) return mv;
	let bv = bloss.verify(); if (bv) return bv;
	for (let b = 1; b <= bloss.n; b++) {
		if (b <= g.n && zz(b) < 0)
			return `vertex ${bloss.x2s(b)} has negative z=${zz(b)}`;
		else if (b > g.n && bloss.validBid(b) && zz(b) < 0)
			return `blossom ${bloss.x2s(b)} has negative z=${zz(b)}`;
	}
	for (let e = g.first(); e; e = g.next(e)) {
		let u = g.left(e); let v = g.right(e);
		if (bloss.outer(u) == bloss.outer(v)) continue;
		if (slack(e) < 0)
			return `edge ${g.e2s(e)} has negative slack=${slack(e)} ` +
				   `outer=[${bloss.outer(u)},${bloss.outer(v)}] ` +
				   `states=[${bloss.state(bloss.outer(u))},` +
				   `${bloss.state(bloss.outer(v))}] z=[${zz(u)},${zz(v)}]`;
		if (match.contains(e) && slack(e) > 0) {
			return `matched edge ${g.e2s(e)} has non-zero slack=${slack(e)}` +
				   ` states=[${bloss.state(bloss.outer(u))},` +
				   `${bloss.state(bloss.outer(v))}] z=[${zz(u)},${zz(v)}]`;
		}
	}
	for (let u = 1; u <= g.n; u++)
		if (ebh.contains(u) || obh.contains(u))
				return `vertex ${g.x2s(u)} in blossom heap`;
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
fassert(u <= g.n, `unexpected non-vertex ${bloss.x2s(u)} ${g.n}`);
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
		let [bu,bv] = [bloss.outer(u),bloss.outer(v)];
		if (bu == bv) continue;
		let stateSum = bloss.state(bu) + bloss.state(bv);
		if (eeh.contains(e) && stateSum != +2)
			return `eeh contains incompatible edge ${g.e2s(e)} ${stateSum}`;
		if (euh.contains(e) && stateSum != +1)
			return `euh contains incompatible edge ${g.e2s(e)} ${stateSum}`;
		if (!eeh.contains(e) && stateSum == +2)
			return `eeh is missing edge ${g.e2s(e)}`;
		if (!euh.contains(e) && stateSum == +1)
			return `euh is missing edge ${g.e2s(e)}`;
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
	for (let e = euh.first(); e; e = euh.next(e)) {
		if (euh.key(e) != slack(e))
			return `euh.key(${g.e2s(e)})=${euh.key(e)} != ` +
				   `slack(${g.e2s(e)})=${slack(e)}`;
	}
		
	return '';
}

function statusString() {
	let s = 'complete state\nmatch:' + match.toString() +
			'\nouter blossoms:\n' + bloss.toString(1);
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
	if (!eeh.empty())
		s += 'eeh: ' + eeh.toString(0,e => 
				g.n > 26 ? g.e2s(e) : g.x2s(g.left(e)) + g.x2s(g.right(e)) +
							':' + eeh.key(e)) + '\n';
	if (!euh.empty())
		s += 'euh: ' + euh.toString(0,e => 
				g.n > 26 ? g.e2s(e) : g.x2s(g.left(e)) + g.x2s(g.right(e)) +
							':' + euh.key(e)) + '\n';
	return s;
}
