/** @file becDegreeBound.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Compute lower bound on the bounded chromatic index using
 *  the degree bound method.
 *  @param g0 is a graph with color bounds.
 *  @return the lower bound.
 */
export default function becDegreeBound(g0) {
	let g = new Graph(); g.assign(g0);
	g.sortAllEplists((e1,e2) => g.bound(e1) - g.bound(e2));
	let lb = 0;
    for (let u = 1; u <= g.n; u++) {
		let d = g.degree(u); let i = 1;
        for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) 
            lb = Math.max(lb, Math.ceil(g.bound(e)) + (d-i++));
    }
	return lb;
}
