/** \file testComponents.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../Errors.mjs';
import components from '../components.mjs';
import Dlists from '../../../dataStructures/basic/Dlists.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

try {
	console.log("running basic tests");

	let g = new Graph(10);
	g.fromString('{a[b d e] b[a c f] c[b d f] d[a c e] e[a d] f[b c] ' +
				 'g[h] h[g i] i[h]}');

	let [k, dl, ts] = components(g,1);
	assert(k, 3, 'a1');
	assert(dl, '[(a b c d e f), (g h i)]', 'a2');
	console.log(ts);

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
