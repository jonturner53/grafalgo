/** \file testComponents.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
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
		console.log('running basic tests');
	
		let g = new Graph(10);
		g.fromString('{a[b d e] b[a c f] c[b d f] d[a c e] e[a d] f[b c] ' +
					 'g[h] h[g i] i[h]}');
	
		let [k, ls, ts] = components(g, trace);
		assert(k, 3, 'a1');
		assert(ls, '[(a b c d e f) (g h i)]', 'a2');
		if (trace) console.log(ts);
	
		console.log('passed tests');
	} catch (e) {
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
