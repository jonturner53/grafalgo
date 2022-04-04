/** @file maxflowVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import augment from './augment.mjs';

/** Verify a maximum flow.
 *  @param g is Flograph, with a maximum flow.
 *  @return the empty string if the flow on g is a maximum flow,
 *  or an error message, if it is not.
 */
export default function maxflowVerify(g) {
	for (let u = 1; u <= g.n; u++) {
		if (u == g.source || u == g.sink) continue;
		let s = 0;
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e)) {
			if (g.f(e) < g.floor(e) || g.f(e) > g.cap(e))
				return(`Error: capacity violation at ${g.edge2string(e)}`);
			s += g.f(e, u);
		}
		if (s != 0)
			return(`Error: unbalanced flow at vertex ${g.index2string(u)}`);
	}
	let reached = new Int8Array(g.n+1);
	let q = new List(g.n);
	q.enq(g.source); reached[g.source] = true;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e)) {
			if (g.res(e, u) == 0) continue;
			let v = g.mate(u, e);
			if (v == g.sink)
				return('Error: not a maximum flow');
			if (!reached[v]) q.enq(v);
			reached[v] = true;
		}
	}
	return '';
}
