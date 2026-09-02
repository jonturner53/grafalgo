/** @file fcolorKKP.mjs
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
import fcolorBsearch from './fcolorBsearch.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';

let eg;     // shared reference to EdgeGroups object

/** Find a fan coloring using the algorithm of Kirkpatrick, Klawe
 *  and Pippenger with random palettes.
 *  @param g is an FanGraph to be colored.
 *  @return a triple [ts, stats]
 */
export default function fcolorKKP(g, trace) {
	let cmin = Math.max(... lowerBounds(g));
	for (let u = 1; u <= g.ni; u++) g.sortGroups(u);
	fcolorBsearch(coreKKP, g, cmin, g.crange);

	let ts = '';
	if (trace) ts += g.toString(0x9);

	let cmax = g.cmax;
	return [ts, {'cmax': cmax, 'max2min': (cmax/cmin).toFixed(2)}];
}

export function coreKKP(g, C) {
	let colors = randomPermutation(C);
	let limit = 10;
	for (let i = 1; i <= limit; i++) {
		g.uncolor(); let first = true;
		for (let u = 1; u <= g.ni; u++) {
			let g = g.firstGroupAt(u);
			for (let ci = 1; ci <= C; ci++) {
				g.bind(colors[ci],g);
				g = g.nextGroupAt(u,g);
				if (!g || (g.fanout(g) == 1 && first)) {
					g = g.firstGroupAt(u); first = false;
				}
			}
			scramble(colors);
		}
		if (g.colorFromPalettes()) break;
	}
}
