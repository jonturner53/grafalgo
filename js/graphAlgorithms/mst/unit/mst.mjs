/** \file mstTest.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import mstP from '../mstP.mjs';
import mstPf from '../mstPf.mjs';
import mstK from '../mstK.mjs';
import mstCT from '../mstCT.mjs';
import badcaseP from '../badcaseP.mjs';
import mstVerify from '../mstVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomConnectedGraph } from '../../misc/RandomGraph.mjs';

let algorithms = {
	'P' : mstP,
	'Pf' : mstPf,
	'K' : mstK,
	'CT' : mstCT
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
		console.log('running basic tests on ' + aname);
	
		let g = new Graph();
		g.fromString('{a[b:3 d:2] b[a:3 c:7] c[b:7 d:1] d[a:2 c:1] ' +
					 'e[f:1 g:3] f[e:1 g:2 h:3] g[e:3 f:2 h:1] i[j:5] j[i:5]}');
		let [elist,ts,ss] = algo(g, trace ? 2 : 0);
		if (trace) console.log('small 3 component graph\n' + ts);
		assert(mstVerify(g, elist), '', 'a1');
		assert(g.elist2string(g.sortedElist(elist)),
			 '[{a,b,3} {a,d,2} {c,d,1} {e,f,1} {f,g,2} {g,h,1} {i,j,5}]',
			 'a2');

		g = new Graph();
		g = randomConnectedGraph(10, 15);
        g.randomWeights(randomInteger, 0, 99);
        [elist,ts,ss] = algo(g, trace);
		if (trace) console.log('small random graph\n' + ts);
		assert(mstVerify(g, elist), '', 'a3');

        g.xfer(randomGraph(1000, 10000));
        g.randomWeights(randomFraction);
        let t0 = Date.now();
        [elist,ts,ss] = algo(g);
        let t1 = Date.now();
		if (stats) {
			console.log('large random graph', g.n, g.m, '' + (t1-t0) + 'ms');
			console.log(JSON.stringify(ss));
		}
		if (aname == 'prim') {
	        t0 = Date.now();
	        [elist,ts,ss] = algo(g, 0, 4);
	        t1 = Date.now();
			if (stats) {
				console.log('large random graph (d=4)', g.n, g.m,
							'' + (t1-t0) + 'ms');
				console.log(JSON.stringify(ss));
			}
		}
		assert(mstVerify(g, elist), '', 'a4');
	
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
