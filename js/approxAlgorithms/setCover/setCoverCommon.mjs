/** @file setCoverCommon.mjs
 * 
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import flowfloor from '../../graphAlgorithms/maxflow/flowfloor.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';

/** Compute lower bound on the weight of an optimal set cover, based on
 *  the sizes and weights of the of the subsets.
 *  @param g is a bipartite graph that represents the set cover problem;
 *  specifically, the inputs represent the collection of sets and the outputs,
 *  the set elements; edges join sets to their elements; the indices of the
 *  inputs are assumed to be samller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @return a lower bound on the weight of a minimum set cover
 */
export function sizeBound(g, weight) {
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

/** Compute lower bound on weight of an optimal set cover based on the
 *  primal-dual algorithm of Bar-Yehuda and Even.
 *  @param g is a bipartite graph that represents the set cover problem;
 *  specifically, the inputs represent the collection of sets and the outputs,
 *  the set elements; edges join sets to their elements; the indices of the
 *  inputs are assumed to be smaller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @return a computed lower bound
 */
export function labelBound(g, weight) {
	let k = g.inputCount(); let h = g.outputCount();

	let cover = new List(k);		// list of sets in current cover
	let y = new Float32Array(h+1); 	// for set item i, y[i] is i's label
	let uncovered = new List(h);	// list of uncovered items
	for (let i = 1; i <= h; i++)
		uncovered.enq(i);
	let slack = new Float32Array(k+1);	// slack[j] is slack of dual
									 	// constraint for subset j
	for (let j = 1; j <= k; j++) slack[j] = weight[j];

	let labelSum = 0;
	while (!uncovered.empty()) {
		let i = uncovered.deq(); let vi = i+k; // vertex for item i

		// find smallest slack among constraints involving i
		let minSlack = Infinity;
		for (let e = g.firstAt(vi); e; e = g.nextAt(vi,e)) {
			let j = g.mate(vi,e);
			minSlack = Math.min(minSlack, slack[j]);
		}

		// increase y[i], reduce slack of all subsets containing i
		// and identify one subset with a tight dual constraint
		y[i] += minSlack; labelSum += minSlack;
		let newSubset = 0;
		for (let e = g.firstAt(vi); e; e = g.nextAt(vi,e)) {
			let j = g.mate(vi,e); slack[j] -= minSlack;
			if (Math.abs(slack[j]) < 1e-6) slack[j] = 0;
			if (!newSubset && slack[j] == 0) newSubset = j;
		}
		// add newSubset to cover and remove its items from uncovered
		cover.enq(newSubset); 
		for (let ee = g.firstAt(newSubset); ee; ee = g.nextAt(newSubset,ee)) {
			let ii = g.mate(newSubset,ee)-k;
			if (uncovered.contains(ii)) uncovered.delete(ii);
		}
	}

	return labelSum;
}

/** Compute lower bound on the weight of an optimal set cover,
 *  using weight splitting.
 *  @param g is a bipartite graph that represents the set cover problem;
 *  specifically, the inputs represent the collection of sets and the outputs,
 *  the set elements; edges join sets to their elements; the indices of the
 *  inputs are assumed to be smaller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @return a lower bound on the weight of a minimum set cover
 */
export function splitBound(g, weight) {
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

