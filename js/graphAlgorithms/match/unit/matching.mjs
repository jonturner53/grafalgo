/** \file matching.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import Scanner from '../../../dataStructures/basic/Scanner.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import Matching from '../Matching.mjs';

try {
	console.log('testing Matching');

	let g = new Graph(26); g.addWeights();
	g.fromString('{a[n:6] b[f:6 v:1] c[d:9 u:8] d[c:9 m:8 t:7 w:8] e[] ' +
				 'f[b:6 s:2 w:9 y:2] g[y:6] h[k:8 o:7 s:8] i[j:5 m:4] ' +
				 'j[i:5 n:2] k[h:8] l[n:3 v:8] ' +
				 'm[d:8 i:4 t:9 u:5 v:2 x:7 z:2] n[a:6 j:2 l:3 u:7 x:0] ' +
				 'o[h:7 s:2] p[v:3] q[v:2 x:9] r[w:9] ' +
				 's[f:2 h:8 o:2 t:7 u:9 x:3] t[d:7 m:9 s:7 w:0] ' +
				 'u[c:8 m:5 n:7 s:9 x:3 y:9] v[b:1 l:8 m:2 p:3 q:2 x:3] ' +
				 'w[d:8 f:9 r:9 t:0] x[m:7 n:0 q:9 s:3 u:3 v:3] ' +
				 'y[f:2 g:6 u:9] z[m:2]}'); 
	let m = new Matching(g);
	m.fromString('[{a,n} {b,f} {c,d} {g,y} {h,k} {i,j}]');
	matches(m.size(),6,'a1');
	matches(m.weight(),40,'a2');
	matches(m,'[{a,n} {b,f} {c,d} {g,y} {h,k} {i,j}]','a3');
	matches(m.contains(g.findEdge(3,4)), true, 'a4');
	matches(m.contains(g.findEdge(13,4)), false, 'a5');
	m.add(g.findEdge(13,26));
	matches(m,'[{a,n} {b,f} {c,d} {g,y} {h,k} {i,j} {m,z}]','a6');
	m.drop(g.findEdge(3,4));
	matches(m,'[{a,n} {b,f} {g,y} {h,k} {i,j} {m,z}]','a7');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
