/** @file fcolorKKP.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Assert.mjs';
import {range, scramble} from '../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import fcolorBsearch from './fcolorBsearch.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import { lowerBounds } from './common.mjs';

let eg;     // shared reference to EdgeGroups object

/** Find a fan coloring using the algorithm of Kirkpatrick, Klawe
 *  and Pippenger with random palettes.
 *  @param g is an FanGraph to be colored.
 *  @return a triple [ts, stats]
 */
export default function fcolorKKP(g, trace) {
	let [,od] = g.maxDegree();
	let lo = Math.max(g.maxFanCount(), od, g.tint ? g.maxTint() : 0);
	let hi = g.crange;
	for (let u = 1; u <= g.ni; u++) g.sortFans(u);
	fcolorBsearch(coreKKP, g, lo, hi);

	let ts = '';
	if (trace) ts += g.toString(0x29);

	let cmin = Math.max(...lowerBounds(g)); let cmax = g.cmax;
	return [ts, {'cmax': cmax, 'max/min': (cmax/cmin).toFixed(2)}];
}

export function coreKKP(g, C) {
	let colors = range(C);
	let flist = new List(g.nf); // list of fans at a vertex
	let used = new List(C); // list of colors at a vertex that have been used
	let limit = 10;
	for (let count = 1; count <= limit; count++) {
		g.uncolor();
		let first = true;
		for (let u = 1; u <= g.ni; u++) {
			scramble(colors); used.clear(); flist.clear();
			// assign a first color to every fan at u and initialize flist
			let i = 1; let minTint = C;
			for (let f = g.firstFanAt(u); f && i <= C; f = g.nextFanAt(u,f)) {
				if (g.tint) {
					g.bind(g.tint(f), f); used.push(g.tint(f));
					minTint = Math.min(g.tint(f), minTint);
				} else {
					g.bind(colors[i], f); used.push(colors[i++]);
				}
				flist.push(f);
			}
			// assign the remaining colors
			let f = flist.first();
			while (used.length < C) {
				if (g.tint) {
					// find next usable color
					while (i <= C && (used.contains(colors[i]) ||
									  colors[i] < minTint)) {
						i++;
					}
					if (i > C) break;
					// find first fan in flist with tint <= colors[i]
					for (f = flist.first(); f; f = flist.next(f)) {
						if (colors[i] >= g.tint(f)) break;
					}
				}
				used.enq(colors[i]); g.bind(colors[i++],f);
				flist.delete(f); flist.enq(f); f = flist.first();
			}
		}
		if (g.colorFromPalettes()) break;
	}
}
