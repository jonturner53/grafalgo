/** \file hardcase.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Graph from '../../dataStructures/graphs/Graph.mjs';
import { itint, isTint, maxTint, lowerBounds, upperBounds }
		from './common.mjs';

/** Generate a hard test case.
 *  @param n is the number of inputs
 *  @param gap is the nominal inter-tint spacing (used to model speedup in
 *  crossbar scheduling applications)
 *  @param fanGraph is a flag; if on, the returned graph is a FanGraph
 *  @return a graph with tints, together with an array of lower bounds
 *  on the optimal solution value and a second array of upper bounds
 */
export default function hardcase(n, gap=1, fanGraph=0) {
	let g = new Graph(3*n-1, n*n, ['tint',0]);
	g.setBipartition(n);
	for (let u = 1; u <= n; u++) {
		for (let i = 1; i <= u; i++) {
			let e = g.join(u, n+i);
			g.tint(e, Math.ceil(1+(gap*(i-1))));
		}
		for (let i = u+1; i <= n; i++) {
			let e = g.join(u, 2*n+u); g.tint(e, Math.ceil(1+(gap*(i-1))));
		}
	}

	let lb = lowerBounds(g,gap);
	let ub = [maxTint(g)+hardcaseUpperBound(n,gap), ...upperBounds(g,gap)]
	if (!fanGraph) return [g,lb,ub];

	fg = new FanGraph(3*n-1, n*n, 'tint', 0); fg.setBipartition(n);
	for (let e = g.first(); e; e = g.next(e)) {
		fg.join(g.left(e), g.right(e), e); fg.tint(e, g.tint(e));
	}
	return [fg,lb,ub];
}

/** Determine next smaller "bonus" color.
 *  @param c is a color
 *  @param gap is the tint spacing
 *  @return next smaller "bonus" color or 0 if none
 */
export function nextBonus(c, gap) {
	c--;
	while (c > 0 && isTint(c, gap)) c--
	return c;
}

/** Determine if hardcase instance can be colored with specified # of
 *  "extra colors"
 *  @param n specifies the size of the hardcase instance
 *  @param k specifies the number of extra colors that can be used
 *  @param gap is the tint spacing
 *  @return true if hardcase(n) can be colored with the larest color
 *  being <=fmax+k
 */
function hardcaseKcolorable(n, k, gap) {
	let row = n-k; let col = n-2*k; // top-left cell of first diagonal
	let bonus = nextBonus(itint(n,gap),gap);
	while (row >= 2*k+1 && col >= 1) {
		if (bonus == 0 || bonus < itint(col-1,gap)) return false;
		row -= 1; col -= 2; bonus = nextBonus(bonus,gap);
	}
	return true
}

/** Compute an upper bound on the number of tints that must be covered
 *  when coloring a hardcase instance.
 *  @param n is the size of the hardcase instance
 *  @param gap is the inter-tint spacing
 *  @return a the index of a tint that is an upper bound on the
 *  largest color that must be used to color hardcase(n)
 */
function hardcaseUpperBound(n, gap) {
	let lo = 0;
	let hi = Math.ceil((n-1)/3);

	while (hi > lo) {
		let mid = Math.floor((lo+hi)/2);
		if (hardcaseKcolorable(n, mid, gap))
			hi = mid;
		else
			lo = mid+1;
	}
	return hi;
}
