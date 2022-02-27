/** @file maxflowGTf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowGT from './maxflowGT.mjs';

/** Compute a maximum flow in a graph using the fifo version of
 *  Goldman & Tarjan's push-relabel algorithm.
 *  @param g is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to g
 */
export default function maxflowGTf(g, trace=false, relabThresh=g.m) {
	let unbal = new List(g.n);
	function putUnbal(u) { if (!unbal.contains(u)) unbal.enq(u); }
	function getUnbal(u) { return unbal.deq(); }
	return maxflowGT(g, getUnbal, putUnbal, trace, relabThresh);
}
