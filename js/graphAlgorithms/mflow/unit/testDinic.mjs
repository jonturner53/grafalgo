/** \file TestDinic.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import mflo_dinic from '../mflo_dinic.mjs';

try {
	console.log('running basic tests');

	let g = new Flograph(6, 20);
	g.fromString('{a->[b:4:0 c:3:0] b[c:3:0 d:2:0] c[e:4:0] d[f:4:0] ' +
				 'e[d:2:0 f:3:0] ->f[]}');
	let f = mflo_dinic(g);
	let s = '{a->[b:4:3 c:3:3] b[c:3:1 d:2:2] c[e:4:4] ' +
            'd[f:4:3] e[d:2:1 f:3:3] ->f[]}'
	assert(g.equals(s, true), `a2 ${g} ${s}`);

	console.log('passed tests');
} catch(e) {
    if (e instanceof AssertError) {
		if (e.message.length != 0)
        	console.error(`${e.name}: ${e.message}`);
		else
			console.error(e.stack);
    } else {
        console.error(`${e.message}`);
		console.error(e.stack);
	}
}
