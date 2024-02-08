/** \file blossoms.mjs
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
import Blossoms from '../Blossoms.mjs';

try {
	console.log('testing Blossoms');

	let g = new Graph(16); g.hasWeights = true;
	g.fromString(
			'{a[b:6] b[a:6 c:1] c[b:1 d:2 h:7] d[c:2 e:8] ' +
            'e[d:8 f:5 g:9] f[e:5 g:7] g[e:9 f:7 j:1 k:3 i:8] ' +
            'h[c:7 i:4] i[g:8 h:4] j[g:1 k:3] k[g:3 j:3 p:7] ' +
            'l[m:6] m[l:6 n:3] n[m:3 o:9 p:1] o[n:9 p:2] p[k:7 n:1 o:2]}');

	let match = new Matching(g);
	match.fromString('[{b,c} {d,e} {f,g} {j,k} {h,i} {m,n} {o,p}]');
	matches(match,'[{b,c,1} {d,e,8} {f,g,7} {j,k,3} {h,i,4} {m,n,3} {o,p,2}]',
				 'a1');
	let bloss = new Blossoms(g,match);
	bloss.fromString('{{} {[l(m(n(o(p))))]}}');
	matches(bloss,'{{} {[l(m(n(o(p))))]}}', 'a1');
	bloss.addBlossom(g.findEdge(14,16), 14);
	matches(bloss,'{{[A(!n p o)]} {[l(m(A{n,m}))]}}', 'a2');
	bloss.addBranch(g.findEdge(1,2),2);
	bloss.addBranch(g.findEdge(3,4),4);
	bloss.addBranch(g.findEdge(5,6),6);
	matches(bloss,'{{[A(!n p o)]} {[a(b(c(d(e(f(g))))))] [l(m(A{n,m}))]}}',
				 'a3');
	bloss.addBlossom(g.findEdge(5,7), 5);
	matches(bloss, '{{[B(!e g f)] [A(!n p o)]} ' +
				  ' {[a(b(c(d(B{e,d}))))] [l(m(A{n,m}))]}', 'a4');
	bloss.addBranch(g.findEdge(3,8),8);
	bloss.addBranch(g.findEdge(7,10),10);
	matches(bloss,'{{[A(!n p o)] [B(!e g f)]} ' +
				 ' {[a(b(c(d(B{e,d}(j{j,g}(k))) h(i))))] [l(m(A{n,m}))]}',
				 'a5');
	bloss.addBlossom(g.findEdge(7,11), 18);
	matches(bloss,'{{[A(!n p o)] [C(!B{g,k}(!e g f) k j{j,g})]} ' +
				 ' {[a(b(c(d(C{e,d}) h(i))))] [l(m(A{n,m}))]}}', 'a6');
	matches(bloss.outerGraph2string(),
				'{a[b] b[a c] c[b d h] d[c C] h[c i] i[C h] l[m] ' +
				'm[l A] A[C m] C[d i A]}', 'a6');
	bloss.addBlossom(g.findEdge(7,9), 3);

	matches(bloss,'{{[A(!n p o)] ' +
				 '  [D(!c d{d,e} C{g,i}(!B{g,k}(!e g f) k j{j,g}) i h)]} ' +
				 ' {[a(b(D{c,b}))] [l(m(A{n,m}))]}}', 'a7');
	matches(bloss.verify(), '', 'a9');

	g = new Graph(9);
	g.fromString('{a[b:6 c:2] b[c:1 e:3] c[d:2] d[e:2 g:8] ' +
            	  'e[f:5] f[h:5] g[h:9] h[i:4]}');
	match = new Matching(g);
	match.fromString('[{b,c} {d,g} {e,f} {h,i}]');
	bloss = new Blossoms(g,match);
	bloss.fromString('{{[A(!a b c)]} {}}');
	matches(bloss,'{{[A(!a b c)]} {}}', 'b1');
	bloss.expand(10);
	matches(bloss,'{{} {}}', 'b2');
	bloss.fromString('{{[A(!a b c)] [B(!h g d e f)]} {[A(B{d,c}(i{i,h}))]}');
	bloss.expandOdd(11);
	matches(bloss.verify(), '', 'b3');
	matches(bloss,'{{[A(!a b c)]} {[A(d{d,c}(g(h(i))))]}', 'b4');
	matches(bloss.verify(), '', 'b5');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
