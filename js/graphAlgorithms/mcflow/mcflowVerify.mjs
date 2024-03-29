/** @file mcflowVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../common/Assert.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import sptBM from '../spath/sptBM.mjs';

/** Verify a minimum cost flow.
 *  @param g is Flograph, with a minimum cost flow.
 *  @return the empty string if the flow on g is a min cost flow,
 *  or an error message, if it is not.
 */
export default function mcflowVerify(g) {
	// create residual graph of g
	let rg = new Digraph(g.n,2*g.m);
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = g.tail(e); let v = g.head(e);
		if (g.res(e,u) > 0) {
			let ee = rg.join(u,v); rg.length(ee, g.costFrom(e,u));
		}
		if (g.res(e,v) > 0) {
			let ee = rg.join(v,u); rg.length(ee, g.costFrom(e,v));
		}
	}
	let [spt] = sptBM(rg, 0);
	if (!spt)
		return 'Error: negative cycle on edges with positive residual capacity';

	for (let u = 1; u <= g.n; u++) {
		if (u == g.source || u == g.sink) continue;
		let s = 0;
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
			s += g.f(e,u);
		if (s != 0)
			return `Error: ${g.x2s(u)} violates flow conservation`;
	}
	return '';
}
