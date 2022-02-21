/** @file maxflowGTf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowGT from './maxflowGT.mjs';

/** Compute a maximum flow in a graph using the fifo version of
 *  Goldman & Tarjan's push-relabel algorithm.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowGTf(fg, trace=false, relabThresh=g.m) {
	unbal = new ListSet(fg.n);
	ubvec = new Array(2*fg.n+1).fill(0);
	top = 0;
	return maxflowGT(fg, trace, relabThresh, getUnbal, putUnbal);
}

let unbal;		// ListSet where each list contains vertices with same distance label
let ubvec;		// ubvec[i] is id of list of vertices with distance label i
let top;		// top is the largest distance label for an unbalanced vertex

/** Add vertex to unbalanced set.
	@param u is a vertex
	@param du is the distance label of u
*/
function putUnbal(u, du) {
	if (ubvec[du] == u || !unbal.singleton(u)) return;
	ubvec[du] = unbal.join(ubvec[du],u); top = Math.max(top, du);
}

/** Get the next unbalanced vertex.
	@return an unbalanced vertex with the largest distance label.
*/
function getUnbal() {
	if (top == 0) return 0;
	let u = ubvec[top]; ubvec[top] = unbal.delete(u,u);
	while (top > 0 && ubvec[top] == 0) top--;
	return u;
}
