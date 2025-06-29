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
 *  @param key(s,covered,uncovered,width) is an optional function that defines
 *  the key values used to select each subset; covered[s] is the number of
 *  items in s that have been covered so far, uncovered[s] is the number of
 *  items not yet covered and width[s] is the maximum number of times that
 *  an item in s has been covered so far; the default function value
 *  is weight[s]/uncovered[s]; replacing this with (1+covered[s])/uncovered[s]
 *  attempts to reduce the number of times that outputs are covered redundantly
 *  @return a triple [cover, ts, stats] where cover is a List whose elements
 *  identify the sets in the cover; ts is a trace string and stats is a
 *  statistics object.
 */
export default function setCoverC(g, weight=0, type=0, key=0, trace=0) {
	let k = g.inputCount(); let h = g.outputCount();

	if (!weight) weight = new Int8Array(k+1).fill(1);
	if (!type) {
		type = new Int32Array(k+1);
		for (let s = 0; s <= k; s++) type[s] = s;
	}
	if (!key) {
		key = (s,covered,uncovered,width) => {
				return weight[s] / uncovered[s];
			}
	}

	// define covered[s] = number of covered outputs in s; also uncovered[s]
	let covered = new Int32Array(k+1); let uncovered = new Int32Array(k+1);
	for (let s = 1; s <= k; s++) uncovered[s] = g.degree(s);

	// define coverCount[v] = number of times output v has been covered
	let coverCount = new Int32Array(g.n+1);

	// define width[s] = max number of times any output in s has been covered
	let width = new Int32Array(k+1);

	// define eligible[t] = true until a subset of type t is added to cover
	let eligible = new Int8Array(1+ Math.max(...type)).fill(1);

	let traceString = ''; let x2s;
	if (trace) {
		x2s = (u => (g.n <= 26 && g.isInput(u)) ?
						"-ABCDEFGHIJKLMNOPQRSTUVWXYZ"[u] : g.x2s(u-k));
		traceString += g.toString(5, (e,u) => x2s(g.mate(u,e)),
						  u => x2s(u) + (u<=k ? `:${weight[u]}` : '')) + '\n';
		traceString += 'remaining subsets, partial cover, cover weight and ' +
					   'multiply covered items\n';
	}

	let subsets = new ArrayHeap(k+1); // subsets remaining to be considered
	for (let s = 1; s <= k; s++) {
		if (uncovered[s]) subsets.insert(s, key(s,covered,uncovered,width));
	}

	let cover = new List(k);	// list of subsets in current cover
	let coverWeight = 0;
	let excess = 0;   // # of redundant output covers
	while (!subsets.empty()) {
		if (trace) {
			traceString +=
				subsets.toString(0,s=>x2s(s)+':'+subsets.key(s).toFixed(2)) +
				` ${cover.toString(s=>x2s(s)+':'+weight[s])} ${coverWeight}`;
				
		}
		let s = subsets.deletemin(); 
		if (!eligible[type[s]]) continue;
		eligible[type[s]] = 0;

		cover.enq(s); coverWeight += weight[s]
		let first = 1;
		for (let e = g.firstAt(s); e; e = g.nextAt(s,e)) {
			let i = g.mate(s,e); coverCount[i]++;
			if (coverCount[i] > 1) {
				if (trace) {
					if (first) { traceString += ' /'; first = 0; }
					traceString += ' ' + g.x2s(i-k);
				}
				excess++;
				continue;
			}
			for (let ee = g.firstAt(i); ee; ee = g.nextAt(i,ee)) {
				let ss = g.mate(i,ee);
				if (!subsets.contains(ss)) continue;
				covered[ss]++; uncovered[ss]--;
				width[ss] = Math.max(width[ss], coverCount[i]);
				if (uncovered[ss] == 0) subsets.delete(ss);
				else {
					subsets.changekey(ss, key(ss,covered,uncovered,width));
				}
			}
		}
		if (trace) traceString += '\n';
	}

	if (trace)
		traceString += `\ncover: ${cover.toString(x2s)} ${coverWeight}\n`;

	let W = Math.max(...coverCount);
	return [cover, traceString, {'coverWeight':coverWeight,
								 'excess':excess, 'width':W}];
}
