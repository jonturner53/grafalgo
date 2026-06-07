/** \file becHardCase.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertEnabled as ae } from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { ifloor, isFloor, maxFloor, lowerBounds, upperBounds }
		from './becCommon.mjs';

/** Generate a hard test case.
 *  @param n is the number of inputs
 *  @param gap is the nominal inter-floor spacing (used to model speedup in
 *  crossbar scheduling applications)
 *  @return a graph with floors, together with an array of lower bounds
 *  on the optimal solution value and a second array of upper bounds
 */
export default function becHardCase(n, gap=1) {
	let g = new Graph(3*n-1, n*n, 'floor', 0);
	g.setBipartition(n);
	for (let u = 1; u <= n; u++) {
		for (let i = 1; i <= u; i++) {
			let e = g.join(u, n+i);
			g.floor(e, Math.ceil(1+(gap*(i-1))));
		}
		for (let i = u+1; i <= n; i++) {
			let e = g.join(u, 2*n+u); g.floor(e, Math.ceil(1+(gap*(i-1))));
		}
	}

	return [g, lowerBounds(g,gap),
			   [maxFloor(g)+hardCaseUpperBound(n,gap), ...upperBounds(g,gap)]];
}

/** Determine next smaller "bonus" color.
 *  @param c is a color
 *  @param gap is the floor spacing
 *  @return next smaller "bonus" color or 0 if none
 */
export function nextBonus(c, gap) {
	c--;
	while (c > 0 && isFloor(c, gap)) c--
	return c;
}

/** Determine if hardcase instance can be colored with specified # of
 *  "extra colors"
 *  @param n specifies the size of the hardcase instance
 *  @param k specifies the number of extra colors that can be used
 *  @param gap is the floor spacing
 *  @return true if hardcase(n) can be colored with the larest color
 *  being <=fmax+k
 */
function hardCaseKcolorable(n, k, gap) {
	let row = n-k; let col = n-2*k; // top-left cell of first diagonal
	let bonus = nextBonus(ifloor(n,gap),gap);
	while (row >= 2*k+1 && col >= 1) {
		if (bonus == 0 || bonus < ifloor(col-1,gap)) return false;
		row -= 1; col -= 2; bonus = nextBonus(bonus,gap);
	}
	return true
}

/** Compute an upper bound on the number of floors that must be covered
 *  when coloring a hardcase instance.
 *  @param n is the size of the hardcase instance
 *  @param gap is the inter-floor spacing
 *  @return a the index of a floor that is an upper bound on the
 *  largest color that must be used to color hardcase(n)
 */
function hardCaseUpperBound(n, gap) {
	let lo = 0;
	let hi = Math.ceil((n-1)/3);

	while (hi > lo) {
		let mid = Math.floor((lo+hi)/2);
		if (hardCaseKcolorable(n, mid, gap))
			hi = mid;
		else
			lo = mid+1;
	}
	return  hi;
}
