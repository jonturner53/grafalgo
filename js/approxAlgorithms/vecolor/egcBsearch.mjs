/** @file egcBsearch.mjs
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
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';


/** Find an edge group coloring using bounded greedy method of Yang & Masson.
 *  @param method(eg,C,trace) that computes and returns a triple
 *  [egc,ts,stats] where egc is an EdgeGroupColors object, ts is a trace
 *  string and stats is a statistics object.
 *  @param eg is an EdgeGroups object.
 *  @param lo is lower end of the search range
 *  @param hi is upper end of the search range

 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a trace string and stats is a statistics object.
 */
export default function egcBsearch(method, eg, lo=1, hi=10*lo) {
	let mid; let best = null;
	while (lo <= hi) {
		mid = ~~((lo + hi)/2);
		let egc = method(eg,mid);
		if (egc.complete()) { best = egc; hi = mid-1; }
		else lo = mid+1;
	}
	return best;
}

