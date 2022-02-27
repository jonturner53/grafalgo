/** \file maxflow.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import maxflowHardcase from '../maxflowHardcase.mjs';
import maxflowFFsp from '../maxflowFFsp.mjs';
import maxflowD from '../maxflowD.mjs';
import maxflowDST from '../maxflowDST.mjs';
import maxflowFFmc from '../maxflowFFmc.mjs';
import maxflowFFcs from '../maxflowFFcs.mjs';
import maxflowGTf from '../maxflowGTf.mjs';
import maxflowGThl from '../maxflowGThl.mjs';
import minmaxflow from '../minmaxflow.mjs';
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
	let floor = (args.indexOf('floor') >= 0);
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

	let testcases = maketests(floor);

	try {
		runtests(testcases, algorithms, trace, stats, floor);
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

function maketests(floor) {
	let cases = [];

	cases.push({ 'name': 'small graph', 'g': new Flograph(), 'value': 8});
	if (!floor) {
		cases[cases.length-1].g.fromString(
				'{a->[b:5 d:6] b[c:3 d:7 g:3] c[d:1 e:5] d[e:2 f:1 g:3] ' +
				'e[f:1 g:3 h:4] f[e:1 g:2 h:3] g[e:3 f:2 h:1] ' +
				'h[f:3 i:4 j:5] i[g:5 j:6] ->j[]}');
	} else {
		cases[cases.length-1].g.fromString(
				'{a->[b:3 d:2] b[c:3 d:2-7 g:3] c[d:1 e:5] d[e:2 f:1 g:3] ' +
				'e[f:1 g:3 h:4] f[e:1 g:2 h:3] g[e:3 f:2 h:1] ' +
				'h[f:3 i:4 j:2] i[g:1-5 j:6] ->j[]}');
	}

	cases.push({'name': 'hardcase(10,10)', 'g': maxflowHardcase(10,10),
				'value': 2000});
	cases.push({'name': 'hardcase(20,10)', 'g': maxflowHardcase(20,10),
				'value': 4000});
	cases.push({'name': 'hardcase(10,20)', 'g': maxflowHardcase(10,20),
				'value': 8000});

	//cases.push({'name': 'small random', 'g': randomFlograph(3, 4, 2, 4, 6, 2),
	cases.push({'name': 'small random', 'g': randomFlograph(14, 3, 2, 2, 2), 
				'value': 0});
	if (floor) {
		cases[cases.length-1].g.randomCapacities(randomInteger, 1, 9);
		cases[cases.length-1].g.randomFloors(randomInteger, 0, 2);
	} else {
		cases[cases.length-1].g.randomCapacities(randomInteger, 1, 9);
	}

	cases.push({'name': 'medium random',
				'g': randomFlograph(62, 10, 10, 2, 2), 'value': 0});
	if (floor) {
		cases[cases.length-1].g.randomCapacities(randomInteger, 1, 99);
		cases[cases.length-1].g.randomFloors(randomInteger, 0, 30);
	} else {
		cases[cases.length-1].g.randomCapacities(randomInteger, 1, 99);
	}

	cases.push({'name': 'large  random',
				'g': randomFlograph(152, 20, 20, 2, 2), 'value': 0});
	if (floor) {
		cases[cases.length-1].g.randomCapacities(randomInteger, 1, 99);
		cases[cases.length-1].g.randomFloors(randomInteger, 0, 30);
	} else {
		cases[cases.length-1].g.randomCapacities(randomInteger, 1, 99);
	}

	return cases;
}

function runtests(testcases, algorithms, trace, stats, floor) {
	console.log('running tests');
	for (let tcase of testcases) {
		let g = tcase.g;
		let small = tcase.name.startsWith('small');
		if (trace || stats)
			console.log(`${tcase.name} ${g.n} ${g.m}`);
		if (trace && small)
			console.log(`${g.toString(0,1)}`);
		for (let algo of algorithms) {
			g.clearFlow();
        	let t0 = Date.now();
			let [f, traceString, statsObj] = (floor ?
					minmaxflow(g, algo.code, trace && small) :
					algo.code(g, trace && small));
        	let t1 = Date.now();
			if (trace && small)
				console.log(`${algo.name}\n${traceString}\n${g.toString(0,1)}`);
			if (stats) {
				let ss = JSON.stringify(statsObj);
				console.log(`${algo.name}, flow ${f}, cut size` +
							`${g.reachable().length}, ${t1-t0}ms, ${ss}`);
			}
			let tag = `${algo.name}(${tcase.name})`
			if (floor && f < 0) {
				console.log(`${tcase.name}, ${algo.name}: no feasible flow`);
				continue;
			}
			if (tcase.value != 0) assert(f, tcase.value, tag+'.value');
			assert(maxflowVerify(g), '', tag+'.verify');
		}
	}
	console.log('tests completed');
}

main();
