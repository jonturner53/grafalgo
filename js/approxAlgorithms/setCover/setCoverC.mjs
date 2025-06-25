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
 *  inputs are assumed to be smaller than those for the outputs
 *  @param weight is an array that maps inputs of g to their set weights
 *  @param type is an optional array mapping subsets to positive integer types;
 *  if type is present, the returned cover has at most one subset of each type
 *  @param or is a flag that enables overlap reduction; this feature seeks
 *  to limit the number of times outputs are covered multiple times;
 *  it does this by incrementing the weight of a group whenever one of
 *  its outputs becomes covered
 *  @return a triple [cover, ts, stats] where cover is a List whose elements
 *  identify the sets in the cover; ts is a trace string and stats is a
 *  statistics object.
 */
export default function setCoverC(g, weight=null, type=null, or=0, trace=0) {
	let k = g.inputCount(); let h = g.outputCount();

	if (!weight) weight = new Float32Array(k+1).fill(1);
	let dwt = weight.slice(0);  // dynamic copy of weight (needed for or)
	if (!type) {
		type = new Int32Array(k+1);
		for (let s = 0; s <= k; s++) type[s] = s;
	}
	let eligible = new Int8Array(1+ Math.max(...type)).fill(1);
		// eligible[t] becomes 0 when a subset of type t is added to cover

	let traceString = ''; let x2s;
	if (trace) {
		x2s = (u => (g.n <= 26 && g.isInput(u)) ?
						"-ABCDEFGHIJKLMNOPQRSTUVWXYZ"[u] : g.x2s(u-k));
		traceString += g.toString(5, (e,u) => x2s(g.mate(u,e)),
						  u => x2s(u) + (u<=k ? `:${weight[u]}` : '')) + '\n';
		traceString += 'remaining subsets, partial cover and cover weight\n';
	}

	let uncovered = new Int32Array(k+1);  // # of uncovered outputs in subsets
	let subsets = new ArrayHeap(k+1); // subsets remaining to be considered
	for (let s = 1; s <= k; s++) {
		uncovered[s] = g.degree(s);
		if (uncovered[s]) subsets.insert(s, dwt[s]/uncovered[s]);
	}
	let cover = new List(k);	// list of subsets in current cover
	let coverWeight = 0;
	let covered = new Int8Array(g.n+1); // true for covered outputs
	let excess = 0;   // # of redundant output covers
	while (!subsets.empty()) {
		if (trace) {
			traceString +=
				subsets.toString(0,s=>x2s(s)+':'+subsets.key(s).toFixed(2)) +
				` ${cover.toString(s=>x2s(s)+':'+dwt[s])} ${coverWeight} /`;
		}
		let s = subsets.deletemin(); 
		if (!eligible[type[s]]) continue;
		eligible[type[s]] = 0;

		cover.enq(s); coverWeight += weight[s];
		for (let e = g.firstAt(s); e; e = g.nextAt(s,e)) {
			let i = g.mate(s,e);
			if (covered[i]) {
				if (trace) traceString += ' ' + g.x2s(i-k);
				excess++; continue;
			}
			covered[i] = 1;
			for (let ee = g.firstAt(i); ee; ee = g.nextAt(i,ee)) {
				let ss = g.mate(i,ee);
				if (!subsets.contains(ss)) continue;
				if (or) dwt[ss] += 1;
				if (--(uncovered[ss]) == 0) subsets.delete(ss);
				else subsets.changekey(ss,dwt[ss]/uncovered[ss]);
			}
		}
		if (trace) traceString += '\n';
	}

	if (trace)
		traceString += `\ncover: ${cover.toString(x2s)} ${coverWeight}\n`;

	return [cover, traceString, {'coverWeight':coverWeight, 'excess':excess}];
}
