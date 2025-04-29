/** @file setCoverSplitBound.mjs
 * 
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import flowfloor from '../../graphAlgorithms/maxflow/flowfloor.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';

/** Compute lower bound on the weight of an optimal set cover,
 *  using weight splitting.
 *  @param g is a bipartite graph that represents the set cover problem;
 *  specifically, the inputs represent the collection of sets and the outputs,
 *  the set elements; edges join sets to their elements; the indices of the
 *  inputs are assumed to be smaller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @return a lower bound on the weight of a minimum set cover
 */
export default function setCoverSplitBound(g, weight) {
	let k = g.inputCount(); let h = g.outputCount();

	let cost = new Array(k+1); let allInteger = true;
	for (let j = 1; j <= k; j++) {
		if (!Number.isInteger(weight[j])) allInteger = false;
		cost[j] = weight[j] / g.degree(j);
	}

	let bound = 0;
	for (let vi = k+1; vi <= k+h; vi++) {
		let e = g.firstAt(vi);
		if (e) {
			let cheapest = g.mate(vi,e);
			for (0; e; e = g.nextAt(vi,e)) {
				let j = g.mate(vi,e);
				if (cost[j] < cost[cheapest]) cheapest = j;
			}
			bound += cost[cheapest];
		}
	}
	if (allInteger) {
		let fb = Math.floor(bound);
		bound = bound < fb + .000001 ? fb : fb+1;
	}
	return bound;
}
