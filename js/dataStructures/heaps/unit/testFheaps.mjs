/** \file TestFheaps.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Adt from '../../Adt.mjs';
import Scanner from '../../basic/Scanner.mjs';
import Fheaps from '../Fheaps.mjs';

try {
	console.log('running basic tests');

	let fh = new Fheaps(10);
	for (let i = 1; i <= fh.n; i += 2) {
		fh.setKey(i, i); fh.setKey(i+1, i+1); fh.meld(i, i+1);
	}
	fh.meld(1,3); fh.deletemin(1);
	assert(fh, '{(a:1) (b:2 c:3 d:4) (e:5 f:6) (g:7 h:8) (i:9 j:10)}', 'a1');
	fh.meld(5,7); fh.meld(5,9); fh.meld(5, 2);
	assert(fh, '{(a:1) (b:2 c:3 d:4 e:5 f:6 g:7 h:8 i:9 j:10)}', 'a2');
	fh.deletemin(2);
	assert(fh, '{(a:1) (b:2) (c:3 d:4 e:5 f:6 g:7 h:8 i:9 j:10)}', 'a3');
	assert(fh.toString(1),
		   '{(a:1:0) (b:2:0) (c:3:3(j:10:0 h:8:1(i:9:0) d:4:2(e:5:0 ' +
		   'f:6:1(g:7:0))))}', 'a4');
	fh.changeKey(9, 3, 2);
	assert(fh.toString(1),
		   '{(a:1:0) (b:2:0) (i:2:0 c:3:3(j:10:0 h:8*0 d:4:2(e:5:0 ' +
		   'f:6:1(g:7:0))))}', 'a5');
	fh.meld(1,9); fh.meld(2,1); fh.deletemin(1);
	assert(fh.toString(1),
		   '{(a:1:0) (i:2:1(b:2:0) c:3:3(j:10:0 h:8*0 d:4:2(e:5:0 ' +
		   'f:6:1(g:7:0))))}', 'a6');
	fh.changeKey(5, 9, 1); fh.changeKey(6, 5, 0);
	assert(fh.toString(1),
		   '{(a:1:0) (f:0:1(g:7:0) e:1:0 i:2:1(b:2:0) ' +
		   'c:3:2(j:10:0 h:8*0) d:4:0)}', 'a7');

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
