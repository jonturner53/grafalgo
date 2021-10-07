/** \file TestGraph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Graph from '../Graph.mjs';

try {
	console.log('running basic tests');

	let n = 8; let ecap = 30;
	let g = new Graph(n, ecap);

	assert(g.n==n, 'a1');
	assert(g.m==0, 'a2');
	assert(g, '{a[] b[] c[] d[] e[] f[] g[] h[]}', 'a3');
	g.join(1, 4);
	g.join(1, 3); g.join(2, 4); g.join(3, 5);
	assert(g, '{a[d c] b[d] c[a e] d[a b] e[c] f[] g[] h[]}', 'a4');
	g.join(5, 1); g.join(2, 7); g.join(3, 7);
	assert(g, '{a[d c e] b[d g] c[a e g] d[a b] e[c a] f[] g[b c] h[]}', 'a5');
	let elist = [];
	elist.push(g.join(5, 9));
	elist.push(g.join(7, 8));
	elist.push(g.join(9, 4)); 
	assert(g, '{a[c d e] b[d g] c[a e g] d[a b i] ' +
				    'e[a c i] f[] g[b c h] h[g] i[e d]}', 'a6');
	g.delete(g.findEdge(1, 3)); g.delete(g.findEdge(4, 2));
	assert(g, '{a[d e] b[g] c[e g] d[a i] ' +
				    'e[a c i] f[] g[b c h] h[g] i[e d]}', 'a7');
	assert(g.degree(1)==2, 'a8');
	assert(g.degree(2)==1, 'a80');
	assert(g.degree(6)==0, 'a81');
	assert(g.degree(7)==3, 'a82');
	assert(g.maxDegree()==3, 'a83');
	assert(g.elist2string(elist), '[{e,i} {g,h} {i,d}]', 'a9');

	let g2 = new Graph(); g2.assign(g);
	assert(g.toString() != g2.toString(), 'b1');
	assert(g, g2, 'b2');
	assert(g2, '{a[d e] b[g] c[e g] d[a i] ' +
				     'e[a c i] f[] g[b c h] h[g] i[d e]}', 'b3');
	g2.clear();
	assert(g2, '{a[] b[] c[] d[] e[] f[] g[] h[] i[]}', g2.m, 0, 'b4'); 
	g.reset(4, 10, 10);
	g.fromString('{a[d b] b[a c] c[b d] ' + 'd[a c]}');
	assert(g, '{a[b d] b[a c] c[b d] d[a c]}', 'c1');

	console.log('passed tests');
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
