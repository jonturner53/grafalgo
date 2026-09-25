/** @file fcolorCT.mjs
 * 
 *  @author Jon Turner
 *  @date 2025
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {randomPermutation, scramble} from '../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import fcolorBsearch from './fcolorBsearch.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import setCoverC from '../setCover/setCoverC.mjs';
import {lowerBounds} from './common.mjs';

/** Find an edge fan coloring using repeated applications of Chvatal's
 *  greedy set covering algorithm.
 *  @param g is a fan graph to be colored
 *  @return a pair [ts, stats]
 */
export default function fcolorCT(g, trace) {
	g.uncolor();
	let cmin = Math.max(... lowerBounds(g));
	coreCT(g, g.crange); 

	let ts = '';
	if (trace) ts += g.toString(0x9);

	let cmax = g.cmax;
	return [ts, {'cmax':cmax, 'cmin':cmin, 'max/min': (cmax/cmin).toFixed(2)}];
}

export function coreCT(g, cmax) {
//console.log('ct0', cmax, g.toString(0x9));
	// build set cover graph with edges (f,v) where f is a fan and v an output
	let scg = new Graph(g.nf + g.no, g.m);
	scg.setBipartition(g.nf);
	if (!g.tint) {
		for (let e = g.first(); e; e = g.next(e)) {
			let v = g.right(e) - g.ni;
			scg.join(g.fan(e), v + g.nf, e);
			// vertex numbers of scg outputs shifted relative to g
		}
	}

	// assign types to fans based on their hubs
	let type = new Int32Array(g.nf+1);
	for (let f = g.firstFan(); f; f = g.nextFan(f))
		type[f] = g.hub(f);

	let covered = new Int8Array(g.no+1); // used when processing each cover
	let C;
	let setCoverCost =
		(s,covered,uncovered,width) =>
			(1+covered[s]+width[s]+ (g.tint ? C-g.tint(s) : 0))
		 	  / uncovered[s];
	C = 1; let numberColored = 0;
	while (C <= cmax && numberColored <= g.m) {
		// add to scg those edges that can be colored with C
		if (g.tint) {
			for (let e = g.first(); e; e = g.next(e)) {
				if (g.tint(g.fan(e)) != C) continue;
				let v = g.right(e) - g.ni;
				scg.join(g.fan(e), v + g.nf, e);
			}
		}
		let [cover]  = setCoverC(scg, 0, type, setCoverCost);
		covered.fill(0);
		for (let f = cover.first(); f; f = cover.next(f)) {
			let nexte;
			for (let e = scg.firstAt(f); e; e = nexte) {
				nexte = scg.nextAt(f,e);
				let v = scg.right(e);
				if (!covered[v-g.nf]) {
					covered[v-g.nf] = 1; g.color(e, C); scg.delete(e);
					numberColored++;
				}
			}
		}
		C++;
	}
}
