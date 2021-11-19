/** \file mstTest.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import mst_prim from '../mst_prim.mjs';
import mst_primf from '../mst_primf.mjs';
import mst_kruskal from '../mst_kruskal.mjs';
import mst_chetar from '../mst_chetar.mjs';
import badcase_prim from '../badcase_prim.mjs';
import mst_verify from '../mst_verify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Graph_w from '../../../dataStructures/graphs/Graph_w.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomConnectedGraph } from '../../misc/RandomGraph.mjs';

let algorithms = {
	'prim' : mst_prim,
	'primf' : mst_primf,
	'kruskal' : mst_kruskal,
	'chetar' : mst_chetar
}

function main() {
	let args = getArgs();
	let trace = (args.indexOf('trace') >= 0);
	let stats = (args.indexOf('stats') >= 0);
	if (args.indexOf('all') >= 0)
		args = Object.keys(algorithms).slice(0);
	for (let aname of args) {
		if (!algorithms.hasOwnProperty(aname)) continue;
		let algo = algorithms[aname];
		basicTests(aname, algo, trace, stats);
	}
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
	
		let g = new Graph_w();
		g.fromString('{a[b:3 d:2] b[a:3 c:7] c[b:7 d:1] d[a:2 c:1] ' +
					 'e[f:1 g:3] f[e:1 g:2 h:3] g[e:3 f:2 h:1] i[j:5] j[i:5]}');
		let [elist,ts,ss] = algo(g, trace ? 2 : 0);
		if (trace) console.log('small 3 component graph\n' + ts);
		assert(mst_verify(g, elist), '', 'a1');
		assert(g.elist2string(elist.sort()),
			 '[(a,b,3) (i,j,5) (a,d,2) (c,d,1) (e,f,1) (f,g,2) (g,h,1)]',
			 'a2');

		g = new Graph_w();
        g.embed(randomConnectedGraph(10, 15));
        g.randomWeights(randomInteger, 0, 99);
        [elist,ts,ss] = algo(g, trace);
		if (trace) console.log('small random graph\n' + ts);
		assert(mst_verify(g, elist), '', 'a3');

        g.embed(randomGraph(1000, 10000));
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
		assert(mst_verify(g, elist), '', 'a4');
	
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
