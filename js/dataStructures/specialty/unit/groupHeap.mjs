/** \file groupHeap.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import List from '../../basic/List.mjs';
import GroupHeap from '../GroupHeap.mjs';

try {
	console.log('testing GroupHeap');

	let gh = new GroupHeap();
	matches(gh.fromString('{1[a:3 b:2] 2@![c:2 d:5 e:1 j:7] ' +
					   '6[f:6 g:3] 4@[i:10]}'), true, 'a0');
	matches(gh,'{1[a:3 b:2] 2@![c:2 d:5 e:1 j:7] 6[f:6 g:3] 4@[i:10]}','a1');
	gh.delete(9,4);
	matches(gh,'{1[a:3 b:2] 2@![c:2 d:5 e:1 j:7] 6[f:6 g:3]}', 'a2');
	gh.divide(2,5,3);
	matches(gh,'{1[a:3 b:2] 2[e:1 j:7] 3[c:2 d:5] 6[f:6 g:3]}', 'a3');
	gh.activate(2); gh.deactivate(4);
	matches(gh.findmin(),5,'a4');
	matches(gh,'{1[a:3 b:2] 2@![e:1 j:7] 3[c:2 d:5] 6[f:6 g:3]}', 'a5');
	gh.add2keys(3);
	matches(gh,'{1[a:3 b:2] 2@![e:4 j:10] 3[c:2 d:5] 6[f:6 g:3]}', 'a6');
	gh.activate(3);
	matches(gh,'{1[a:3 b:2] 2@[e:4 j:10] 3@![c:2 d:5] 6[f:6 g:3]}', 'a7');
	gh.activate(6);
	matches(gh,'{1[a:3 b:2] 2@[e:4 j:10] 3@![c:2 d:5] 6@[f:6 g:3]}', 'a8');
	matches(gh.findmin(), 3, 'a9');
	gh.deactivate(3);
	matches(gh.findmin(), 7, 'a10');
	gh.clear(1);
	matches(gh,'{2@[e:4 j:10] 3[c:2 d:5] 6@![f:6 g:3]}', 'b1');
	gh.insertAfter(1, 2, 5, 2);
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
