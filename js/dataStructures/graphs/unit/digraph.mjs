/** \file digraph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Digraph from '../Digraph.mjs';
import {randomInteger} from '../../../common/Random.mjs';

try {
	console.log('testing Digraph');

	let n = 8; let ecap = 30;
	let g = new Digraph(n, ecap);

	assert(g.n==n, 'a1');
	assert(g.m==0, 'a2');
	assert(g, '{a[] b[] c[] d[] e[] f[] g[] h[]}', 'a3');
	g.join(1, 4); g.join(1, 3); g.join(2, 4); g.join(3, 5);
	g.join(5, 2); g.join(7, 1);
	assert(g, '{a[d c] b[d] c[e] d[] e[b] f[] g[a] h[]}', 'a4');
	g.join(5, 1); g.join(2, 7); g.join(3, 7); g.join(8, 5);
	assert(g, '{a[d c] b[d g] c[e g] d[] e[b a] f[] g[a] h[e]}', 'a5');
	let elist = [];
	elist.push(g.join(5, 9));
	elist.push(g.join(7, 8));
	elist.push(g.join(9, 4)); 
	assert(g, '{a[c d] b[d g] c[e g] d[] e[a b i] f[] g[a h] h[e] i[d]}', 'a6');
	g.delete(g.findEdge(1, 3));
	g.delete(g.findEdge(5, 2));
	assert(g, '{a[d] b[d g] c[e g] d[] e[a i] f[] g[a h] h[e] i[d]}', 'a7');
	assert(g.inDegree(1)==2, 'a8');
	assert(g.outDegree(7)==2, 'a80');
	assert(g.degree(6)==0, 'a81');
	assert(g.degree(7)==4, 'a82');
	assert(g.maxDegree()==4, 'a83');
	assert(g.elist2string(elist)=='[(e,i) (g,h) (i,d)]', 'a9');

	let g2 = new Digraph(); g2.assign(g);
	assert(g.toString(), g2.toString(), 'b1');
	assert(g, g2, 'b2');
	assert(g2, '{a[d] b[d g] c[e g] d[] e[a i] f[] g[a h] h[e] i[d]}' , 'b3');
	g2.clear();
	assert(g2, '{a[] b[] c[] d[] e[] f[] g[] h[] i[]}', g2.m, 0, 'b4'); 

	g.reset(4, 10, 10);
	assert(g.fromString('{a[d b] b[c] c[d] d[b a] e[d b a]}','c0'));
	assert(g, '{a[b d] b[c] c[d] d[a b] e[a b d]}', 'c1');
	g.length(g.findEdge(1,4), 5);
	assert(g, '{a[b:0 d:5] b[c:0] c[d:0] d[a:0 b:0] e[a:0 b:0 d:0]}', 'c2');
	g.fromString('{a[d:1 b:2] b[c:3] c[d:4] d[b:5 a:6] e[d:7 b:8 a:9]}');
	assert(g, '{a[b:2 d:1] b[c:3] c[d:4] d[b:5 a:6] e[d:7 b:8 a:9]}', 'c3');

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
