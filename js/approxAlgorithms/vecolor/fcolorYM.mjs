/** @file fcolorYM.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Assert.mjs';
import {randomPermutation, scramble} from '../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { lowerBounds } from './commonEgc.mjs';
import fcolorBsearch from './fcolorBsearch.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';

/** Find a fan coloring using bounded greedy method of Yang & Masson.
 *  @param g is a fan graph to be colored
 *  @return a triple [ts, stats] where ts is a traceString and stats is
 *  a statistics object;
 */
export default function fcolorYM(g, trace) {
	g.sortAllFans();
	let cmin = Math.max(... lowerBounds(g));
	fcolorBsearch(coreYM, eg, cmin, g.crange);

	let ts = '';
	if (trace) ts += g.toString(0x9);

	let cmax = g.cmax();
	return [ts, {'cmax': cmax, 'cmin':cmin, 'max2min': (cmax/cmin).toFixed(2)}];
}

export function coreYM(g, C) {
	let colorCount = new Int32Array(g.ni+1);
	let coloredFanCount = new Int32Array(g.ni+1);

	for (let f = g.firstFan(); f; f = g.nextFan(f)) {
		// determine number of colors available for this fan
		let u = g.hub(f);
		let limit = Math.ceil((C - colorCount[u]) /
							  (g.fanCount(u) - coloredFanCount[u]));
		let colored = 0; // number of edges in f colored so far
		let k = 0;       // number of colors used for f so far
	
		while (k < limit && colored < g.fanout(f)) {
			// first find best color for the remaining uncolored edges
			let bestColor = 0; let bestCount = 0;
			for (let c = (g.tint ? g.tint(f) : 1); c <= C; c++) {
				let count = 0;
				for (let e = g.firstEdgeIn(f); e; e = g.nextEdgeIn(f,e)) {
					if (g.color(e) == 0 && g.avail(c,e)) count++;
				}
				if (count > bestCount) {
					bestColor = c; bestCount = count;
				}
				// stop early if c can color all remaining edges
				if (colored + bestCount == g.fanout(f)) break;
			}
			if (!bestColor) break;
			for (let e = g.firstEdgeIn(f); e; e = g.nextEdgeIn(f,e)) {
				if (g.color(e) == 0 && g.avail(bestColor,e)) {
					g.color(e,bestColor); colored++;
				}
			}
			k++;
		}
		if (colored < g.fanout(f)) continue;
		colorCount[u] += k; coloredFanCount[u]++;
	}
}

