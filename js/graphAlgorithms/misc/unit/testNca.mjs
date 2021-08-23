/** \file TestNjs.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import nca from '../Nca.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { assert, AssertError } from '../../../Errors.mjs';

try {
	console.log('running basic tests');

	let t = new Graph(12);
	t.fromString('{a[b c d] b[a e f] c[a g] d[a h i] e[b] f[b k l] ' +
				 'g[c] h[d j] i[d] j[h] k[f] l[f]}');

	let ncav = nca(t, 1, [[4, 6], [5, 12], [9, 10]]);
	assert(ncav.toString(), [1, 2, 4].toString(), 'a1');
	ncav = nca(t, 10, [[4, 6], [5, 12], [9, 10]]);
	assert(ncav.toString(), [4, 2, 10].toString(), 'a2');
	ncav = nca(t, 2, [[4, 6], [5, 12], [9, 10]]);
	assert(ncav.toString(), [2, 2, 4].toString(), 'a3');
	
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
