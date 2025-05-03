/** @file setCoverSizeBound.mjs
 * 
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

/** Compute lower bound on the weight of an optimal set cover, based on
 *  the sizes and weights of the of the subsets.
 *  @param g is a bipartite graph that represents the set cover problem;
 *  specifically, the inputs represent the collection of sets and the outputs,
 *  the set elements; edges join sets to their elements; the indices of the
 *  inputs are assumed to be samller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @return a lower bound on the weight of a minimum set cover
 */
export default function setCoverSizeBound(g, weight) {
	let k = g.inputCount(); let h = g.outputCount();

	let size = new Int32Array(k);
	for (let s = 1; s <= k; s++) size[s-1] = g.degree(s);
	size.sort((a,b)=>b-a);
	let r = 0; let count = 0;
	while(r <= k && count < h) count += size[r++];
	
	// any cover uses at least r subsets

	let wt = weight.slice(1); wt.sort((a,b)=>a-b);
	let lowerBound = 0;
	for (let i = 0; i < r; i++) lowerBound += wt[i];

	return lowerBound
}
