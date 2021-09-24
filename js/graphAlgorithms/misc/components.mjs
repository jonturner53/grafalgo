/** @file components.mjs
 * 
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Dlists from '../../dataStructures/basic/Dlists.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Identify the connected components of an undirected graph.
 *  @param g is a graph object
 *  @param trace is an optional argument that controls production of trace
 *  information; when zero, no trace information is provided
 *  @return a pair [k, comps, traceString] where k is the number of components
 *  in g and comps is a disjoint lists (Dlists) object that partitions
 *  the vertices into subsets that define each component and traceString
 *  contains trace information.
 */
export default function components(g, trace=0) {
	let k = 0; let traceString = '';
	if (trace) traceString += g + '\n';
	let comps = new Dlists(g.n);
	let q = new List(g.n);
	for (let s = 1; s <= g.n; s++) {
		if (!comps.singleton(s)) continue;
		k++; q.enq(s);
		while (!q.empty()) {
			if (trace) traceString += `${g.index2string(s)}\n${q}\n${comps}\n`
			let u = q.deq();
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				let v = g.mate(u,e);
				if (comps.singleton(v)) {
					comps.join(s, v); q.enq(v);
				}
			}
		}
	}
	comps.sort();
	return [k, comps, traceString];
}
