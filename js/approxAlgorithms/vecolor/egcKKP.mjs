/** @file egcKKP.mjs
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
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import { maxGroupCount, maxOutDegree, lowerBound, randUbound, wcUbound }
		from './egcCommon.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';

let eg;     // shared reference to EdgeGroups object

/** Find an edge group coloring using the algorithm of Kirkpatrick, Klawe
 *  and Pippenger with random palettes.
 *  @param eg is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcKKP(eg, trace) {
	let Cmin = lowerBound(maxGroupCount(eg), maxOutDegree(eg));
	let egc = egcBsearch(coreKKP, eg, Cmin, 10*Cmin);
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

export function coreKKP(eg, C) {
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
		if (egc.colorFromPalettes()) break;
	}

	return egc;
}
