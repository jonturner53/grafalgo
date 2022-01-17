/** @file common.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';

/** This module contains methods that are useful in mulitple
 *  max flow algorithms.
 */

/** Add flow to source/sink path defined by pedge array
 *  @param g is a flow graph
 *  @param pedge is an array of parent edge pointers; that is,
 *  pedge[u] is the edge to u from its parent in a shortest path tree.
 *  @return the amount of low added to the path
 */
export function augment(g, pedge, trace=false) {
	let f = Infinity; let ts = '';
	let v = g.sink; let e = pedge[v];
	while (v != g.source) {
		if (trace) ts = g.edge2string(e) + ' ' + ts;
		let u = g.mate(v, e);
		f = Math.min(f, g.res(e, u));
		v = u; e = pedge[v];
	}
	if (trace) ts = f + ' ' + ts;
	v = g.sink; e = pedge[v];
	while (v != g.source) {
		let u = g.mate(v, e);
		g.addFlow(e, u, f);
		v = u; e = pedge[v];
	}
	return [f,ts];
}
