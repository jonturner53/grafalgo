/** @file egcYM.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import {randomPermutation, scramble} from '../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import {lowerBound, maxGroupCount, maxOutDegree} from './egcCommon.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';

let eg;		// shared reference to EdgeGroups object
let egc;	// shared reference to EdgeGroupColors object

let colorCount;          // colorCount[u] is number of colors in use at u
let coloredGroupCount;   // coloredGroupCount[u] # of colored groups at u

/** Find an edge group coloring using bounded greedy method of Yang & Masson.
 *  @param g is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcYM(eg0, trace=0) {
	eg = eg0; eg.sortAllGroups();
	let ts = '';

	let Gamma_i = maxGroupCount(eg);
	let Delta_o = maxOutDegree(eg);
	let Cmin = lowerBound(Gamma_i, Delta_o);

	// identify viable range of values for binary search.
	let lo = Cmin; let hi = lo;
	while(1) {
		egc = new EdgeGroupColors(eg, hi);
		colorCount = new Int32Array(hi+1);
		coloredGroupCount = new Int32Array(hi+1);
		if (colorAllGroups(hi)) break;
		lo = hi+1; hi *= 2;
	}
	// now proceed with binary search
	let C;
	while (lo < hi) {
		C = ~~((lo + hi)/2);
		if (colorAllGroups(C)) hi = C;
		else lo = C+1;
	}
	C = hi;

	colorAllGroups(C);

	if (trace) {
		ts += '\ngraph with palletes ' +
			  eg.toString(1,g=>egc.palette2string(g)) + '\n';
		ts += 'colors: ' + egc.toString(0);
	}
	return [egc, ts, {'C': C, 'R': (C/Cmin).toFixed(2)}]
}

function colorAllGroups(C) {
	egc.clear(); colorCount.fill(0); coloredGroupCount.fill(0);
	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g))
		if (!colorGroup(g, C)) return false;
	return true;
}

/** Assign colors to one group.
 *  @param g is group number
 *  @param C is the largest color
 *  @return true on success
 */
function colorGroup(g, C) {
	// set limit on # of colors per group
	let u = eg.hub(g);
	let limit = Math.ceil((C - colorCount[u]) /
						  (eg.groupCount(u) - coloredGroupCount[u]));
	let colored = 0; // number of edges colored so far
	let k = 0; // number of colors used so far

	while (k < limit && colored < eg.fanout(g)) {
		// first find best color for the remaining uncolored edges
		let bestColor = 0; let bestCount = 0;
		for (let c = 1; c <= C; c++) {
			let count = 0;
			for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
				if (egc.color(e) == 0 && egc.avail(c,e)) count++;
			}
			if (count > bestCount) {
				bestColor = c; bestCount = count;
			}
			// stop early if c can color all remaining edges
			if (colored + bestCount == eg.fanout(g)) break;
		}
		if (!bestColor) return false;
		for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
			if (egc.color(e) == 0 && egc.avail(bestColor,e)) {
				egc.color(e,bestColor); colored++;
			}
		}
		k++;
	}
	if (colored != eg.fanout(g)) return false;
	colorCount[u] += k; coloredGroupCount[u]++;
	return true;
}
