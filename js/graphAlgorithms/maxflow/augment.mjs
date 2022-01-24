/** @file augment.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';

/** Add flow to source/sink path.
 *  @param g is a flow graph
 *  @param pedge is an array of parent edge pointers; that is,
 *  pedge[u] is the edge to u from its parent in a shortest path tree.
 *  @param trace is a flag which controls generation of trace information
 *  @return pair [f,ts] where f is the amount of flow added to the path
 *  and ts is a trace string
 */
export default function augment(g, pedge, trace=false) {
	let f = Infinity; let ts = g.index2string(g.sink);
	let v = g.sink; let e = pedge[v];
	while (v != g.source) {
		let u = g.mate(v, e);
		if (trace)
			ts = `${g.index2string(u)}:${g.res(e, u)} ${ts}`;
		f = Math.min(f, g.res(e, u));
		v = u; e = pedge[v];
	}
	v = g.sink; e = pedge[v];
	while (v != g.source) {
		let u = g.mate(v, e);
		g.addFlow(e, u, f);
		v = u; e = pedge[v];
	}
	return [f,ts];
}
