/** @file maxflowPPf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowPP from './maxflowPP.mjs';

/** Compute a maximum flow in a graph using the fifo version of
 *  Goldman & Tarjan's preflow-push algorithm.
 *  @param g is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to g
 */
export default function maxflowPPf(g, relabThresh=g.m, trace=false) {
	let unbal = new List(g.n);
	function putUnbal(u) { if (!unbal.contains(u)) unbal.enq(u); }
	function getUnbal(u) { return unbal.deq(); }
	return maxflowPP(g, getUnbal, putUnbal, relabThresh, trace);
}
