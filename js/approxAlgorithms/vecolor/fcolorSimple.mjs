/** @file fcolorSimple.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import FanGraph from './FanGraph.mjs';

/** Find a fan coloring using simple method.
 *  @param g is a fan graph to be colored.
 *  @return pair [ts, stats]; the coloring is returned in g
 */
export default function fcolorSimple(g, trace=0) {
	let ae = assertEnabled();

	g.sortAllFans();
	for (let f = g.firstFan(); f; f = g.nextFan(f)) {
		let nc = 0;
		for (let c = g.tint ? g.tint(f) : 1; nc < g.fanout(f); c++) {
			assert(c <= g.crange, c + ' ' + g.crange);
			for (let e = g.firstEdgeIn(f); e; e = g.nextEdgeIn(f,e)) {
				if (!g.color(e) && g.avail(c,e)) {
					g.color(e,c); nc++;
				}
			}
		}
	}

	let ts = '';
	if (trace) ts += g.toString(0x9);
	let cmax = g.cmax;
	let lb = Math.max(maxFanCount(g), maxOutDegree(g));
	return [ts, {'cmax': cmax, 'cmax2lb': (cmax/lb).toFixed(2)}];
}
