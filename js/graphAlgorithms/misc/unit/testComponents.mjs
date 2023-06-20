/** \file testComponents.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import components from '../components.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

function main() {
	let args = getArgs();
	let trace = (args.indexOf('trace') >= 0);
	basicTests(trace);
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

function basicTests(trace=false) {
	try {
		console.log('testing components');
	
		let g = new Graph(10);
		g.fromString('{a[b d e] b[a c f] c[b d f] d[a c e] e[a d] f[b c] ' +
					 'g[h] h[g i] i[h]}');
	
		let [k, ls, ts] = components(g, trace);
		matches(k, 2, 'a1');
		matches(ls, '{[a b c d e f] [g h i]}', 'a2');
		if (trace) console.log(ts);
	} catch (e) {
	    if (e instanceof Mismatch) {
	        console.log(e.name + ': ' + e.message);
		} else if (e instanceof AssertFail) {
			console.error(e.stack);
		} else {
	        throw(e);
		}
	}
}
main();
