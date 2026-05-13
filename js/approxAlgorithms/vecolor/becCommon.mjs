/** @file becCommon.mjs
 * 
 *  @author Jon Turner
 *  @date 2026
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import mdmatchG from '../../graphAlgorithms/vmatch/mdmatchG.mjs';
import findSplit from '../../graphAlgorithms/misc/findSplit.mjs';
import flowfloor from '../../graphAlgorithms/maxflow/flowfloor.mjs';
import becSplit from './becSplit.mjs';

/** Return the largest color floor */
export function maxFloor(eg) {
	let max = 0;
	for (let e = g.first(); e; e = next(e))
		max = Math.max(max, g.floor(e));
	return max;
}

/** Compute lower bound on the bounded chromatic index using
 *  the degree bound method.
 *  @param g is a Graph with color floors.
 *  @return the lower bound.
 */
export function degreeBound(g) {
	let lb = 0;
    for (let u = 1; u <= g.n; u++) {
		let d = g.degree(u); let evec = []; let i = 0;
        for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
			evec[i++] = e;
		evec.sort((e1,e2)=>g.floor(e1)-g.floor(e2));
		i = 1;
		for (let e of evec) {
            lb = Math.max(lb, Math.ceil(g.floor(e)) + (d-i++));
		}
    }
	return lb;
}

/** Return the lower bound based on matchings. */
export function matchBound(g) {
	let gc = new Graph(g.n, g.edgeRange); gc.setBipartition(g.getBipartition());
	let total = 0; let c;
	for (c = 1; total < g.m; c++) {
		// construct G_c (by adding edges to previous G_c)
		for (let e = g.first(); e; e = g.next(e)) {
			if (c >= g.floor(e) && c < g.floor(e) + 1)
				gc.join(g.left(e), g.right(e), e);
		}
		// find max matching in gc and add its size to total
		let [match] = bimatchHK(gc);
		total += match.size();
		if (total > gc.m) total = gc.m;
	}
	return c-1;
}

/** Compute the flow lower bound on the bounded chromatic index.
 *  @param g is a graph with edge floors
 *  @return the lower bound
 */
export function splitBound(g) {
	let subsets = findSplit(g);
	if (!subsets) return 0;
	
	let fmax = 1;
	for (let e = g.first(); e; e = g.next(e)) 
		fmax = Math.max(fmax, g.floor(e));

	// binary search to find largest C for which graph is not C-colorable
	// start by finding upper bound.
	let k0 = Math.ceil(fmax/2);
	let lo = Math.max(degreeBound(g), matchBound(g)) - 1;
	let hiMax = fmax + Math.max(...g.maxDegree());
	let increment = 3; let hi = lo+increment;
	let phase = 1;

	while (lo < hi) {
		let C = ~~((lo + hi + 1)/2);  // so, lo < C

		// speed things up by trying k0 case first
		let k = k0;
		let fg = buildFlograph(g, subsets, k, C);
		let [success] = flowfloor(fg);
		if (!success) {
			lo = C;
			if (phase == 1) {
				increment *= 2; hi = Math.min(lo + increment, hiMax);
			}
			continue;
		} else {
			hi = C-1; phase = 2; continue;
		}
		if (lo >= hi) break;

		for (k = fmax; k >= 1; k--) {
			let fg = buildFlograph(g, subsets, k, C);
			let [success] = flowfloor(fg);
			if (!success) {
				lo = C;
				if (phase == 1) {
					increment *= 2; hi = Math.min(lo + increment, hiMax);
				}
				break;
			}
			if (k == k0+1) k--; // avoid repeat of k0 case
		}
		if (k == 0) { hi = C-1; phase = 2; }
	}
	return lo+1;
}

/** Construct flow graph for determining lower bound.
 *  @param g is a bipartite graph with edge color floors
 *  @param subsets is a ListPair that defines bipartition on g
 *  @param k is the largest floor to consider when constructing fg;
 *  that is, only incorporate edges from g that have floors <= k
 *  @param C is the target maximum color for floor computation
 *  @return a flow graph with min flow requirements; if there is a flow
 *  that satisfies the min flow requirements in which the
 *  result is returned
 */
function buildFlograph(g, subsets, k, C) {
	let fg = new Flograph(g.n*k+2, g.edgeRange+g.n*k);
	if (!fg.floor) fg.addEdgeProperty('floor', 0);
	fg.source = g.n*k+1; fg.sink = g.n*k+2;
	// first, build core edges, preserving edge numbers from g
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)]
		if (!subsets.in(u,1)) [u,v] = [v,u];
		let c = Math.ceil(g.floor(e));
		if (c <= k) {
			fg.join((u-1)*k + c, (v-1)*k + c, e); fg.cap(e, 1);
		}
	}
	// now, build remaining edges
	for (let u = 1; u <= g.n; u++) {
		let du = g.degree(u);
		if (subsets.in(u,1)) {  // u is an input
			let e = fg.join(fg.source, (u-1)*k+1);
			fg.cap(e, k); fg.floor(e, Math.max(0, du - (C - k)));
			let x = (u-1)*k+1; let ecap = k-1;
			while (x < u*k) {
				e = fg.join(x,x+1); fg.cap(e,ecap--); x++;
			}
		} else {
			let e = fg.join((u-1)*k+1, fg.sink);
			fg.cap(e, k); fg.floor(e, Math.max(0, du - (C - k)));
			let x = (u-1)*k+1; let ecap = k-1;
			while (x < u*k) {
				e = fg.join(x+1,x); fg.cap(e,ecap--); x++;
			}
		}
	}
	return fg;
}

/** Return array of lower bounds on the number of colors required. */
export function lowerBounds(g) {
	let [idmax, odmax] = g.maxDegree();
	return [degreeBound(g), matchBound(g), splitBound(g)];
}

/** Return array of upper bounds on the number of colors required. */
export function upperBounds(g) {
	let clone = Graph.clone(g);
	if (g.color) clone.resetColor();
	clone.setBipartition(g.getBipartition());
	becSplit(clone); let fmax = 1; let cmax = 0;
	for (let e = g.first(); e; e = g.next(e)) {
		cmax = Math.max(cmax, clone.color(e));
		fmax = Math.max(fmax, clone.floor(e));
	}
	return [cmax, fmax + Math.max(...g.maxDegree()) - 1];
}
