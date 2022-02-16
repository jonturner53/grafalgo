/** \file allpairs.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import allpairsF from '../allpairsF.mjs';
import allpairsEK from '../allpairsEK.mjs';
import sptVerify from '../sptVerify.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomDigraph } from '../../misc/RandomGraph.mjs';

let algorithms = {
	'F' : allpairsF,
	'EK' : allpairsEK
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
	
		let g = new Digraph();
		g.fromString('{a[b:3 d:-2 f:4] b[c:7 e:4 f:1] c[d:1 f:2] ' +
					 'd[b:1 e:3] e[a:5 b:1] f[c:3 d:1 e:-2]}' );
		let [error, pedge, dist, ts] = algo(g, trace);
		if (trace) console.log('small graph\n' + ts);
		if (error) console.log(error);
		assert(g.elist2string(pedge[1], null, true),
			   '[- - (d,b,1) (f,c,3) (a,d,-2) (f,e,-2) (b,f,1)]', 'a1');
		assert(g.nlist2string(dist[1]), '[Infinity 0 -1 3 -2 -2 0]', 'a2');
		for (let s = 1; s <= g.n; s++) {
			assert(sptVerify(g, s, pedge[s], dist[s]), '', 'b'+s);
		}

		g = randomDigraph(6, 2);
		g.randomLengths(randomInteger, 1, 99);
		for (let i = 0; i < 2; i++) {
			let e = g.randomEdge();
			g.setLength(e, randomInteger(-5, -1));
		}
		[error, pedge,dist,ts] = algo(g, trace);
		if (error.length > 0) {
			console.log('small random graph ' + error);
		} else {
			for (let s = 1; s <= g.n; s++)
				assert(sptVerify(g, s, pedge[s], dist[s]), '', 'c'+s);
			if (trace) console.log('small random graph\n' + ts);
		}

		g = randomDigraph(300, 10);
		g.randomLengths(randomInteger, -3, 99);
		let statistics;
		let t0 = Date.now();
		[error, pedge, dist, ts, statistics] = algo(g);
		let t1 = Date.now();
		if (error.length > 0) {
			console.log('large random graph ' + error);
		} else {
			for (let s = 1; s <= g.n; s++) {
				assert(sptVerify(g, s, pedge[s], dist[s]), '', 'd'+s);
			}
			if (stats) {
				console.log('large random graph ' + g.n + ' ' + g.m + ' ' +
							(t1-t0) + 'ms ' + JSON.stringify(statistics));
			}
		}
	
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
