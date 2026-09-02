/** @file verify.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import FanGraph from './FanGraph.mjs';
import ecolorVerify from '../../graphAlgorithms/ecolor/ecolorVerify.mjs';

/** Verify an edge coloring in a bipartite graphs.
 *  @param g is a bipartite graph with weights, representing colors
 *  @return a string which is empty if the coloring is a proper
 *  edge coloring with the minimum number of colors, otherwise an error string
 */
export default function verify(g) {
	if (!(g instanceof FanGraph)) {
		let s = ecolorVerify(g);
		if (s) return s;
		for (let e = g.first(); e; e = g.next(e)) {
			if (g.color(e) < g.tint(e)) 
				return `color ${g.color(e)} of edge ${g.e2s(e)} ` +
					   `violates its tint ${g.tint(e)}`;
		}
		return '';
	}
	// FanGraph case
	let ucolors = new List(g.cmax);
	for (let e = g.first(); e; e = g.next(e)) {
		if (!g.color(e))
			return `edge ${g.e2s(e)} is uncolored`;
	}
	for (let u = 1; u <= g.n; u++) {
		ucolors.clear();
		if (u <= g.ni) {
			for (let f = g.firstGroupAt(u); f; f = g.nextGroupAt(u,f)) {
				for (let e = g.firstEdgeIn(f); e; e = g.nextEdgeIn(f,e)) {
					let c = g.color(e);
					if (g.owner(c,u) != f)
						return `color ${c} of edge ${g.e2s(e)} in group ` +
							   `${g.g2s(f)} does not belong to ${g.g2s(f)}`;
					if (ucolors.contains(c))
						return `color ${c} of edge ${g.e2s(e)} in group ` +
							   `${g.g2s(f)} conflicts with another edge ` +
							   `at input ${g.x2s(u)}`;
					if (g.tint && c < g.tint(f))
						return `color ${c} of edge ${g.e2s(e)} in group ` +
							   `${g.g2s(f)} conflicts with tint ` +
							   `${g.tint(f)} at input ${g.x2s(u)}`;
				}
				for (let e = g.firstEdgeIn(f); e; e = g.nextEdgeIn(f,e)) {
					if (g.color(e) && !ucolors.contains(g.color(e)))
						ucolors.enq(g.color(e));
				}
			}
		} else {
			for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
				let c = g.color(e);
				if (ucolors.contains(c)) {
					return `color ${c} of edge ${g.e2s(e)} conflicts ` +
						   `with another edge at output ${g.x2s(u)}`;
				}
				ucolors.enq(c);
			}
		}
	}
	return '';
}
