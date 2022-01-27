/** @file maxflowFFsp.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import augment from './augment.mjs';

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
	if (trace) ts += 'augmenting paths with residual capacities\n';
	findpathCount = findpathSteps = 0;
	while (findpath(g.source)) {
		findpathCount++;
		let [,s] = augment(g, pedge, trace);
		if (trace) ts += s + '\n';
	}
	return [g.totalFlow(), ts,
					{'findpathCount': findpathCount,
					 'findpathSteps': findpathSteps}];
}

/** Find a shortest augmenting path from a specified vertex to the sink.
 *  @param s is a vertex in g
 *  @return true if there is an augmenting path from u to the sink
 */
function findpath(s) {
	pedge.fill(0);
    let q = new List(g.n);
    q.enq(s);
    while (!q.empty()) {
        let u = q.deq();
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
