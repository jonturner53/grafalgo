/** \file TestToposort.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';
import toposort from '../toposort.mjs';
import { randomDag } from '../RandomGraph.mjs';

try {
	console.log('running basic tests');

	let g = new Digraph(6);
	g.fromString('{a[b f] b[c e] c[] d[a c] e[c f] f[]}');
	let vlist = toposort(g);
	assert(g.ilist2string(vlist), '[d a b e c f]', 'a1');

	g = randomDag(100, 1000); g.scramble();
	vlist = toposort(g);
	assert(vlist.length, g.n, 'a2');
	
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
