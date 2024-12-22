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
 *  inputs are assumed to be samller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @return a triple [cover, ts, stats] where cover is a List whose elements
 *  identify the sets in the cover; ts is a trace string and stats is a
 *  statistics object.
 */
export default function setCoverBYE(g, weight, trace=0) {
	let traceString = '';
	let m = g.inputCount(); let n = g.outputCount();

	let cover = new List(g.n);	// list of sets in current cover

	let x2s;
	if (trace) {
		x2s = (u => (g.n <= 26 && g.isInput(u)) ?
						"-ABCDEFGHIJKLMNOPQRSTUVWXYZ"[u] : g.x2s(u));
		traceString += 'graph: ' +
			g.toString(1, (e,u) => x2s(g.mate(u,e)),
						  u => x2s(u) + (u<=m ? `:${weight[u]}` : '')) + '\n';
		traceString += "uncovered items, slacks of first item's subsets, partial cover\n";
	}

	let y = new Int32Array(g.n+1);  // for set item i, y[i] is dual variable
	let uncovered = new List(g.n);	// list of uncovered items
	for (let i = g.firstOutput(); i; i = g.nextOutput(i))
		uncovered.enq(i);
	let slack = new Int32Array(g.n+1); // for set j, slack[j] is slack of dual
									   // constraint for j
	for (let j = g.firstInput(); j; j = g.nextInput(j)) slack[j] = weight[j];

	let coverWt = 0;
	while (!uncovered.empty()) {
		let i = uncovered.first();
		if (trace) {
			traceString += uncovered.toString() + ' [';
			for (let e = g.firstAt(i); e; e = g.nextAt(i,e)) {
				let s = g.mate(i,e);
				if (e != g.firstAt(i)) traceString += ' ';
				traceString += x2s(s)+':'+slack[s];
			}
			traceString += '] ' + cover.toString(s=>x2s(s)+':'+weight[s]);
			traceString += '] ' + coverWt + '\n';
		}
		// find smallest slack for constraint involving i
		let minSlack = Infinity;
		for (let e = g.firstAt(i); e; e = g.nextAt(i,e)) {
			let j = g.mate(i,e);
			minSlack = Math.min(minSlack, slack[j])
		}
		y[i] += minSlack;
		// reduce slack of constraints for sets containing i
		for (let e = g.firstAt(i); e; e = g.nextAt(i,e)) {
			let j = g.mate(i,e);
			slack[j] -= minSlack;
			if (slack[j] == 0 && !cover.contains(j)) {
				if (!uncovered.empty()) { cover.enq(j); coverWt += weight[j]; }
				for (let ee = g.firstAt(j); ee; ee = g.nextAt(j,ee)) {
					let ii = g.mate(j,ee);
					if (uncovered.contains(ii)) uncovered.delete(ii);
				}
			}
		}
	}

	if (trace)
		traceString += `\ncover: ${cover.toString(x2s)} ${coverWt}\n`;

	return [cover, traceString, {'weight':coverWt}];
}
