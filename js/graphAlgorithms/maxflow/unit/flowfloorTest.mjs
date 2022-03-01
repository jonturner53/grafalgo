/** \file maxflow.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import maxflowD from '../maxflowD.mjs';
import flowfloor from '../flowfloor.mjs';
import maxflowVerify from '../maxflowVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomFlograph } from '../../misc/RandomGraph.mjs';

function main() {
	let args = getArgs();
	let trace = (args.indexOf('trace') >= 0);

	let testcases = maketests();
	try {
		runtests(testcases, trace);
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

	cases.push({ 'name': 'small graph', 'g': new Flograph(), 'value': 5});
	cases[cases.length-1].g.fromString(
			'{a->[b:3 d:2] b[c:3 d:2-7 g:3] c[d:1 e:5] d[e:2 f:1 g:3] ' +
			'e[f:1 g:3 h:4] f[e:1 g:2 h:3] g[e:3 f:2 h:1] ' +
			'h[f:3 i:4 j:2] i[g:1-5 j:6] ->j[]}');

	cases.push({'name': 'small random', 'g': randomFlograph(14, 5, 3, 1, 1), 
				'value': 0});
	cases[cases.length-1].g.randomCapacities(randomInteger, 1, 99);
	cases[cases.length-1].g.randomFloors(randomInteger, 0, 1);

	cases.push({'name': 'medium random',
				'g': randomFlograph(62, 10, 10, 2, 2), 'value': 0});
	cases[cases.length-1].g.randomCapacities(randomInteger, 1, 99);
	cases[cases.length-1].g.randomFloors(randomInteger, 0, 4);

	cases.push({'name': 'large  random',
				'g': randomFlograph(152, 20, 20, 2, 2), 'value': 0});
	cases[cases.length-1].g.randomCapacities(randomInteger, 1, 999);
	cases[cases.length-1].g.randomFloors(randomInteger, 0, 20);

	return cases;
}

function runtests(testcases, trace) {
	console.log('running tests');
	for (let tcase of testcases) {
		let g = tcase.g;
		let small = tcase.name.startsWith('small');
		if (trace)
			console.log(`${tcase.name} ${g.n} ${g.m}`);
		if (trace && small)
			console.log(`${g.toString(0,1)}`);
		g.clearFlow();
		let [f, ts] = flowfloor(g, trace && small);
		if (f < 0) {
			console.log(`${tcase.name} : no feasible flow`);
			if (trace && small) console.log(`${ts}`);
			continue;
		}
		if (trace && small)
			console.log(`hi!! ${ts}\n${g.toString(0,1)}`);
		[f, ts] = maxflowD(g, trace && small);
		if (trace && small)
			console.log(`${ts}\n${g.toString(0,1)}`);
		if (tcase.value != 0) assert(f, tcase.value, `${tcase.name} value`);
		assert(maxflowVerify(g), '', `${tcase.name} verify`);
	}
	console.log('tests completed');
}

main();
