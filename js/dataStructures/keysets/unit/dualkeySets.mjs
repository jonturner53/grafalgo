/** \file dualkeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import DualKeySets from '../DualKeySets.mjs';

try {
	console.log('testing DualKeySets');

	let dk = new DualKeySets();
	dk.fromString('{[b:2:21 a:1:23 d:4:20 c:3:27] ' +
				  '[h:8:20 g:7:30 j:10:31 i:7:27 f:6:37] [e:5:29]}');
	matches(dk,'{[b:2:21 a:1:23 d:4:20 c:3:27] [e:5:29] ' +
			   '[h:8:20 g:7:30 j:10:31 i:7:27 f:6:37]}', 'a1');
	dk.delete(7);
	matches(dk, '{[b:2:21 a:1:23 d:4:20 c:3:27] [e:5:29] [g:7:30]' +
			   '[h:8:20 j:10:31 i:7:27 f:6:37]}', 'a2');
	dk.join(dk.find(1), 5, dk.find(10));
	matches(dk, '{[b:2:21 a:1:23 d:4:20 c:3:27 e:5:29 ' +
			   'h:8:20 j:10:31 i:7:27 f:6:37] [g:7:30]}', 'a3');
	matches(dk.toString(0xe), 
		'{[(a:1:23 b:2:21:20 (c:3:27 d:4:20 -)) *e:5:29:20 ' +
		'((f:6:37 i:7:27 -) h:8:20 j:10:31)] g:7:30}', 'a4');
	let u = dk.findmin(5,4); matches(u, 4, 'a5');
		u = dk.findmin(5,3);
		matches(u, 2, 'a6');
	dk.split(9);
	matches(dk, '{[b:2:21 a:1:23 d:4:20 c:3:27 e:5:29 f:6:37] ' +
			   '[g:7:30] [h:8:20 j:10:31] [i:7:27]}', 'a7');
	matches(dk.verify(), '', 'a8 ' + dk.verify());

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
