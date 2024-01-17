/** @file egcKKP1.mjs
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
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import { maxGroupCount, maxOutDegree, lowerBound, randUbound, wcUbound }
		from './egcCommon.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';

let eg;		// shared reference to EdgeGroups object

/** Find an edge group coloring using random palette method.
 *  @param g is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcKKP1(eg0, trace=0) {
	eg = eg0; let ts = '';

	let D_i = maxGroupCount(eg);
	let Delta_o = maxOutDegree(eg);
	let Cmin = lowerBound(D_i, Delta_o);
	let Cmax = Math.ceil(wcUbound(D_i, Delta_o, eg.n_o));

	for (let u = 1; u <= eg.n_i; u++) eg.sortGroups(u);
	
	let lo = Cmin; let hi = Cmax; let C; let best;
	while (lo < hi) {
		C = ~~((lo + hi)/2);
		let egc = findRandomPalette(C);
		if (egc) {
			best = egc; hi = C;
		} else {
			lo = C+1;
		}
	}
	C = hi;

	if (trace) {
		ts += 'graph with palettes ' +
			  eg.toString(1, g=>best.palette2string(g)) + '\n';
		ts += 'colors: ' + best.toString(0);
	}

	return [best, ts, {'Cmax': C, 'randUbound': randUbound(D_i,Delta_o,eg.n_o)}]
}

/** Construct random palettes for all groups and check for validity.
 *  @param C is the number of colors available
 *  @return an EdgeGroupColors object with edges colored using randomly
 *  generated palettes or null if no valid set of palettes was found
 */
function findRandomPalette(C) {
	let colors = randomPermutation(C);
	let limit = 10;
	let egc = new EdgeGroupColors(eg,C);
	for (let i = 1; i <= limit; i++) {
		egc.clear();
		for (let u = 1; u <= eg.n_i; u++) {
			let g = eg.firstGroupAt(u);
			for (let ci = 1; ci <= C; ci++) {
				egc.bind(colors[ci],g);
				g = eg.nextGroupAt(u,g);
				if (!g) g = eg.firstGroupAt(u);
			}
			scramble(colors);
		}
		if (egc.colorFromPalettes()) return egc;
	}
	return null;
}

function doPaletteGraph(v, coloring) {
	paletteGraph.clear();
	for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
		let g = eg.group(e); let u = eg.hub(g);
		for (let c = coloring.firstColor(g); c; c = coloring.nextColor(g,c)) {
			paletteGraph.join(g,eg.n_g+c);
		}
	}
}
