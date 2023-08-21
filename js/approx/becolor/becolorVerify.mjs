/** @file becolorVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ecolorVerify from '../../graphAlgorithms/ecolor/ecolorVerify.mjs';

/** Verify an edge coloring in a bipartite graphs.
 *  @param g is a bipartite graph with weights, representing colors
 *  @return a string which is empty if the coloring is a proper
 *  edge coloring with the minimum number of colors, otherwise an error string
 */
export default function becolorVerify(g,color) {
	let s = ecolorVerify(g,color);
	if (s) return s;
	for (let e = g.first(); e; e = g.next(e)) {
		if (color[e] < g.bound(e)) 
			return `color ${color[e]} of edge ${g.e2s(e)} ` +
				   `violates its bound ${g.bound(e)}`;
	}
	return '';
}
