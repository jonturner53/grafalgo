/** \file testMst.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import sptD from '../sptD.mjs';
import sptDf from '../sptDf.mjs';
import sptBF from '../sptBF.mjs';
import sptVerify from '../sptVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomDigraph } from '../../misc/RandomGraph.mjs';

let algorithms = {
	'D' : sptD,
	'Df' : sptDf,
	'BF' : sptBF
}

function main() {
	let args = getArgs();
	let trace = (args.indexOf('trace') >= 0);
	let stats = (args.indexOf('stats') >= 0);
	let anames = [];
	let all = (args.indexOf('all') >= 0);
	for (let key of Object.keys(algorithms)) {
		for (let arg of args) {
			if (all || arg.toLowerCase() == key.toLowerCase()) {
				anames.push(key); break;
			}
		}
	}
	for (let an of anames)
		basicTests(an, algorithms[an], trace, stats);
} 

function getArgs() {
	let args = [];
	if (typeof window === 'undefined') {
		// running in node.js
		args = process.argv.slice(2);
	} else {
		// running in browser
		args = argv.slice(0);
	}
	return args;
}

function basicTests(aname, algo, trace=false, stats=false) {
	try {
		console.log('\nrunning basic tests on ' + aname);
	
		let g = new Digraph();
		g.fromString('{a[b:3 d:2 j:4] b[c:7 f:4 i:1] c[d:1 f:2 g:3] ' +
					 'd[b:1 e:3] e[a:5 g:1] f[c:3 e:1 i:2]' +
					 'g[b:2 h:2 j:1] h[i:1 e:1] i[c:3 f:1] j[b:1 c:2 g:5]}');
		let [error, pedge, dist, ts, ss] = algo(g, 1, trace);
		if (trace) console.log('small graph\n' + ts);
		if (error) console.log(error);
		assert(g.elist2string(pedge),
				'[(a,b,3) (j,c,2) (a,d,2) (d,e,3) (i,f,1) (e,g,1) (g,h,2) ' +
				'(b,i,1) (a,j,4)]', 'a1');
		assert(dist.slice(2).toString(), '3,6,2,5,5,6,8,4,4', 'a2');
		assert(sptVerify(g, 1, pedge, dist), '', 'a3');

        g = randomDigraph(10, 35);
        g.randomLengths(randomInteger, 1, 99);
		if (aname == 'BF') { // add a few negative edges
			for (let i = 0; i < 5; i++) {
				let e = g.randomEdge();
				g.setLength(e, randomInteger(-5, -1));
			}
		}
        [error, pedge,dist,ts,ss] = algo(g, 1, trace);
		if (trace) console.log('small random graph\n' + ts);
		if (error) console.log(error);
		assert(sptVerify(g, 1, pedge, dist), '', 'a4');

        g = randomDigraph(1000, 10000);
        g.randomLengths(randomFraction);
        let t0 = Date.now();
        [error, pedge,dist,ts,ss] = algo(g, 1);
        let t1 = Date.now();
		if (stats) {
			console.log('large random graph', g.n, g.m, '' + (t1-t0) + 'ms');
			console.log(JSON.stringify(ss));
		}
		assert(sptVerify(g, 1, pedge, dist), '', 'a5');
	
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
}

main();
