/** @file ecolorVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';

/** Verify an edge coloring in a bipartite graphs.
 *  @param g is a bipartite graph with weights, representing colors
 *  @return a string which is empty if the coloring is a proper
 *  edge coloring with the minimum number of colors, otherwise an error string
 */
export default function ecolorVerify(g) {
	let Delta = g.maxDegree();
	let colors = new List(g.n); let cmax = 0;
	for (let u = 1; u <= g.n; u++) {
		colors.clear();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			let c = g.weight(e); cmax = Math.max(c,cmax);
			if (c < 1 || c != ~~c) {
				return `invalid color ${c}$ assigned to ${g.edge2string(e)}`;
			}	
			if (colors.contains(c)) {
				return `two edges at ${g.index2string(u)} share color ${c}`;
			}
			colors.enq(c);
		}
	}
	return (cmax == Delta ? '' : 'too many colors');
}
