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
import maxflowPPf from '../../graphAlgorithms/maxflow/maxflowPPf.mjs';
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

could speed up by extending previous matching rather
than computing from scratch each time
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
	let d = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) d[u] = g.degree(u);
	let fmax = maxFloor(g);

	let fg = buildFlograph(g,fmax);

	// find good bounds for binary search
	let lo = Math.max(degreeBound(g,gap), matchBound(g,gap));
	let delta = 2; let hi = lo+delta;
	while(1) {
		if (check4split(g,d,fmax,fg,hi)) break;
		lo = hi+1; delta *= 2; hi = lo+delta;
	}

	// perform binary search to find smallest C for which graph
	// can be split
	while (lo < hi) {
		let mid = Math.floor((lo+hi)/2);
		if (check4split(g,d,fmax,fg,mid)) {
			hi = mid;
		} else {
			lo = mid+1;
		}
	}
	return hi;
}

/** Construct flow graph for determining split lower bound.
 *  @param g is a bipartite graph with edge color floors
 *  @param fmax is the largest floor value in g
 *  @return a flow graph with min flow requirements; if there is a flow
 *  that satisfies the min flow requirements in which the
 *  result is returned
 */
function buildFlograph(g, fmax) {
	// create and configure flow graph
	let fg = new Flograph(g.n*fmax+4, g.edgeRange+g.n*(fmax+1)+3);
	fg.addEdgeProperty('floor', 0);
		// note: fg.floor is min flow requirement,
		// g.floor is minimum color
	let s = fg.n-3; let t = fg.n-2;
	fg.source = fg.n-1;  fg.sink = fg.n;

	// now, build core edges, preserving edge numbers from g
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)]
		if (!g.isInput(u)) [u,v] = [v,u];
		let f = g.floor(e);
		fg.join((u-1)*fmax + f, (v-1)*fmax + f, e);
		fg.cap(e, 1);
	}
	// now, build s/t, source/sink and chain edges
	fg.join(fg.source,t);
	for (let u = 1; u <= g.n; u++) {
		let u1 = (u-1)*fmax+1; // where source/sink edges attach
		if (g.isInput(u)) {  // u is an input
			for (let i = u1; i < u1+fmax-1; i++) fg.join(i, i+1);
			fg.join(fg.source, u1); fg.join(s, u1);
				// in Flograph incoming edges inserted at front of
				// endpoint lists
		} else { // u is an output
			fg.join(u1,t); fg.join(u1,fg.sink);
			for (let i = u1; i < u1+fmax-1; i++) fg.join(i+1, i);
		}
	}
	fg.join(s,fg.sink); // this edge is first into fg.sink

	// and last edge
	let e = fg.join(t,s); fg.cap(e,fmax*g.n);

	return fg;
}

/** Determine if a split is possible on a specified color.
 *  @param g is original graph
 *  @param d is array of vertex degrees in g
 *  @param fmax is largest floor
 *  @param fg is the flow graph used to determine if g can be split
 *  @param C is a color
 *  @return true if g can be split into subgraphs H and J for all h
 *  in [1,fmax] or false if not; H is a subgraph of G_h which has
 *  a degree bound of h and J is the remaining edges of G and has
 *  maximum degree <=C-h
 */
function check4split(g, d, fmax, fg, C) {
	fg.clearFlow();
	for (let h = 1; h <= fmax ; h++) {
		adjustCapacities(g, d, fmax, fg, C, h);
		maxflowPPf(fg); // flow added for each successive value of h;
					    // works since capacities increase with h
		for (let e = fg.firstOutof(fg.source); e;
				 e = fg.nextOutof(fg.source,e)) {
			if (fg.flow(e) != fg.cap(e)) {
				return false;
			}
		}
	}
	return true;
}

/** Adjust edge capacities in flow graph for new value of h.
 *  @param g is original graph
 *  @param d is array of vertex degrees in g
 *  @param fmax is largest floor
 *  @param fg is the flow graph used to determine if g can be split
 *  @param C is a color
 *  @param h is a second color
 *  @param on return the edge capacities have been adjusted so that
 *  the part of fg that is reachable from the source corresponds to G_h
 */
function adjustCapacities(g, d, fmax, fg, C, h) {
	let sourceCap = 0; // total capacity of source edges to core
	let sinkCap = 0;   // total capacity of sink edges from core
	for (let u = 1; u <= g.n; u++) {
		let u1 = (u-1)*fmax+1; // where source/sink edges attach
		if (g.isInput(u)) {
			let e = fg.firstInto(u1);   fg.cap(e,  Math.min(h,C-d[u]));
			let ee = fg.nextInto(u1,e); fg.cap(ee, Math.max(0,d[u]-(C-h)));
			sourceCap += fg.cap(ee); let ecap = h;
			for (let i = u1; ecap; i++) { // chain capacities
				fg.cap(fg.firstInto(i+1), --ecap);
			}
		} else {
			let e = fg.firstOutof(u1);   fg.cap(e,  Math.min(h,C-d[u]));
			let ee = fg.nextOutof(u1,e); fg.cap(ee, Math.max(0,d[u]-(C-h)));
			sinkCap += fg.cap(ee); let ecap = h;
			for (let i = u1; ecap; i++) {
				fg.cap(fg.firstOutof(i+1), --ecap);
			}
		}
	}
	fg.cap(fg.firstInto(fg.sink), sourceCap);
	fg.cap(fg.firstOutof(fg.source), sinkCap);
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
