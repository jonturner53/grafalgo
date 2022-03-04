/** @file maxflowPPf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowPP from './maxflowPP.mjs';

/** Compute a maximum flow in a graph using the fifo version of
 *  Goldman & Tarjan's push-relabel algorithm.
 *  @param g is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to g
 */
export default function maxflowPPf(g, trace=false, relabThresh=g.m) {
	let unbal = new ListSet(g.n);
	let ubvec = new Int32Array(2*g.n+1);
	let top = 0;
	function putUnbal(u, du) {
		if (ubvec[du] == u || !unbal.singleton(u)) return;
		ubvec[du] = unbal.join(ubvec[du],u); top = Math.max(top, du);
	}
	function getUnbal() {
		if (top == 0) return 0;
		let u = ubvec[top]; ubvec[top] = unbal.delete(u,u);
		while (top > 0 && ubvec[top] == 0) top--;
		return u;
	}
	return maxflowPP(g, getUnbal, putUnbal, trace, relabThresh);
}
