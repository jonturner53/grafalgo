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
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowGTf(fg, trace=false, relabThresh=fg.m) {
	let unbal = new List(fg.n);
	function putUnbal(u) { if (!unbal.contains(u)) unbal.enq(u); }
	function getUnbal(u) { return unbal.deq(); }
	return maxflowGT(fg, getUnbal, putUnbal, trace, relabThresh);
}
