/** \file wmatch.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import Matching from '../Matching.mjs';
import wmatchE from '../wmatchE.mjs';
import wmatchEeq from '../wmatchEeq.mjs';
import wmatchGMG0 from '../wmatchGMG0.mjs';
//import wmatchGMG from '../wmatchGMG.mjs';
import matchVerify from '../matchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger } from '../../../common/Random.mjs';
import { randomGraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'E' : wmatchE,
	'Eeq' : wmatchEeq,
	'GMG0' : wmatchGMG0
//	'GMG' : wmatchGMG
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'wmatch', algomap);

let g = new Graph(); g.addWeights();
g.fromString('{ a[b:3 h:1 j:3 k:3] b[a:3 f:2 g:1 j:3 p:2] c[f:1 m:1] d[g:2] e[f:2 g:3 i:2 n:1] f[b:2 c:1 e:2 l:2 o:3 p:1] g[b:1 d:2 e:3 k:1 o:1] h[a:1] i[e:2] j[a:3 b:3] k[a:3 g:1 p:3] l[f:2 o:1] m[c:1 o:2 p:1] n[e:1] o[f:3 g:1 l:1 m:2] p[b:2 f:1 k:3 m:1] }');
//tester.addTest('small graph', g);

//g = randomGraph(26, 5); g.randomWeights(randomInteger,1,9);
g.fromString('{ a[e:5 j:1] b[h:8 k:4] c[f:5 h:1 l:4 o:6 p:8 x:2 y:9] d[r:3 x:5] e[a:5 f:9 k:1 q:7] f[c:5 e:9 g:1 o:6 v:4 y:9] g[f:1 r:3 w:1 x:7] h[b:8 c:1 l:5 q:2 r:1 x:2 z:2] i[k:6 l:8 y:6 z:7] j[a:1 l:7 o:3 r:2 w:9] k[b:4 e:1 i:6] l[c:4 h:5 i:8 j:7 w:1] m[r:1 v:2 z:2] n[p:5 w:1] o[c:6 f:6 j:3 p:2 r:4 y:1] p[c:8 n:5 o:2 t:1] q[e:7 h:2 s:4 v:5 w:7 y:1] r[d:3 g:3 h:1 j:2 m:1 o:4 v:6 w:3 x:4 z:8] s[q:4 u:7 y:3] t[p:1 z:6] u[s:7 v:3 w:8 z:6] v[f:4 m:2 q:5 r:6 u:3 w:9 x:5 z:9] w[g:1 j:9 l:1 n:1 q:7 r:3 u:8 v:9 y:5] x[c:2 d:5 g:7 h:2 r:4 v:5 z:8] y[c:9 f:9 i:6 o:1 q:1 s:3 w:5] z[h:2 i:7 m:2 r:8 t:6 u:6 v:9 x:8] }');
tester.addTest('small random (26, 5) ', g);
//
//g = randomGraph(100, 15); g.randomWeights(randomInteger,1,99);
//tester.addTest('medium random (100, 15)', g);
//
//g = randomGraph(400, 60); g.randomWeights(randomInteger,1,999);
//tester.addTest('large random (400, 60)', g);
//
//g = randomGraph(400, 3); g.randomWeights(randomInteger,1,999);
//tester.addTest('large random sparse (400, 3)', g);
//
//g = randomGraph(400, 200); g.randomWeights(randomInteger,1,999);
//tester.addTest('large random dense (400, 200)', g);

tester.run();
