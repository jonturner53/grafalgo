/** @file wmatchGMG0.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, fassert } from '../../common/Errors.mjs';
import Matching from './Matching.mjs';
import Blossoms0 from './Blossoms0.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

let g=null;       // shared copy of graph
let match;        // Matching object representing matching for graph
let bloss;        // Blossoms object representing blossoms and matching trees

let z;            // z[b] is dual variable for blossom (or vertex) b
let blist;        // temporary list of blossoms
let mark;         // temporary array of flags

let ovh;          // heap of odd vertices, with key[u]=z[u]
let evh;          // heap of even vertices, with key[u]=z[u]
let obh;          // heap of odd outer blossoms, with key[b]=z[b]/2
let ebh;          // heap of even outer blossoms, with key[b]=z[b]/2
let eeh;          // heap of edges with two even endpoints
                  // key[e={u,v}] = (z[u]+z[v]-weight(e))/2
let euh;          // heap of edges with one even, one unreached endpoint
                  // key[e={u,v}] = z[u]+z[v]-weight(e)

let trace;
let traceString;

let paths;      // number of paths found
let blossoms;   // number of blossoms formed
let deblossoms; // number of odd blossoms expanded
let relabels;   // number of relabeling steps
let steps;      // total number of steps

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
export default function wmatchGMG0(mg, traceFlag=false, subsets=null) {
	g = mg;
	match = new Matching(g);
	bloss = new Blossoms0(g, match);
	z = new Float32Array(bloss.n+1);
	blist = new List(bloss.n);
	mark = new Int8Array(bloss.n+1).fill(false);
	
	ovh = new ArrayHeap(g.n);
	evh = new ArrayHeap(g.n);
	obh = new ArrayHeap(bloss.n);
	ebh = new ArrayHeap(bloss.n);
	eeh = new ArrayHeap(g.edgeRange);
	euh = new ArrayHeap(g.edgeRange);

	trace = traceFlag; traceString = '';
	paths = blossoms = deblossoms = relabels = 0;
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
			traceString += '\nmatching: ' + match.toString() + '\n';
			if (bloss.toString().length > 3) {
				traceString += `outer blossoms:\n${bloss.toString(1)}`;
			}
		}

		// process eligible edges with an even endpoint
		while (true) {
			/*
			let s = verifyInvariant();
			if (s) {
				s = traceString + 'ERROR: ' + s + '\n' + statusString();
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
				if (ba == 0) {
					augment(ee);
				} else {
					newBlossom(ee,ba);
				}
			} else if (eu && euh.key(eu) == 0) {
				euh.delete(eu); newBranch(eu);
			} else {
				break;
			}
		}

		// adjust vertex/blossom labels, creating more eligible edges
		// and/or reducing number of vertices in odd blossoms
		relabels++;
		finished = relabel();
	}

	if (trace) {
		traceString += `final matching: ${match.toString()}\n`;
	}
	steps += bloss.getStats().steps;

	let s = verify(); assert(!s,s);

    return [match, traceString,
			{'paths': paths, 'blossoms': blossoms, 'deblossoms': deblossoms,
			 'relabels': relabels, 'steps': steps}];
}

function newBranch(e) {
	let [u,v] = [g.left(e),g.right(e)];
	let [bu,bv] = [bloss.outer(u),bloss.outer(v)];
	if (bloss.state(bu) != +1) [u,v,bu,bv] = [v,u,bv,bu];
	let bw = bloss.addBranch(e,v,bv);
	if (trace) {
		traceString +=
			`branch: ${bu>g.n ? bu + ':' : ''}${g.x2s(u)} ` +
					`${bv>g.n ? bv + ':' : ''}${g.e2s(e)} ` +
					`${bw>g.n ? bw + ':' : ''}` +
					`${g.e2s(match.at(bloss.base(bv)))}\n`;
	}

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
	for (let x = bloss.firstIn(bw); x; x = bloss.nextIn(bw,x)) {
		evh.insert(x,z[x]);
		for (let ex = g.firstAt(x); ex; ex = g.nextAt(x,ex)) {
			let y = g.mate(x,ex); let by = bloss.outer(y);
			if (euh.contains(ex)) euh.delete(ex);
			if (by == bw) continue;
			if (bloss.state(by) == 0) {
				euh.insert(ex, slack(ex));
			} else if (bloss.state(by) == +1) {
				//euh.delete(ex);
				//if (by != bw) 
				eeh.insert(ex, slack(ex)/2);
			}
		}
	}
}

function newBlossom(e,ba) {
	blossoms++;
	let [b,subs] = bloss.addBlossom(e,ba);
	z[b] = 0;
	if (trace) {
		traceString += `blossom: ${bloss.x2s(b)} ` +
					   `${subs.toString(x => bloss.x2s(x))}\n`;
	}

	// now update heaps
	ebh.insert(b,0);
	for (let sb = subs.first(); sb; sb = subs.next(sb)) {
		if (ebh.contains(sb)) {
			if (ebh.contains(sb)) {
				z[sb] = 2*ebh.key(sb); ebh.delete(sb);
			}
			for (let x = bloss.firstIn(sb); x; x = bloss.nextIn(sb,x))
				if (!evh.contains(x)) evh.insert(x,z[x]);
		} else if ((sb <= g.n && ovh.contains(sb)) || obh.contains(sb)) {
			if (sb <= g.n && ovh.contains(sb)) {
				z[sb] = ovh.key(sb); ovh.delete(sb);
			}
			if (obh.contains(sb)) {
				z[sb] = 2*obh.key(sb); obh.delete(sb);
			}
			for (let x = bloss.firstIn(sb); x; x = bloss.nextIn(sb,x)) {
				if (ovh.contains(x)) {
					z[x] = ovh.key(x); ovh.delete(x);
				}
				evh.insert(x,z[x]);
				for (let ex = g.firstAt(x); ex; ex = g.nextAt(x,ex)) {
					let y = g.mate(x,ex); let by = bloss.outer(y);
					if (by == b) continue;
					if (bloss.state(by) == 0) {
						euh.insert(ex, slack(ex));
					} else if (bloss.state(by) == +1) {
						eeh.insert(ex, slack(ex)/2);
					}
				}
			}
		}
	}
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
		bloss.link(bx,null);
		if (trace) ts = `${g.e2s(ee)} ${bloss.x2s(bx)}${ts}`
		x = g.mate(y,ee); bx = bloss.outer(x); lx = bloss.link(bx);
	}
	bloss.flip(bx,x);
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
		bloss.link(bx,null);
		x = g.mate(y,ee); bx = bloss.outer(x); lx = bloss.link(bx);
	}
	bloss.flip(bx,x);
	if (trace) traceString += `${ts}${bloss.x2s(bx)} :`;

	newPhase();
	if (trace) {
		traceString += '\n';
		if (bloss.toString().length > 3)
			traceString += `outer blossoms:\n${bloss.toString(1)}`;
	}
}

/** Prepare for next phase, following an augmentation.
 *  Expand all outer blossoms with z==0, set states of remaining outer
 *  blossoms to unreached or even and their links to null.
 */
function newPhase() {
	// expand outer blossoms with z == 0
	blist.clear();
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		if (zz(b) == 0) blist.enq(b);  // note: b must be even
	}
	while (!blist.empty()) {
		let b = blist.deq();
		if (trace) traceString += ` ${bloss.x2s(b)}`;
		let subs = bloss.expandBlossom(b); 
		for (let sb = subs.first(); sb; sb = subs.next(sb)) {
			if (zz(sb) == 0 && sb > g.n) blist.enq(sb);
		}
	}

	// update the z variables while clearing the vertex and blossom heaps
	for (let u = evh.findmin(); u; u = evh.findmin()) {
		z[u] = evh.key(u); evh.delete(u);
	}
	for (let u = ovh.findmin(); u; u = ovh.findmin(u)) {
		z[u] = ovh.key(u); ovh.delete(u);
	}
	for (let b = ebh.findmin(); b; b = ebh.findmin(b)) {
		z[b] = 2*ebh.key(b); ebh.delete(b);
	}
	for (let b = obh.findmin(); b; b = obh.findmin(b)) {
		z[b] = 2*obh.key(b); obh.delete(b);
	}
	// set states of remaining outer blossoms based on matching status
	// and update vertex heaps and blossom heaps
	for (let b = bloss.firstOuter(); b; b = bloss.nextOuter(b)) {
		bloss.state(b, match.at(bloss.base(b)) ? 0 : +1); bloss.link(b,null);
		if (bloss.state(b) == 0) continue;
		if (b > g.n) ebh.insert(b, z[b]/2);
		for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
			evh.insert(u, z[u]);
		}
	}

	// add eligible edges to euh or eeh as appropriate
	euh.clear(); eeh.clear();
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		let [bu,bv] = [bloss.outer(u),bloss.outer(v)];
		if (bu == bv) continue;
		if (bloss.state(bu) + bloss.state(bv) == +2)
			eeh.insert(e, slack(e)/2); 
		else if (bloss.state(bu) + bloss.state(bv) == +1)
			euh.insert(e, slack(e));
	}
}

/** Adjust the labels for the vertices and blossoms.
 *  Takes O(m) time.
 *  @return tuple true if we have a max weight matching, else false
 */
function relabel() {
	let d1 = evh.empty() ? 0 : evh.key(evh.findmin());
	let d2 = euh.empty() ? Infinity : euh.key(euh.findmin());
	let d3 = eeh.empty() ? Infinity : eeh.key(eeh.findmin());
	let d4 = obh.empty() ? Infinity : obh.key(obh.findmin());
	let delta = Math.min(d1,d2,d3,d4);

	if (trace) traceString += `relab(${delta})`;

	evh.add2keys(-delta);   ovh.add2keys(+delta);
	ebh.add2keys(+delta);   obh.add2keys(-delta);
	eeh.add2keys(-delta);   euh.add2keys(-delta);


	// expand odd blossoms with zero z in place
	if (trace) traceString += ' [';
	if (delta == d4) {
		let first = true;
		for (let b = obh.findmin(); obh.key(b) == 0; b = obh.findmin()) {
			steps++;
			z[b] = 0; obh.delete(b);
			let blist = bloss.expandInplace(b); deblossoms++;

			if (trace) {
				if (first) first = false;
				else traceString += ' ';
				traceString += b;
			}

			for (let sb = blist.first(); sb; sb = blist.next(sb)) {
				steps++;
				if (sb <= g.n) {
					z[sb] = ovh.key(sb); ovh.delete(sb);
				}
				let ssb = bloss.state(sb); // new state from expandInPlace
				if (ssb == -1) {
					if (sb <= g.n) ovh.insert(sb,z[sb]);
					else           obh.insert(sb,z[sb]/2);
				} else if (ssb == +1) {
					if (sb <= g.n) evh.insert(sb,z[sb]);
					else           ebh.insert(sb,z[sb]/2);
				}
				for (let u = bloss.firstIn(sb); u; u = bloss.nextIn(sb,u)) {
					if (sb > g.n && ssb != -1) {
						z[u] = ovh.key(u); ovh.delete(u);
						if (ssb == +1) evh.insert(u,z[u]);
					}
					for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
						let v = g.mate(u,e); let bv = bloss.outer(v);
						if (bv == sb) continue;
						let sbv = bloss.state(bv);
						     if (ssb + sbv == +1) euh.insert(e,slack(e));
						else if (ssb + sbv == +2) eeh.insert(e,slack(e)/2);
					}
				}
			}
		}
	}

	if (delta < d1) {
		if (trace) traceString += ']\n';
		return false;
	}
	if (trace) traceString += '] and finished\n';
	return true; // we have max weight matching
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
			if (!match.at(u) && zz(u) > 0) {
				s += `for unmatched vertex ${bloss.x2s(u)}, ` +
					   `z(${bloss.x2s(u)})=${zz(u)}`;
				break;
			}
		}
	}
	if (s) {
		s = traceString + 'ERROR xx: ' + s + '\n' + statusString();
		console.log(s + g.toString(1));
	}
	return s;
}

function verifyInvariant() {
	let mv = match.verify(); if (mv) return mv;
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
			if (ebh.contains(b) && bloss.state(b) != +1)
				return `blossom ${b} in ebh has state ${bloss.state(b)}`;
			if (obh.contains(b) && bloss.state(b) != -1)
				return `blossom ${b} in obh has state ${bloss.state(b)}`;
			if (!ebh.contains(b) && bloss.state(b) == +1)
				return `even blossom ${b} is not in ebh`;
			if (!obh.contains(b) && bloss.state(b) == -1)
				return `odd blossom ${b} is not in obh`;
		}
		for (let u = bloss.firstIn(b); u; u = bloss.nextIn(b,u)) {
fassert(u <= g.n, `u=${bloss.x2s(u)}`);
			if (evh.contains(u) && bloss.state(b) != +1)
				return `vertex ${g.x2s(u)} in evh has state ${bloss.state(b)}`;
			if (ovh.contains(u) && bloss.state(b) != -1)
				return `vertex ${g.x2s(u)} in ovh has state ${bloss.state(b)}`;
			if (!evh.contains(u) && bloss.state(b) == +1)
				return `even vertex ${g.x2s(u)} is not in evh`;
			if (!ovh.contains(u) && bloss.state(b) == -1)
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
			return `eeh contains incompatible edge ${g.e2s(e)}`;
		if (euh.contains(e) && stateSum != +1)
			return `euh contains incompatible edge ${g.e2s(e)}`;
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
