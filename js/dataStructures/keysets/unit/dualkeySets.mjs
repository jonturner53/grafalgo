/** \file dualkeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import DualKeySets from '../DualKeySets.mjs';

try {
	console.log('running basic tests');

	let dk = new DualKeySets();
	dk.fromString('{[b:2:21 a:1:23 d:4:20 c:3:27] ' +
				  '[h:8:20 g:7:30 j:10:31 i:7:27 f:6:37] [e:5:29]}');
	assert(dk,'{[b:2:21 a:1:23 d:4:20 c:3:27] [e:5:29] ' +
			   '[h:8:20 g:7:30 j:10:31 i:7:27 f:6:37]}', 'a1');
	dk.delete(7);
	assert(dk, '{[b:2:21 a:1:23 d:4:20 c:3:27] [e:5:29] [g:7:30]' +
			   '[h:8:20 j:10:31 i:7:27 f:6:37]}', 'a2');
	dk.join(dk.find(1), 5, dk.find(10));
	assert(dk, '{[b:2:21 a:1:23 d:4:20 c:3:27 e:5:29 ' +
			   'h:8:20 j:10:31 i:7:27 f:6:37] [g:7:30]}', 'a3');
	assert(dk.toString(0xc), 
		'{[(a:1:23:23 b:2:21:20 (c:3:27:27 d:4:20:20 -)) ' +
		'*e:5:29:20 ((f:6:37:37 i:7:27:27 -) h:8:20:20 ' +
		'j:10:31:31)]}', 'a4');
	let u = dk.findmin(5,4); assert(u, 4, 'a5');
		u = dk.findmin(5,3);
		assert(u, 2, 'a6');
	dk.split(9);
	assert(dk, '{[b:2:21 a:1:23 d:4:20 c:3:27 e:5:29 f:6:37] ' +
			   '[g:7:30] [h:8:20 j:10:31] [i:7:27]}', 'a7');
	assert(!dk.verify(), 'a8 ' + dk.verify());

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
