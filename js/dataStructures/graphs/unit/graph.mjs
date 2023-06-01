/** \file graph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Graph from '../Graph.mjs';

try {
	console.log('testing Flograph');

	let g = new Graph(8, 30);

	assert(g.n==8, 'a1'); assert(g.m==0, 'a2');
	assert(g, '{h}', 'a3');
	g.join(1, 4);
	g.join(1, 3); g.join(2, 4); g.join(3, 5);
	assert(g, '{a[d c] b[d] c[a e] d[b a] e[c] h[]}', 'a4');
	g.join(5, 1); g.join(2, 7); g.join(3, 7);
	assert(g, '{a[d c e] b[d g] c[a e g] d[a b] e[c a] g[b c] h}', 'a5');
	let elist = [];
	elist.push(g.join(5, 9));
	elist.push(g.join(7, 8));
	elist.push(g.join(9, 4)); 
	assert(g.elist2string(elist), '[{e,i} {g,h} {i,d}]', 'a6');
	assert(g, '{a[d c e] b[d g] c[a e g] d[a b i] ' +
			  'e[c a i] g[b c h] h[g] i[e d]}', 'a7');
	g.delete(g.findEdge(1, 3)); g.delete(g.findEdge(4, 2));
	assert(g, '{a[d e] b[g] c[e g] d[a i] ' +
			  'e[c a i] g[b c h] h[g] i[e d]}', 'a8');
	assert(g.degree(1)==2, 'a8');
	assert(g.degree(2)==1, 'a80');
	assert(g.degree(6)==0, 'a81');
	assert(g.degree(7)==3, 'a82');
	assert(g.maxDegree()==3, 'a83');
	g.weight(g.findEdge(1, 4), 4);
	assert(g, '{a[d:4 e:0] b[g:0] c[e:0 g:0] d[a:4 i:0] e[c:0 a:0 i:0] ' +
			  'f[] g[b:0 c:0 h:0] h[g:0] i[e:0 d:0]}', 'a9');

	let g2 = new Graph(); g2.assign(g);
	assert(g, g2, 'b1');
	assert(g2, '{a[d:4 e:0] b[g:0] c[e:0 g:0] d[a:4 i:0] e[c:0 a:0 i:0] ' +
			   'f[] g[b:0 c:0 h:0] h[g:0] i[e:0 d:0]}', 'b2');
	g2.clear();
	assert(g2, '{a[] b[] c[] d[] e[] f[] g[] h[] i[]}', g2.m, 0, 'b3'); 

	g.reset(4, 10, 10);
	assert(g.fromString('{a[d b] b[a c] c[b d] d[a c]}'),'c0');
	assert(g, '{a[b d] b[a c] c[b d] d[a c]}', 'c1');
	g.fromString('{a[d:1 b:2] b[c:3] c[d:4]}')
	assert(g, '{a[b:2 d:1] b[a:2 c:3] c[b:3 d:4] d[a:1 c:4]}', 'c2');
	assert(g.toString(0,0,(u) => g.x2s(u) + ':' + u),
		   '{a:1[d:1 b:2] b:2[a:2 c:3] c:3[b:3 d:4] d:4[a:1 c:4]}', 'c3');

} catch(e) {
    if (e instanceof AssertError) {
		if (e.message.length != 0)
        	console.error(`${e.name}: ${e.message}`);
		else
			console.error(e.stack);
    } else {
        console.error(`${e.message}`);
		console.error(e.stack);
	}
}
