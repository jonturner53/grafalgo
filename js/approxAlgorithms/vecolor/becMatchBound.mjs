/** @file becMatchBound.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import mdmatchG from '../../graphAlgorithms/vmatch/mdmatchG.mjs';

export default function becMatchBound(g) {
	let gc = new Graph(g.n, g.edgeRange); gc.setBipartition(g.getBipartition());
	let total = 0; let c;
	for (c = 1; total < g.m; c++) {
		// construct G_c (by adding edges to previous G_c)
		for (let e = g.first(); e; e = g.next(e)) {
			if (c >= g.bound(e) && c < g.bound(e) + 1)
				gc.join(g.left(e), g.right(e), e);
		}
		// find max matching in gc and add its size to total
		let [match] = bimatchHK(gc);
		total += match.size();
		if (total > gc.m) total = gc.m;
	}
	return c-1;
}
