/** @file egcSimple.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';
import {maxGroupCount, maxOutDegree} from './egcCommon.mjs';

let eg;		// shared reference to EdgeGroups object

/** Find an edge group coloring using simple method.
 *  @param g is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcSimple(eg0, trace=0) {
	eg = eg0;

	let ts = '';
	if (trace) {
		ts += 'graph: ' + eg.toString(1) + '\n';
	}

	let egc = color();

	if (trace) {
		ts += 'colors: ' + egc.toString(0);
	}
	let C = egc.maxColor();
	let lb = Math.max(maxGroupCount(eg), maxOutDegree(eg));
	return [egc, ts, {'C': C, 'R': (C/lb).toFixed(2)}];
}

/** Color the edges in decreasing order of group size.
 *  @return an EdgeGroupColors object
 */
function color() {
	eg.sortAllGroups();

	let limit = 10*maxGroupCount(eg);
	let egc = new EdgeGroupColors(eg, limit);
	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g)) {
		let nc = 0;
		for (let c = 1; nc < eg.fanout(g); c++) {
			assert(c <= limit, c + ' ' + limit);
			for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
				if (!egc.color(e) && egc.avail(c,e)) {
					egc.color(e,c); nc++;
				}
			}
		}
	}
	return egc;
}
