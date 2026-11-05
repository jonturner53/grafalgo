/** @file common.mjs
 * 
 *  @author Jon Turner
 *  @date 2026
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled as ae } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import FanGraph from './fanGraph.mjs';
import matchEG from '../../graphAlgorithms/match/matchEG.mjs';
import maxflowPPf from '../../graphAlgorithms/maxflow/maxflowPPf.mjs';
import becolorSplit from './becolorSplit.mjs';

// 
// The following methods are used when generating unique tints
// at each input, while taking into account the effect of
// "speedup". Speedup is modeled by introducing a minimum spacing
// between consecutive tints (called the "gap").
// A color c is a tint if for some integer, i>=0 c-1 < 1+i*gap <= c.
//

/** Determine the tint value for a specified index and gap.
 *  @param i is a positive integer
 *  @param gap is the nominal inter-tint spacing
 *  @return the i-th tint value
 */
export function itint(i, gap) {
	return 1 + Math.ceil((i-1)*gap);
}

/** Determine the number of tints upper-bounded by a given color
 *  @param c is a color
 *  @param gap is the tint spacing
 *  @return the number of tints <=c.
 */
export function tintCount(c, gap) {
	return 1 + Math.floor((c-1)/gap);
}

/** Determine the index of next tint lower-bounded by a given color
 *  @param c is a color
 *  @param gap is the tint spacing
 *  @return the index of the smallest tint value >=c
 */
export function tintIndex(c, gap) {
	return tintCount(isTint(c,gap) ? c : c+1, gap);
}

/** Determine if a color is a tint.
 *  @param c is a color
 *  @param gap is the tint spacing
 *  @return the true if c is a legitimate tint value
 */
export function isTint(c, gap) {
	return tintCount(c, gap) != tintCount(c-1, gap);
}

/** Determine the largest tint for a graph */
export function maxTint(g) {
	if (g.constructor.name == 'FanGraph')
		return g.maxTint();
	let max = 0;
	for (let e = g.first(); e; e = g.next(e))
		max = Math.max(max, g.tint(e));
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

/** Compute lower bound on the required number of colors
 *  using the degree bound method.
 *  @param g is a Graph or FanGraph with edge tints
 *  @param gap is the nominal inter-tint spacing
 *  @return the lower bound
 */
export function degreeBound(g, gap=1) {
	ae() && assert(g.tint);
	let lb = 0;
	if (g.constructor.name == 'FanGraph') {
		for (let v = g.ni+1; v <= g.n; v++) {
			let d = g.degree(v);
			let evec = []; let i = 0;
		  	for (let e = g.firstAt(v); e; e = g.nextAt(v,e))
				evec[i++] = e;
			evec.sort((e1,e2)=>g.tint(g.fan(e1))-g.tint(g.fan(e2)));
			i = 1;
			for (let e of evec) {
		        lb = Math.max(lb, g.tint(g.fan(e)) + (d-i++));
			}
		}
	} else {
		// this version does not require bipartite graph
		for (let u = 1; u <= g.n; u++) {
			let d = g.degree(u);
			let evec = []; let i = 0;
		  	for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
				evec[i++] = e;
			evec.sort((e1,e2)=>g.tint(e1)-g.tint(e2));
			i = 1;
			for (let e of evec) {
		        lb = Math.max(lb, g.tint(e) + (d-i++));
			}
	    }
	}
	return lb;
}

/** Compute lower bound on the required number of colors
 *  using the matching bound method.
 *  @param g is a Graph (not a FanGraph) with edge tints
 *  @param gap is the inter-tint spacing
 *  @return the lower bound
 */
export function matchBound(g, gap=1) {
	ae() && assert(g.tint);
	let fc = new Graph(g.n, g.edgeRange);
	let total = 0; let c; let cmax=0;
	for (c = 1; total < g.m; c++) {
		// construct G_c (by adding edges to previous G_c)
		// could speed this up by first sorting edges by tint
		for (let e = g.first(); e; e = g.next(e)) {
			if (g.tint(e) == c) fc.join(g.left(e), g.right(e), e);
		}
		// find max matching in fc and add its size to total
		let [match] = matchEG(fc);
		total += match.size();
	}
	return Math.max(c-1, maxTint(g));
}

/** Compute lower bound on the required number of colors
 *  using the input/output count method
 *  @param g is a Graph or FanGraph with edge tints
 *  @param gap is the inter-tint spacing
 *  @return the lower bound
 */
export function iocntBound(g, gap=1) {
	ae() && assert(g.tint);
	let minTint = new Int32Array(g.n+1).fill(g.m);
	if (g.constructor.name == 'FanGraph') {
		// when coloring fans, bound uses only output counts
		for (let e = g.first(); e; e = g.next(e)) {
			let v = g.output(e);
			minTint[v] = Math.min(minTint[v], g.tint(g.fan(e)));
		}
		// minTint[v] is now smallest tint for an edge at v
		let ocnt = new Int32Array(g.m+1); // # of outputs with a tint<=c
		for (let v = g.ni+1; v <= g.n; v++) ocnt[minTint[v]]++;
		for (let c = 1; c < ocnt.length ; c++) ocnt[c] += ocnt[c-1];
		// ocnt[c] is now # of outputs in G_c with at least one edge
		let c; let ecount = 0;
		for (c = 1; ecount < g.m; c++) ecount += ocnt[c];
		return Math.max(c-1, maxTint(g));
	}
	// no-fan case based on counts at both inputs and outputs
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.input(e),g.output(e)];
		minTint[u] = Math.min(minTint[u], g.tint(e));
		minTint[v] = Math.min(minTint[v], g.tint(e));
	}
	let icnt = new Int32Array(g.m+1); // # of  inputs with a tint<=c
	for (let u = 1; u <= g.ni; u++) icnt[minTint[u]]++;
	for (let c = 1; c <= icnt.length; c++) icnt[c] += icnt[c-1];
	let ocnt = new Int32Array(g.m+1); // # of outputs with a tint<=c
	for (let v = g.ni+1; v <= g.n; v++) ocnt[minTint[v]]++;
	for (let c = 1; c < ocnt.length ; c++) ocnt[c] += ocnt[c-1];

	let c; let ecount = 0;
	for (c = 1; ecount < g.m; c++) ecount += Math.min(icnt[c], ocnt[c]);
	return Math.max(c-1, maxTint(g));
}

/** Compute lower bound on the number of distinct tints covered
 *  by a coloring using the split bound method.
 *  @param g is a Graph with edge tints
 *  @param gap is the nominal inter-tint spacing
 *  @return the lower bound
 */
export function splitBound(g, gap=1) {
	ae() && assert(g.tint);
	let d = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) d[u] = g.degree(u);
	let tmax = maxTint(g);

	let fg = buildFlograph(g,tmax);

	// find good bounds for binary search
	let lo = Math.max(degreeBound(g,gap), matchBound(g,gap));
	let delta = 2; let hi = lo+delta;
	while(1) {
		if (check4split(g,d,tmax,fg,hi)) break;
		lo = hi+1; delta *= 2; hi = lo+delta;
	}
	// perform binary search to find smallest C for which graph
	// can be split
	while (lo < hi) {
		let mid = Math.floor((lo+hi)/2);
		if (check4split(g,d,tmax,fg,mid)) {
			hi = mid;
		} else {
			lo = mid+1;
		}
	}
	return hi;
}

/** Construct flow graph for determining split lower bound (split helper).
 *  @param g is a bipartite graph with edge tints
 *  @param tmax is the largest tint in g
 *  @return a flow graph with min flow requirements; if there is a flow
 *  that satisfies the min flow requirements in which the
 *  result is returned
 */
function buildFlograph(g, tmax) {
	// create and configure flow graph
	let fg = new Flograph(g.n*tmax+4, g.edgeRange+g.n*(tmax+1)+3);
	fg.addEdgeProperty(['tint',0]);
		// note: fg.tint is min flow requirement,
		// g.tint is minimum color
	let s = fg.n-3; let t = fg.n-2;
	fg.source = fg.n-1;  fg.sink = fg.n;

	// now, build core edges, preserving edge numbers from g
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)]
		if (!g.isInput(u)) [u,v] = [v,u];
		let f = g.tint(e);
		fg.join((u-1)*tmax + f, (v-1)*tmax + f, e);
		fg.cap(e, 1);
	}
	// now, build s/t, source/sink and chain edges
	fg.join(fg.source,t);
	for (let u = 1; u <= g.n; u++) {
		let u1 = (u-1)*tmax+1; // where source/sink edges attach
		if (g.isInput(u)) {  // u is an input
			for (let i = u1; i < u1+tmax-1; i++) fg.join(i, i+1);
			fg.join(fg.source, u1); fg.join(s, u1);
				// in Flograph incoming edges inserted at front of
				// endpoint lists
		} else { // u is an output
			fg.join(u1,t); fg.join(u1,fg.sink);
			for (let i = u1; i < u1+tmax-1; i++) fg.join(i+1, i);
		}
	}
	fg.join(s,fg.sink); // this edge is first into fg.sink

	// and last edge
	let e = fg.join(t,s); fg.cap(e,tmax*g.n);

	return fg;
}

/** Determine if a split is possible on a specified color (split helper).
 *  @param g is original graph
 *  @param d is array of vertex degrees in g
 *  @param tmax is largest tint
 *  @param fg is the flow graph used to determine if g can be split
 *  @param C is a color
 *  @return true if g can be split into subgraphs H and J for all h
 *  in [1,tmax] or false if not; H is a subgraph of G_h which has
 *  a degree bound of h and J is the remaining edges of G and has
 *  maximum degree <=C-h
 */
function check4split(g, d, tmax, fg, C) {
	fg.clearFlow();
	for (let h = 1; h <= tmax ; h++) {
		adjustCapacities(g, d, tmax, fg, C, h);
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

/** Adjust edge capacities in flow graph for new value of h (split helper).
 *  @param g is original graph
 *  @param d is array of vertex degrees in g
 *  @param tmax is largest tint
 *  @param fg is the flow graph used to determine if g can be split
 *  @param C is a color
 *  @param h is a second color
 *  @param on return the edge capacities have been adjusted so that
 *  the part of fg that is reachable from the source corresponds to G_h
 */
function adjustCapacities(g, d, tmax, fg, C, h) {
	let sourceCap = 0; // total capacity of source edges to core
	let sinkCap = 0;   // total capacity of sink edges from core
	for (let u = 1; u <= g.n; u++) {
		let u1 = (u-1)*tmax+1; // where source/sink edges attach
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

// Upper bounds for FanGraphs

/** Upper bound based on layer method with arbitrary assignment of
 *  fans to layers.
 */
export function layerBound(g) {
	let f = new Int32Array(g.ni+1);
	for (let u = 1; u <= g.ni; u++) f[u] = g.firstFanAt(u);
	let ocnt = new Int32Array(g.n+1); let totalWidth = 0;
	let done = 0;
	while (!done) {
		// count the number of times each output is used by fans in f
		ocnt.fill(0); let width = 0;
		for (let u = 1; u <= g.ni; u++) {
			if (!f[u]) continue;
			for (let e = g.firstEdgeIn(f[u]); e; e = g.nextEdgeIn(f[u],e)) {
				let v = g.output(e);
				width = Math.max(width, ++ocnt[v]);
			}
		}
		totalWidth += width;
		done = 1;
		for (let u = 1; u <= g.ni; u++) {
			if (f[u]) f[u] = g.nextFanAt(u,f[u]);
			if (f[u]) done = 0; 
		}
	}
	return totalWidth;
}

/** Compute randomized upper bound on colors.
 *  @param fcmax is max input fan count
 *  @param odmax is max output degree
 *  @param no is number of outputs
 *  @return randomized upper bound

think harder about this, relative to Pippenger bound.
he shows existence of a solution among all palettes;
I show probability > 1/2 for random choice of palettes
implying that for this k, there must exist a solution,
so why isn't his bound at least as strong as mine??

If I don't find a solution after a given number of attempts,
it only means there probably isn't one. Of course if I use
binary search to keep looking until I succeed, then I am never
wrong, but my best solution may exceed the bound.

one can also ask why kkp is not better than ym since it only
assigns colors to palettes, not to edges, leaving more flexibility;
here the reason is that kkp proof does not use that flexibility.

 */
export function randomPaletteBound(fcmax, odmax, no) {
	let k = Math.ceil(2*Math.sqrt((Math.log(2*odmax*no) /
								   Math.log(Math.log(2*odmax*no)))));
	return k * Math.max(fcmax, odmax);
}

export function kkpBound(fcmax, odmax, no) {
	return (fcmax-1) * Math.floor(Math.log2(2*no)) + 2*odmax;
}

/** Compute worst-case upper bounds on colors.
 *  @param fcmax is max fan count
 *  @param odmax is max output degree
 *  @param no is number of outputs
 *  @return vector [rand,kkp,ym] of upper bounds, where rand is the randomized
 *  upper bound, kkp is Kirkpatrick, Klawe and Pippenger bound, ym is the
 *  Yang and Masson bound
 */
export function ymBound(fcmax, odmax, no) {
	let k = 2;
	let b0 = (fcmax-1)*k + (odmax-1)*(no**(1/k)) + 1;
	let b1 = (fcmax-1)*(k+1) + (odmax-1)*(no**(1/(k+1))) + 1;
	while (b0 > b1) {
		k++;
		b0 = b1;
		b1 = (fcmax-1)*(k+1) + (odmax-1)*(no**(1/(k+1))) + 1;
	}
	return Math.ceil(b0);
}

/** Return array of lower bounds on the number of colors required. */
export function lowerBounds(g, gap=1) {
	return g.constructor.name == 'FanGraph' ?
				(g.tint ? [degreeBound(g,gap), iocntBound(g,gap)] :
						  [Math.max(g.maxFanCount(), g.maxDegree()[1])]) :
				(g.m > 500 ?
					[degreeBound(g,gap), matchBound(g,gap)] : 
					[degreeBound(g,gap), matchBound(g,gap), splitBound(g,gap)]);
}

/** Return array of upper bounds on the number of colors required. */
export function upperBounds(g, gap=1) {
	let tmax = (g.tint ? maxTint(g) : 1);
	if (g.constructor.name == 'FanGraph') {
		let fcmax = g.maxFanCount();
		let [,odmax] = g.maxDegree();
		let no = g.no;
		return [(tmax-1) + layerBound(g),
				(tmax-1) + ymBound(fcmax,odmax,no),
				(tmax-1) + kkpBound(fcmax,odmax,no)];
	} else {
		let clone = Graph.clone(g);
		if (g.color) clone.reset_color();
		clone.setBipartition(g.getBipartition());
		becolorSplit(clone);
		let cmax = maxColor(clone);
		return [cmax, (tmax-1) + Math.max(...g.maxDegree())];
	}
}
