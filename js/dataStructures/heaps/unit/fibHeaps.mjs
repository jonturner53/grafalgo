/** \file fibHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import Top from '../../Top.mjs';
import Scanner from '../../basic/Scanner.mjs';
import FibHeaps from '../FibHeaps.mjs';

try {
	console.log('testing FibHeaps');

	let fh = new FibHeaps(10);
	for (let i = 1; i <= fh.n; i += 2) {
		fh.key(i, i); fh.key(i+1, i+1); fh.meld(i, i+1);
	}
	fh.meld(1,3);
	fh.deletemin(1);
	matches(fh.verify(), '', 'v1 ' + fh.verify());
	matches(fh, '{[a:1] [b:2 c:3 d:4] [e:5 f:6] [g:7 h:8] [i:9 j:10]}', 'a1');
	fh.meld(5,7); fh.meld(5,9); fh.meld(5, 2);
	matches(fh, '{[a:1] [b:2 c:3 d:4 e:5 f:6 g:7 h:8 i:9 j:10]}', 'a2');
	fh.deletemin(2);
	matches(fh.verify(), '', 'v2 ' + fh.verify());
	matches(fh, '{[a:1] [b:2] [c:3 d:4 e:5 f:6 g:7 h:8 i:9 j:10]}', 'a3');
	matches(fh.toString(0x1e),
		   '{[a:1:0] [b:2:0] [c:3:3(j:10:0 h:8:1(i:9:0) d:4:2(e:5:0 ' +
		   'f:6:1(g:7:0)))]}', 'a4');
	fh.changekey(9, 3, 2);
	matches(fh.verify(), '', 'v3 ' + fh.verify());
	matches(fh.toString(0x1e),
		   '{[a:1:0] [b:2:0] [i:2:0 c:3:3(j:10:0 h:8:0! d:4:2(e:5:0 ' +
		   'f:6:1(g:7:0)))]}', 'a5');
	fh.meld(1,9); fh.meld(2,1); fh.deletemin(1);
	matches(fh.toString(0x1e),
		   '{[a:1:0] [i:2:1(b:2:0) c:3:3(j:10:0 h:8:0! d:4:2(e:5:0 ' +
		   'f:6:1(g:7:0)))]}', 'a6');
	fh.changekey(5, 9, 1);
	matches(fh.toString(0x1e),
		   '{[a:1:0] [e:1:0 i:2:1(b:2:0) c:3:3(j:10:0 h:8:0! ' +
		   'd:4:1!(f:6:1(g:7:0)))]}', 'a7');
	fh.changekey(6, 5, 0);
	matches(fh.toString(0x1e),
		   '{[a:1:0] [f:0:1(g:7:0) e:1:0 i:2:1(b:2:0) ' +
		   'c:3:2(j:10:0 h:8:0!) d:4:0]}', 'a8');
	matches(fh.verify(), '', 'v4 ' + fh.verify());

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
