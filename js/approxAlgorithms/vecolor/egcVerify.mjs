/** @file egcVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert} from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';

/** Verify an edge coloring in a bipartite graphs.
 *  @param eg is an EdgeGroups object
 *  @param egc is a EggColors object representing a coloring of eg
 *  @return a string which is empty if the coloring is a proper
 *  edge coloring with the minimum number of colors, otherwise an error string
 */
export default function egcVerify(eg, egc) {
	let ucolors = new List(egc.nc);
	for (let e = eg.graph.first(); e; e = eg.graph.next(e)) {
		if (!egc.color(e))
			return `edge ${eg.graph.e2s(e)} is uncolored`;
	}
	for (let u = 1; u <= eg.graph.n; u++) {
		ucolors.clear();
		if (u <= eg.n_i) {
			for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) {
				for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
					let c = egc.color(e);
					if (egc.owner(c,u) != g)
						return `color ${c} of edge ${eg.graph.e2s(e)} in group ` +
							   `${eg.g2s(g)} does not belong to ${eg.g2s(g)}`;
					if (ucolors.contains(c))
						return `color ${c} of edge ${eg.e2s(e)} in group ` +
							   `${eg.g2s(g)} conflicts with another edge ` +
							   `at input ${eg.x2s(u)}`;
					if (eg.hasBounds && c < eg.bound(g))
						return `color ${c} of edge ${eg.e2s(e)} in group ` +
							   `${eg.g2s(g)} conflicts with bound ${eg.bound(g)}`;
							   `at input ${eg.x2s(u)}`;
				}
				for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
					if (egc.color(e) && !ucolors.contains(egc.color(e)))
						ucolors.enq(egc.color(e));
				}
			}
		} else {
			for (let e = eg.graph.firstAt(u); e; e = eg.graph.nextAt(u,e)) {
				let c = egc.color(e);
				if (ucolors.contains(c)) {
					return `color ${c} of edge ${eg.graph.e2s(e)} conflicts with ` +
						   `another edge at output ${eg.x2s(u)}`;
				}
				ucolors.enq(c);
			}
		}
	}
	return '';
}
