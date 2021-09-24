/** \file testDijjkstra.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../Errors.mjs';
import spt_dijkstra from '../spt_dijkstra.mjs';
import spt_verify from '../spt_verify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Digraph_l from '../../../dataStructures/graphs/Digraph_l.mjs';

try {
	console.log("running basic tests");

	let n = 6; let l1 = new List(n);
	let g = new Digraph_l(n);
	g.fromString("{a[b:3 d:2] b[c:7 f:4] c[d:1 f:2] " +
				 "d[e:3] e[a:5] f[c:3 e:1]}");

	console.log('g=' + g);
	let [pedge, dist] = spt_dijkstra(g, 1, 1);
	assert(g.elist2string(pedge.slice(2)),
				  '[(a,b,3) (b,c,7) (a,d,2) (d,e,3) (b,f,4)]', 'a1');
	assert(spt_verify(g, 1, pedge, dist), 'ok', 'a2');
	let e = pedge[6]; pedge[6] = 0;
	assert(spt_verify(g, 1, pedge, dist),
		   'spt_verify: reachable vertex 6 not in tree', 'a3');
	pedge[6] = e;
	e = g.join(2, 5); g.setLength(e, 1);
	assert(spt_verify(g, 1, pedge, dist),
			  'spt_verify: (b,e,1) violates distance condition', 'a5');
	e = g.join(3, 10); g.setLength(e, 2);
	e = g.join(10, 6); g.setLength(e, 1);
	e = g.join(6, 7); g.setLength(e, 2);
	e = g.join(3, 8); g.setLength(e, 6);
	e = g.join(2, 9); g.setLength(e, 1);
	e = g.join(9, 10); g.setLength(e, 1);
	console.log('\ng=' + g);
	[pedge, dist] = spt_dijkstra(g, 1, 1);
	assert(g.elist2string(pedge.slice(2)),
				'[(a,b,3) (f,c,3) (a,d,2) (b,e,1) (j,f,1) (f,g,2) (c,h,6) ' +
				'(b,i,1) (i,j,1)]', 'a6');
	console.log('passed tests');
} catch (e) {
	if (e instanceof AssertError)
		if (e.message.length > 0)
			console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
	else
		throw(e);
}
