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

// 
// For applications to crossbar scheduling, speedups are modeled as
// the nominal spacing between consecutive floor values (and are
// referred to here as the "gap"). Actual floor values are rounded
// up to next integer.
//

/** Determine the floor value for a specified index and gap.
 *  @param i is a positive integer
 *  @param gap is the nominal inter-floor spacing
 *  @return the i-th floor value
 */
export function ifloor(i,gap) {
	return 1 + Math.ceil((i-1)*gap);
}

/** Determine the number of floors upper-bounded by a given color
 *  @param c is a color
 *  @param gap is the floor spacing
 *  @return the number of floor values <=c.
 */
export function floorCount(c,gap) {
	return 1 + Math.floor((c-1)/gap);
}

/** Determine the index of next floor lower-bounded by a given color
 *  @param c is a color
 *  @param gap is the floor spacing
 *  @return the index of the smallest floor value >=c
 */
export function floorIndex(c, gap) {
	return floorCount(isFloor(c,gap) ? c : c+1, gap);
}

/** Determine if a color is a floor.
 *  @param c is a color
 *  @param gap is the floor spacing
 *  @return the index of the smallest floor value >=c
 */
export function isFloor(c, gap) {
	return floorCount(c, gap) != floorCount(c-1, gap);
}

/** Determine the largest color floor for a graph */
export function maxFloor(g) {
	let max = 0;
	for (let e = g.first(); e; e = g.next(e))
		max = Math.max(max, g.floor(e));
	return max;
}

/** Determine the largest color used to color a graph. */
export function maxColor(g) {
	let cmax = 0;
	for (let e = g.first(); e; e = g.next(e)) {
		cmax = Math.max(cmax, g.color(e));
	}
	return cmax;
}

/** Compute lower bound on the number of distinct floors covered
 *  by a coloring using the degree bound method.
 *  @param g is a Graph with color floors.
 *  @param gap is the inter-floor spacing
 *  @return the lower bound
 */
export function degreeBound(g, gap=1) {
	let lb = 0;
    for (let u = 1; u <= g.n; u++) {
		let d = g.degree(u); let evec = []; let i = 0;
        for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
			evec[i++] = e;
		evec.sort((e1,e2)=>g.floor(e1)-g.floor(e2));
		i = 1;
		for (let e of evec) {
            lb = Math.max(lb, g.floor(e) + (d-i++));
		}
    }
	return lb;
}

/** Compute lower bound on the number of distinct floors covered
 *  by a coloring using the matching bound method.
 *  @param g is a Graph with color floors
 *  @param gap is the inter-floor spacing
 *  @return the lower bound
 */
export function matchBound(g, gap=1) {
	let gc = new Graph(g.n, g.edgeRange); gc.setBipartition(g.getBipartition());
	let total = 0; let c; let cmax=0;
	for (c = 1; total < g.m; c++) {
		// construct G_c (by adding edges to previous G_c)
		for (let e = g.first(); e; e = g.next(e)) {
			if (c >= g.floor(e) && c < g.floor(e) + 1)
				gc.join(g.left(e), g.right(e), e);
		}
		// find max matching in gc and add its size to total
		let [match] = bimatchHK(gc);
		total += match.size();
	}
	return Math.max(c-1, maxFloor(g));
}

/** Compute lower bound on the number of distinct floors covered
 *  by a coloring using the split bound method.
 *  @param g is a Graph with color floors
 *  @param gap is the inter-floor spacing
 *  @return the lower bound
 */
export function splitBound(g, gap=1) {
let t = Date.now();
	let fmax = maxFloor(g); let dmax = Math.max(...g.maxDegree());

	// binary search to find largest C for which graph is not C-colorable
	// start by finding good limits for binary search
	let lo = Math.max(degreeBound(g,gap), matchBound(g,gap)) - 1;
	let hiMax = fmax + dmax;
	let increment = 3; let hi = fmax + dmax;
	let decrement = Math.max(1, Math.floor(fmax/4));

	while (1) {
		let success = false; let C = Math.min(lo + increment, hi-1);
		let decrement = Math.max(1, Math.floor(fmax/4));
		for (let k = fmax; k >= 1; k -= decrement) {
			[success] = flowfloor(buildFlograph(g, k, C));
			if (!success) break;
		}
		if (!success) {
			lo = C; increment *= 2;
		} else {
			hi = C; break;
		}
	}
	// now proceed to binary search
	while (lo < hi-1) {
		let success = false; let C = ~~((lo + hi)/2);
		for (let k = fmax; k >= 1; k -= decrement) {
			[success] = flowfloor(buildFlograph(g, k, C));
			if (!success) break;
		}
		if (!success) lo = C;
		else hi = C;
	}

	return hi;
}

/** Construct flow graph for determining lower bound.
 *  @param g is a bipartite graph with edge color floors
 *  @param k is the largest floor to consider when constructing fg;
 *  that is, only incorporate edges from g that have floors <= k
 *  @param C is the target maximum color for floor computation
 *  @return a flow graph with min flow requirements; if there is a flow
 *  that satisfies the min flow requirements in which the
 *  result is returned
 */
function buildFlograph(g, k, C) {
	let fg = new Flograph(g.n*k+2, g.edgeRange+g.n*k);
	if (!fg.floor) fg.addEdgeProperty('floor', 0);
	fg.source = g.n*k+1; fg.sink = g.n*k+2;
	// first, build core edges, preserving edge numbers from g
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)]
		if (!g.isInput(u)) [u,v] = [v,u];
		let c = Math.ceil(g.floor(e));
		if (c <= k) {
			fg.join((u-1)*k + c, (v-1)*k + c, e); fg.cap(e, 1);
		}
	}
	// now, build remaining edges
	for (let u = 1; u <= g.n; u++) {
		let du = g.degree(u);
		if (g.isInput(u)) {  // u is an input
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
export function lowerBounds(g, gap=1) {
	return [degreeBound(g, gap), matchBound(g, gap), splitBound(g, gap)];
}

/** Return array of upper bounds on the number of colors required. */
export function upperBounds(g, gap=1) {
	let clone = Graph.clone(g);
	if (g.color) clone.resetColor();
	clone.setBipartition(g.getBipartition());
	becSplit(clone);
	let fmax = maxFloor(clone); let cmax = maxColor(clone);
	return [cmax, fmax + Math.max(...g.maxDegree())-1];
}
