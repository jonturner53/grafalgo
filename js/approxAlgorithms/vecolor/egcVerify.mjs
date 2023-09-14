/** @file egcVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';

/** Verify an edge coloring in a bipartite graphs.
 *  @param egg is an EdgeGroupGraph
 *  @param egc is a EggColors object representing a coloring of egg
 *  @return a string which is empty if the coloring is a proper
 *  edge coloring with the minimum number of colors, otherwise an error string
 */
export default function egcVerify(egg, egc) {
	let ucolors = new List(egc.nc);
	for (let u = 1; u <= egg.n; u++) {
		ucolors.clear();
		if (u <= egg.ni) {
			for (let g = egg.firstGroupAt(u); g; g = egg.nextGroupAt(u,g)) {
				for (let e = egg.firstInGroup(g); e; e = egg.nextInGroup(g,e)) {
					let c = egc.color(e);
					if (ucolors.contains(c))
						return `color ${c} of edge ${egg.e2s(e)} in group ` +
							   `${egg.g2s(g)} conflicts with another edge ` +
							   `at input ${egg.x2s(u)}`;
				}
				for (let e = egg.firstInGroup(g); e; e = egg.nextInGroup(g,e)) {
					if (!ucolors.contains(egc.color(e)))
						ucolors.enq(egc.color(e));
				}
			}
		} else {
			for (let e = egg.firstAt(u); e; e = egg.nextAt(u,e)) {
				let c = egc.color(e);
				if (ucolors.contains(c)) {
					return `color ${c} of edge ${egg.e2s(e)} conflicts with ` +
						   `another edge at output ${egg.x2s(u)}`;
				}
				ucolors.enq(c);
			}
		}
	}
	return '';
}
