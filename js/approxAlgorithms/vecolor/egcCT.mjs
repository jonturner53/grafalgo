/** @file egcCT.mjs
 * 
 *  @author Jon Turner
 *  @date 2025
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
import setCoverC from '../setCover/setCoverC.mjs';
import {lowerBound, maxGroupCount, maxOutDegree} from './egcCommon.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';

/** Find an edge group coloring using repeated applications of Chvatal's
 *  greedy set covering algorithm.
 *  @param eg is a group graph to be colored
 *  @param overlapReduction is a flag that enables overlap reduction in
 *  the set cover computations
 *  @return a triple [egc, ts, stats] where egc is an EdgeGroupColors
 *  object, ts is a trace string and stats is a statistics object;
 *  if the graph cannot be colored with C colors, egc will be incomplete
 */
export default function egcCT(eg, trace) {
	let Cmin = lowerBound(eg);
	let egc = coreCT(eg, 10*Cmin); 

	let ts = '';
	if (trace) {
		ts += '\ngraph with palletes ' +
			  eg.toString(1,g=>egc.palette2string(g)) + '\n';
		ts += 'colors: ' + egc.toString(0);
	}

	return [egc, ts, {'C':egc.maxColor(), 'Cmin':Cmin,
					  'R': (egc.maxColor()/Cmin).toFixed(2)}];
}

export function coreCT(eg, Cmax) {
	let egg = eg.graph;
	let egc = new EdgeGroupColors(eg, Cmax);

	// build set cover graph with edges (g,v) where g is a group and v an output
	let scg = new Graph(eg.n_g + eg.n_o, egg.m);
	scg.setBipartition(eg.n_g);
	if (!eg.hasBounds) {
		for (let e = egg.first(); e; e = egg.next(e)) {
			if (eg.hasBounds && eg.bound(eg.group(e)) != 1) continue;
			let v = egg.right(e) - eg.n_i;
			scg.join(eg.group(e), v + eg.n_g, e);
			// vertex numbers of scg outputs shifted relative to egg
		}
	}

	// assign types to groups based on their hubs
	let type = new Int32Array(eg.n_g+1);
	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g))
		type[g] = eg.hub(g);

	let covered = new Int8Array(eg.n_o+1); // used when processing each cover
	let C;
	let setCoverCost =
		(s,covered,uncovered,width) =>
			(1+covered[s]+width[s]+ (eg.hasBounds ? C-eg.bound(s) : 0))
		 	  / uncovered[s];
	C = 1; let numberColored = 0;
	while (C <= Cmax && numberColored <= egg.m) {
		// add to scg those edges that can be colored with C
		if (eg.hasBounds) {
			for (let e = egg.first(); e; e = egg.next(e)) {
				if (eg.bound(eg.group(e)) != C) continue;
				let v = egg.right(e) - eg.n_i;
				scg.join(eg.group(e), v + eg.n_g, e);
			}
		}
		let [cover]  = setCoverC(scg, 0, type, setCoverCost);
		covered.fill(0);
		for (let g = cover.first(); g; g = cover.next(g)) {
			let nexte;
			for (let e = scg.firstAt(g); e; e = nexte) {
				nexte = scg.nextAt(g,e);
				let v = scg.right(e);
				if (!covered[v-eg.n_g]) {
					covered[v-eg.n_g] = 1; egc.color(e, C); scg.delete(e);
					numberColored++;
				}
			}
		}
		C++;
	}

	return egc;
}
