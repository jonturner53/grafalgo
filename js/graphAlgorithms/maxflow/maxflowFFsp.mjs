/** @file maxflowFFsp.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import { augment } from './common.mjs';

let g;			// shared reference to flow graph
let pedge;		// pedge[u] is edge to u from its parent in shortest path tree
let findpathCount; // number of calls to findpath
let findpathSteps; // number of steps in all calls to findpath

/** Compute a maximum flow in a graph using the Ford and Fulkerson algorithm.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowFFsp(fg, trace=false) {
	g = fg; pedge = new Array(g.n+1);
	let ts = '';
	if (trace)
		ts += g.toString(0,1) + 'residual capacity, path\n';
	let tf = 0;
	findpathCount = findpathSteps = 0;
	while (findpath(g.source)) {
		findpathCount++;
		let [f,s] = augment(g, pedge, trace);
		tf += f; if (trace) ts += s + '\n';
	}
	return [tf, ts, {'findpathCount': findpathCount,
					 'findpathSteps': findpathSteps}];
}

/** Find a shortest augmenting path from a specified vertex to the sink.
 *  @param s is a vertex in g
 *  @return true if there is an augmenting path from u to the sink
 */
function findpath(s) {
    let q = new List(g.n);
	pedge.fill(0);
    q.enq(s);
    while (!q.empty()) {
        let u = q.pop();
        for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			findpathSteps++;
            let v = g.mate(u,e);
            if (g.res(e, u) > 0 && pedge[v] == 0 && v != g.source) {
                pedge[v] = e;
                if (v == g.sink) return true;
                q.enq(v);
            }
        }
    }
    return false;
}
