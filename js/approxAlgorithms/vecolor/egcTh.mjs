/** @file egcTh.mjs
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
import { coreKKPT } from './egcKKPT.mjs';
import egcBsearch from './egcBsearch.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import {lowerBound, maxGroupCount, maxOutDegree} from './egcCommon.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';

/** Find an edge group coloring using Turner's hybrid algorithm in which the
 *  the initial attempt uses the bounded greedy method of Yang & Masson.
 *  @param eg is a group graph to be colored
 *	@param imethod(eg, C) is a function that returns an EdgeGroupColors object
 *  for eg on C colors; the returned coloring may be incomplete
 *  @return a triple [egc, ts, stats] where egc is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object;
 *  if the graph cannot be colored with C colors, egc will be incomplete
 */
export default function egcTh(eg, imethod, trace) {
	let deficit;  // initial deficit from last successful call to core
	let core = function(eg, C) {
		let egc = imethod(eg, C);
		let def = eg.graph.m - egc.numberColored();
		if (egc.complete()) {
			deficit = def; return egc;
		}
		egc = coreKKPT(eg, C, egc);
		if (egc.complete()) deficit = def;
		return egc;
	}

	let Cmin = lowerBound(maxGroupCount(eg), maxOutDegree(eg));
	eg.sortAllGroups();
	let egc = egcBsearch(core, eg, Cmin, 10*Cmin);
	assert(egc);

	let ts = '';
	if (trace) {
		ts += 'initial deficit: ' + deficit + '\n';
		ts += '\ngraph with palletes ' +
			  eg.toString(1,g=>egc.palette2string(g)) + '\n';
		ts += 'colors: ' + egc.toString(0);
	}

	let C = egc.maxColor();
	return [egc, ts, {'C': C, 'R': (C/Cmin).toFixed(2), 'D': deficit}];
}
