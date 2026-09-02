/** @file egcBsearch.mjs
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
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import EGGraph from './EGGraph.mjs';


/** Use binary search to find the best coloring possible with a given method.
 *  @param method(egg,C,trace) that computes and returns a triple
 *  [ts,stats] where ts is a trace string and stats is a statistics object.
 *  @param egg is an EGGraph object.
 *  @param lo is lower end of the search range
 *  @param hi is upper end of the search range

 *  @return a triple [ts, stats] ts is a trace string and stats is a
 *  statistics object.
 */
export default function egcBsearch(method, egg, lo=1, hi=egg.crange) {
	let mid; let best = new Int32Array(egg.m);
	while (lo <= hi) {
		mid = ~~((lo + hi)/2);
		egg.uncolor(); method(egg,mid);
		if (egg.complete()) {
			let i = 0;
			for (let e = egg.first(); e; e = egg.next(e))
				best[i++] = egg.color(e);
			hi = mid-1;
		}
		else lo = mid+1;
	}
	egg.uncolor();
	let i = 0;
	for (let e = egg.first(); e; e = egg.next(e))
		egg.color(e, best[i++]);
}

