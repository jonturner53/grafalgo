/** @file flowBound.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import findSplit from '../../graphAlgorithms/misc/findSplit.mjs';
import flowfloor from '../../graphAlgorithms/maxflow/flowfloor.mjs';
import degreeBound from './degreeBound.mjs';
import matchBound from './matchBound.mjs';

/** Compute the flow lower bound on the bounded chromatic index.
 *  @param g is a graph with edge bounds
 *  @return the lower bound
 */
export default function flowBound(g) {
	let subsets = findSplit(g);
	if (!subsets) return 0;
	
	let bmax = 1;
	for (let e = g.first(); e; e = g.next(e)) 
		bmax = Math.max(bmax, g.bound(e));

	// binary search to find largest C for which graph is not C-colorable
	// start by finding upper bound.
	let k0 = Math.ceil(bmax/2);
	let lo = Math.max(degreeBound(g), matchBound(g)) - 1;
	let hiMax = bmax + g.maxDegree();
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

		for (k = bmax; k >= 1; k--) {
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
 *  @param g is a bipartite graph with edge color bounds
 *  @param subsets is a ListPair that defines bipartition on g
 *  @param k is the largest bound to consider when constructing fg;
 *  that is, only incorporate edges from g that have bounds <= k
 *  @param C is the target maximum color for lower bound computation
 *  @return a flow graph with min flow requirements; if there is a flow
 *  that satisfies the min flow requirements in which the
 *  result is returned
 */
function buildFlograph(g, subsets, k, C) {
	let fg = new Flograph(g.n*k+2, g.edgeRange+g.n*k);
	fg.setSource(g.n*k+1); fg.setSink(g.n*k+2);
	// first, build core edges, preserving edge numbers from g
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)]
		if (!subsets.in(u,1)) [u,v] = [v,u];
		let c = Math.ceil(g.bound(e));
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
