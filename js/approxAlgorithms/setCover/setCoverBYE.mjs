/** @file setCoverBYE.mjs
 * 
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Find an approximate minimum weight set cover using the primal-dual
 *  algorithm of Bar-Yehuda and Even.
 *  @param g is a bipartite graph that represents the set cover problem;
 *  specifically, the inputs represent the collection of sets and the outputs,
 *  the set elements; edges join sets to their elements; the indices of the
 *  inputs are assumed to be smaller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @return a triple [cover, ts, stats] where cover is a List whose elements
 *  identify the sets in the cover; ts is a trace string and stats is a
 *  statistics object.
 */
export default function setCoverBYE(g, weight, trace=0) {
	let traceString = '';
	let k = g.inputCount(); let h = g.outputCount();

	let x2s;
	if (trace) {
		x2s = (u => (k <= 26 && h <= 26) ?
					 (u <= k ? "-ABCDEFGHIJKLMNOPQRSTUVWXYZ"[u] : g.x2s(u-k))
					 : (u <= k ? u : -(u-k)));
		traceString += g.toString(1, (e,u) => x2s(g.mate(u,e)),
						  u => x2s(u) + (u<=k ? `:${weight[u]}` : '')) + '\n';
		traceString += "uncovered items, slacks of first item's subsets, " +
						"partial cover\n";
	}

	let cover = new List(k);		// list of sets in current cover
	let y = new Float32Array(h+1);	// for set item i, y[i] is i's label
	let uncovered = new List(h);	// list of uncovered items
	for (let i = 1; i <= h; i++) uncovered.enq(i);
	let slack = new Float32Array(k+1);	 // slack[j] is slack of dual
									 	// constraint for subset j
	for (let j = 1; j <= k; j++) slack[j] = weight[j];

	let coverWt = 0; let labelSum = 0;
	while (!uncovered.empty()) {
		let i = uncovered.first(); let vi = i+k; // vertex for item i
		if (trace) {
			traceString += uncovered.toString() + ' [';
			for (let e = g.firstAt(vi); e; e = g.nextAt(vi,e)) {
				let s = g.mate(vi,e);
				if (e != g.firstAt(vi)) traceString += ' ';
				traceString += x2s(s)+'.'+slack[s];
			}
			traceString += '] ' + cover.toString(s=>x2s(s)+':'+weight[s]);
			traceString += ' ' + coverWt + '\n';
		}
		uncovered.deq();

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
			if (!newSubset && slack[j] == 0) newSubset = j;
		}
		ea && assert(newSubset);
		// add newSubset to cover and remove its items from uncovered
		cover.enq(newSubset); coverWt += weight[newSubset];
		for (let ee = g.firstAt(newSubset); ee; ee = g.nextAt(newSubset,ee)) {
			let ii = g.mate(newSubset,ee)-k;
			if (uncovered.contains(ii)) uncovered.delete(ii);
		}
	}

	if (trace)
		traceString += `\ncover: ${cover.toString(x2s)} ${coverWt}\n`;

	return [cover, traceString, {'coverWeight':coverWt, 'labelSum':labelSum}];
}
