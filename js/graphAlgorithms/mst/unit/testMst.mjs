/** \file testMst.java
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
import { randomFraction } from '../../../common/Random.mjs';
import { randomGraph } from '../../misc/RandomGraph.mjs';

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
	let random = (args.indexOf('random') >= 0);
	if (args.indexOf('all') >= 0)
		args = Object.keys(algorithms).slice(0);
	for (let aname of args) {
		if (!algorithms.hasOwnProperty(aname)) continue;
		let algo = algorithms[aname];
		basicTests(aname, algo, trace, stats);
	}
	if (!random) return;
	for (let aname of args) {
		if (!algorithms.hasOwnProperty(aname)) continue;
		let algo = algorithms[aname];
		randomTests(aname, algo, trace, stats);
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
	
		let g = new Graph_w(6);
		g.fromString("{a[b:3 d:2 e:5] b[a:3 c:7 f:4] c[b:7 d:1 f:2] " +
					 "d[a:2 c:1 e:3] e[a:5 d:3 f:1] f[b:4 c:2]}");
	
		let [elist, ts, ss] = algo(g, trace);
		if (trace) console.log(ts);
		if (stats) console.log(ss);
		assert(mst_verify(g, elist), 'ok', 'a1');
		assert(mst_verify(g, elist.slice(0, 4)),
			   'mst_verify: tree components do not match graph', 'a2');
		let e = g.join(2, 4); g.setWeight(e, 1);
		assert(mst_verify(g, elist),
				  'mst_verify: cheap cross-edge 10=(b,d,1) in g', 'a3');

		e = g.join(3, 10); g.setWeight(e, 2);
		e = g.join(6, 10); g.setWeight(e, 5);
		e = g.join(6, 7); g.setWeight(e, 2);
		e = g.join(3, 8); g.setWeight(e, 6);
		e = g.join(2, 9); g.setWeight(e, 1);
		e = g.join(9, 10); g.setWeight(e, 1);
		[elist, ts, ss] = algo(g, trace);
		if (trace) console.log(ts);
		if (stats) console.log(ss);
		assert(mst_verify(g, elist), 'ok', 'a4');
	
		g.fromString('{a[b:3 d:2] b[a:3 c:7] c[b:7 d:1] ' +
					 'd[a:2 c:1] e[f:1 g:3] f[e:1 g:2 h:3] g[e:3 f:2 h:1]}');
		[elist, ts, ss] = algo(g, trace);
		if (trace) console.log(ts);
		if (stats) console.log(ss);
		assert(mst_verify(g, elist), 'ok', 'a5');
	
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

function randomTests(aname, algo, trace=false, stats=false) {
	try {
		console.log('running random graph tests on ' + aname);

		let g = new Graph_w();
        g.embed(randomGraph(1000, 10000));
        g.randomWeights(randomFraction);
        let t0 = Date.now();
        let [elist,,ss] = algo(g);
        let t1 = Date.now();
		assert(mst_verify(g, elist), 'ok', 'r1');
        console.log(aname, g.n, g.m, '' + (t1-t0) + 'ms');
		if (stats) console.log(ss);
	
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
