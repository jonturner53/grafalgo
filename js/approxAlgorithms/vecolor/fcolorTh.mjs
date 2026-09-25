/** @file fcolorTh.mjs
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
import { coreKKPT } from './fcolorKKPT.mjs';
import { lowerBounds } from './common.mjs';
import fcolorBsearch from './fcolorBsearch.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';

/** Find a fan coloring using Turner's hybrid algorithm.
 *  @param g is a fan graph to be colored
 *	@param imethod(g, C) is a function that computes a (possibly incomplete)
 *  coloring of g using colors no larger than C
 *  @return pair [ts, stats]; the coloring is returned in g;
 *  if the graph cannot be colored with C colors, it will be incomplete
 */
export default function fcolorTh(g, imethod, trace) {
	let deficit;  // initial deficit from last successful call to core
	let core = function(g, C) {
		imethod(g, C);
		let def = g.m - g.num_colored;
		if (g.complete()) { deficit = 0; return; }
		coreKKPT(g, C);
		if (g.complete()) deficit = def;
	}

	let cmin = Math.max(... lowerBounds(g));
	g.sortAllFans();
	fcolorBsearch(core, g, cmin, g.crange);

	let ts = '';
	if (trace) {
		ts += 'initial deficit: ' + deficit + '\n';
		ts += g.toString(0x9) + '\n';
	}

	let cmax = g.cmax;
	return [ts, {'cmax': cmax, 'cmin':cmin, 'max/min': (cmax/cmin).toFixed(2),
			'deficit': deficit}];
}
