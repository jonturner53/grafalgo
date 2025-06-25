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
import egcBsearch from './egcBsearch.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import {lowerBound, maxGroupCount, maxOutDegree} from './egcCommon.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';

/** Find an edge group coloring using bounded greedy method of Yang & Masson.
 *  @param eg0 is a group graph to be colored
 *  @return a triple [egc, ts, stats] where egc is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object;
 *  if the graph cannot be colored with C colors, egc will be incomplete
 */
export default function egcYM(eg, trace) {
	eg.sortAllGroups();
	let Cmin = lowerBound(maxGroupCount(eg), maxOutDegree(eg));
	let egc = egcBsearch(coreYM, eg, Cmin, 10*Cmin);
	assert(egc);

	let ts = '';
	if (trace) {
		ts += '\ngraph with palletes ' +
			  eg.toString(1,g=>egc.palette2string(g)) + '\n';
		ts += 'colors: ' + egc.toString(0);
	}

	let C = egc.maxColor();
	return [egc, ts, {'C': C, 'R': (C/Cmin).toFixed(2)}];
}

export function coreYM(eg, C) {
	let egc = new EdgeGroupColors(eg, C);
	let colorCount = new Int32Array(eg.n_i+1);
	let coloredGroupCount = new Int32Array(eg.n_i+1);

	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g)) {
		// determine number of colors available for this group
		let u = eg.hub(g);
		let limit = Math.ceil((C - colorCount[u]) /
							  (eg.groupCount(u) - coloredGroupCount[u]));
		let colored = 0; // number of edges in g colored so far
		let k = 0;       // number of colors used for g so far
	
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
			if (!bestColor) break;
			for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
				if (egc.color(e) == 0 && egc.avail(bestColor,e)) {
					egc.color(e,bestColor); colored++;
				}
			}
			k++;
		}
		if (colored < eg.fanout(g)) continue;
		colorCount[u] += k; coloredGroupCount[u]++;
	}

	return egc;
}

