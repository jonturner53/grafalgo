/** \file arrayHeap.java
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
import ArrayHeap from '../ArrayHeap.mjs';

try {
	console.log('testing ArrayHeap');

	let n1 = 10; let h1 = new ArrayHeap(n1);
	
	matches(h1.n, 10, 'a1');
	matches(h1.empty(), true, 'a2');
	for (let i = 1; i <= n1; i++)
		matches(h1.contains(i), false, 'a3 ' + i);

	h1.insert(10, 10); matches(h1, '[j:10]', 'b1');
	matches(h1.empty(), false, 'b2');
	matches(h1.contains(10), true, 'b3');
	matches(h1.findmin(), 10, 'b4');
	h1.insert(6, 2); h1.insert(8, 1); h1.insert(7, 4);
	matches(h1, '[h:1 g:4 f:2 j:10]', 'b5');
	matches(h1.deletemin(), 8, 'b6');
	matches(h1, '[f:2 g:4 j:10]', 'b7');
	let stats = h1.getStats();
	matches(stats.changekeys, 0, 'b10');
	matches(stats.upsteps, 6, 'b11');
	matches(stats.downsteps, 3, 'b12');

	let h3 = new ArrayHeap(25, 2);
	matches(h3.fromString('[g:1 f:2 c:5 a:5 d:2 h:7 j:8 k:6 m:4]'), true, 'f0');
	matches(h3.toString(1),'g:1(f:2(m:4(k:6 a:5) d:2) c:5(h:7 j:8))','f1');

	h3.delete(1); matches(h3, '[g:1 f:2 c:5 d:2 h:7 j:8 k:6 m:4]', 'f2');
	h3.delete(10); matches(h3, '[g:1 f:2 c:5 d:2 h:7 k:6 m:4]', 'f3');
	h3.delete(7); matches(h3, '[f:2 c:5 d:2 h:7 k:6 m:4]', 'f4');
	h3.delete(11); matches(h3, '[f:2 c:5 d:2 h:7 m:4]', 'f5');
	h3.delete(13); matches(h3, '[f:2 c:5 d:2 h:7]', 'f6');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
