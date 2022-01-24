/** \file maxflow.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import maxflowFFsp from '../maxflowFFsp.mjs';
import maxflowD from '../maxflowD.mjs';
import maxflowDST from '../maxflowDST.mjs';
import maxflowFFmc from '../maxFlowFFmc.mjs';
import maxflowFFcs from '../maxFlowFFcs.mjs';
import maxflowGTf from '../maxFlowGTf.mjs';
import maxflowGThl from '../maxFlowGThl.mjs';
import maxflowVerify from '../maxflowVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomFlograph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'FFsp' : maxflowFFsp,
	'D' : maxflowD,
	'DST' : maxflowDST,
	'FFmc' : maxflowFFmc,
	'FFcs' : maxflowFFcs,
	'GTf' : maxflowGTf,
	'GThl' : maxflowGThl
}

function main() {
	let args = getArgs();
	let trace = (args.indexOf('trace') >= 0);
	let stats = (args.indexOf('stats') >= 0);
	let batch = (args.indexOf('nobatch') < 0);
	let all = (args.indexOf('all') >= 0);

	// build array of algorithms to run
	let algorithms = [];
	for (let key of Object.keys(algomap)) {
		for (let arg of args) {
			if (all || arg.toLowerCase() == key.toLowerCase()) {
				algorithms.push({'name': 'maxflow'+key, 'code': algomap[key]});
				break;
			}
		}
	}

	let testcases = maketests();

	try {
		runtests(testcases, algorithms, trace, stats, batch);
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

function maketests() {
	let cases = [];

	cases.push({ 'name': 'simple', 'g': new Flograph(), 'value': 5});
	cases[cases.length-1].g.fromString(
					'{a->[b:3:0 d:2:0] b[c:3:0 d:7:0 g:3:0] c[d:1:0 e:5:0] ' +
					'd[e:2:0 f:1:0 g:3:0] e[f:1:0 g:3:0 h:4:0] ' +
					'f[e:1:0 g:2:0 h:3:0] g[e:3:0 f:2:0 h:1:0] ' +
					'h[f:3:0 i:4:0 j:2:0] i[g:5:0 j:6:0] ->j[]}');

	cases.push({'name': 'small random', 'g': randomFlograph(4,3,1,60),
				'value': 0});
	cases[cases.length-1].g.randomCapacities(5, randomInteger, 1, 9);

	cases.push({'name': 'large random', 'g': randomFlograph(20, 20, 2, 16000),
				'value': 0});
	cases[cases.length-1].g.randomCapacities(10, randomInteger, 1, 99);

	return cases;
}

function runtests(testcases, algorithms, trace, stats, batch) {
	console.log('running tests');
	for (let tcase of testcases) {
		let small = (tcase.g.n < 20);
		if (trace || stats)
			console.log(`${tcase.name} ${tcase.g.n} ${tcase.g.m}`);
		if (trace && small)
			console.log(tcase.g.toString(0,1));
		for (let algo of algorithms) {
			tcase.g.clearFlow();
        	let t0 = Date.now();
			let [f, traceString, statsObj] =
					algo.code(tcase.g, trace && small, batch);
        	let t1 = Date.now();
			if (trace && small)
				console.log(`${algo.name}\n${traceString}`);
			if (stats) {
				let ss = JSON.stringify(statsObj);
				console.log(`${algo.name}, flow ${f}, ${t1-t0}ms, ${ss}`);
			}
			let tag = `${algo.name}(${tcase.name})`
			assert(maxflowVerify(tcase.g), '', tag+'.verify');
			if (tcase.value != 0) assert(f, tcase.value, tag+'.value');
		}
	}
	console.log('tests completed');
}

main();
