/** \file testPrim.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../Errors.mjs';
import mst_prim from '../mst_prim.mjs';
import mst_verify from '../mst_verify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Graph_w from '../../../dataStructures/graphs/Graph_w.mjs';

try {
	console.log("running basic tests");

	let trace = 1; let g = new Graph_w(6);
	g.fromString("{a[b:3 d:2 e:5] b[a:3 c:7 f:4] c[b:7 d:1 f:2] " +
				 "d[a:2 c:1 e:3] e[a:5 d:3 f:1] f[b:4 c:2]}");

	let [elist, ts] = mst_prim(g, trace);
	if (trace) console.log(ts);
	assert(g.elist2string(elist),
				  '[(a,d,2) (c,d,1) (c,f,2) (e,f,1) (a,b,3)]', 'a1');
	assert(mst_verify(g, elist), 'ok', 'a2');
	assert(mst_verify(g, elist.slice(0, 4)),
		   'mst_verify: tree components do not match graph', 'a3');
	let e = g.join(2, 4); g.setWeight(e, 1);
	assert(mst_verify(g, elist),
			  'mst_verify: cheap cross-edge 10=(b,d,1) in g', 'a5');
	e = g.join(3, 10); g.setWeight(e, 2);
	e = g.join(6, 10); g.setWeight(e, 5);
	e = g.join(6, 7); g.setWeight(e, 2);
	e = g.join(3, 8); g.setWeight(e, 6);
	e = g.join(2, 9); g.setWeight(e, 1);
	e = g.join(9, 10); g.setWeight(e, 1);
	[elist, ts] = mst_prim(g, trace);
	if (trace) console.log(ts);
	assert(g.elist2string(elist),
				  '[(a,d,2) (b,d,1) (c,d,1) (b,i,1) (i,j,1) (c,f,2) ' +
				  '(e,f,1) (f,g,2) (c,h,6)]', 'a6');
	assert(mst_verify(g, elist), 'ok', 'a7');

	g.fromString('{a[b:3 d:2] b[a:3 c:7] c[b:7 d:1] ' +
				 'd[a:2 c:1] e[f:1 g:3] f[e:1 g:2 h:3] g[e:3 f:2 h:1]}');
	[elist, ts] = mst_prim(g, trace);
	if (trace) console.log(ts);
	assert(g.elist2string(elist),
				'[(a,d,2) (c,d,1) (a,b,3) (e,f,1) (f,g,2) (g,h,1)]', 'a7'); 
	assert(mst_verify(g, elist), 'ok', 'a7');

	console.log('passed tests');
} catch(e) {
	if (e instanceof AssertError)
		if (e.message.length > 0)
			console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
	else
		throw(e);
}
