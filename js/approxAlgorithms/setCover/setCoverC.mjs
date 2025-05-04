/** @file setCoverC.mjs
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

/** Find an approximate minimum weight set cover using the greedy
 *  algorithm of Chvatal.
 *  @param g is a bipartite graph that represents the set cover problem;
 *  specifically, the inputs represent the collection of sets and the outputs,
 *  the set elements; edges join sets to their elements; the indices of the
 *  inputs are assumed to be samller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @return a triple [cover, ts, stats] where cover is a List whose elements
 *  identify the sets in the cover; ts is a trace string and stats is a
 *  statistics object.
 */
export default function setCoverC(g, weight, trace=0) {
	let k = g.inputCount(); let h = g.outputCount();
	let traceString = '';

	let x2s;
	if (trace) {
		x2s = (u => (g.n <= 26 && g.isInput(u)) ?
						"-ABCDEFGHIJKLMNOPQRSTUVWXYZ"[u] : g.x2s(u-k));
		traceString += g.toString(1, (e,u) => x2s(g.mate(u,e)),
						  u => x2s(u) + (u<=k ? `:${weight[u]}` : '')) + '\n';
		traceString += 'remaining sets, partial cover and cover weight\n';
	}

	let degree = new Int32Array(k+1);
	let subsets = new ArrayHeap(h); // subsets remaining to be considered
	for (let s = 1; s <= k; s++) {
		degree[s] = g.degree(s);
		if (degree[s]) subsets.insert(s, weight[s]/g.degree(s));
	}
	let cover = new List(k);	// list of subsets in current cover
	let coverWeight = 0;
	let gg = new Graph(); gg.assign(g);
	while (gg.m > 0 && !subsets.empty()) {
		if (trace) {
			traceString +=
				subsets.toString(0,s=>x2s(s)+':'+subsets.key(s).toFixed(2)) +
				` ${cover.toString(s=>x2s(s)+':'+weight[s])} ${coverWeight}\n`;
		}
		let s = subsets.deletemin();
		cover.enq(s);
		coverWeight += weight[s]; let nexte;
		for (let e = gg.firstAt(s); e; e = gg.firstAt(s)) {
			let i = gg.mate(s,e); gg.delete(e);
			for (let ee = gg.firstAt(i); ee; ee = gg.firstAt(i,ee)) {
				let j = gg.mate(i,ee); gg.delete(ee)
				if (--(degree[j]) == 0) subsets.delete(j);
				else subsets.changekey(j,weight[j]/degree[j]);
			}
		}
	}

	if (trace)
		traceString += `\ncover: ${cover.toString(x2s)} ${coverWeight}\n`;

	return [cover, traceString, {'coverWeight':coverWeight}];
}
