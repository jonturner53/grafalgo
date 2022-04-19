/** @file mcflowVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertError } from '../../common/Errors.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import sptBM from '../spath/sptBM.mjs';

/** Verify a minimum cost flow.
 *  @param g is Flograph, with a minimum cost flow.
 *  @return the empty string if the flow on g is a min cost flow,
 *  or an error message, if it is not.
 */
export default function mcflowVerify(g) {
	// create residual graph of g
	let rg = new Digraph();
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = g.tail(e); let v = g.head(e);
		if (g.res(e,u) > 0) {
			let ee = rg.join(u,v); rg.setLength(ee, g.cost(e,u));
		}
		if (g.res(e,v) > 0) {
			let ee = rg.join(v,u); rg.setLength(ee, g.cost(e,v));
		}
	}
	try {
		sptBM(rg, 0);
	} catch (e) {
		if (e instanceof AssertError && 
            e.message.indexOf('negative cycle') >= 0)
			return 'Error: negative cycle in flow costs';
		else
			throw(e);
	}
	return '';
}
