/** @file verifyEgc.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';

/** Verify an edge coloring in a bipartite graphs.
 *  @param egg is an EGGraph object
 *  @return a string which is empty if the coloring is a proper bounded
 *  edge coloring, otherwise an error string
 */
export default function verifyEgc(egg) {
	let ucolors = new List(egg.cmax);
	for (let e = egg.first(); e; e = egg.next(e)) {
		if (!egg.color(e))
			return `edge ${egg.e2s(e)} is uncolored`;
	}
	for (let u = 1; u <= egg.n; u++) {
		ucolors.clear();
		if (u <= egg.ni) {
			for (let g = egg.firstGroupAt(u); g; g = egg.nextGroupAt(u,g)) {
				for (let e = egg.firstEdgeIn(g); e; e = egg.nextEdgeIn(g,e)) {
					let c = egg.color(e);
					if (egg.owner(c,u) != g)
						return `color ${c} of edge ${egg.e2s(e)} in group ` +
							   `${egg.g2s(g)} does not belong to ${egg.g2s(g)}`;
					if (ucolors.contains(c))
						return `color ${c} of edge ${egg.e2s(e)} in group ` +
							   `${egg.g2s(g)} conflicts with another edge ` +
							   `at input ${egg.x2s(u)}`;
					if (egg.floor && c < egg.floor(g))
						return `color ${c} of edge ${egg.e2s(e)} in group ` +
							   `${egg.g2s(g)} conflicts with floor ` +
							   `${egg.floor(g)} at input ${egg.x2s(u)}`;
				}
				for (let e = egg.firstEdgeIn(g); e; e = egg.nextEdgeIn(g,e)) {
					if (egg.color(e) && !ucolors.contains(egg.color(e)))
						ucolors.enq(egg.color(e));
				}
			}
		} else {
			for (let e = egg.firstAt(u); e; e = egg.nextAt(u,e)) {
				let c = egg.color(e);
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
