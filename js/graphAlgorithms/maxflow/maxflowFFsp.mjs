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
let link;		// link[u] is edge to u from its parent in shortest path tree
let paths;      // number of calls to findpath
let pathsteps;  // number of steps in all calls to findpath

/** Compute a maximum flow in a graph using the Ford and Fulkerson algorithm.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowFFsp(fg, trace=false) {
	g = fg; link = new Int32Array(g.n+1);
	let ts = '';
	if (trace) ts += 'augmenting paths with residual capacities\n';
	paths = pathsteps = 0;
	while (findpath(g.source)) {
		paths++;
		let [,s] = augment(g, link, trace);
		if (trace) ts += s + '\n';
	}
	if (trace) ts += '\n' + g.toString(1);
	return [ts, {'paths': paths,
				 'pathsteps': pathsteps}];
}

/** Find a shortest augmenting path from a specified vertex to the sink.
 *  @param s is a vertex in g
 *  @return true if there is an augmenting path from u to the sink
 */
function findpath(s) {
	link.fill(0);
    let q = new List(g.n);
    q.enq(s);
    while (!q.empty()) {
        let u = q.deq();
        for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			pathsteps++;
            let v = g.mate(u,e);
            if (g.res(e, u) > 0 && link[v] == 0 && v != g.source) {
                link[v] = e;
                if (v == g.sink) return true;
                q.enq(v);
            }
        }
    }
    return false;
}
