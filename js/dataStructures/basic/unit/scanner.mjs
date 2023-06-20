/** \file testScanner.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

'use strict';

import { assert, AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import Scanner from '../Scanner.mjs';

try {
	console.log('testing Scanner');

	let s = new Scanner("  123  45.5abc_2C.  a  23 \n xx");
	matches(s.nextInt(), 123, 'a1');
	matches(s.nextNumber(), 45.5, 'a2');
	matches(s, 'abc_2C.  a  23 \n xx', 'b1');
	matches(s.nextWord(), 'abc_2C', 'a3');
	matches(s.verify('.'), true, 'a4');
	matches(s.nextIndex(), 1, 'a5');
	matches(s, '  23 \n xx', 'b1');
	matches(s.nextIndex(), 23, 'a6');
	matches(s.verify('x'), true, 'a7');

	s.reset();
	matches(s, '  123  45.5abc_2C.  a  23 \n xx', 'b1');
	matches(s.nextWord(), '', 'b2');
	matches(s.nextNumber(), 123, 'b3');
	matches(s.nextInt(), 45, 'b4');
	matches(s.toString(), '.5abc_2C.  a  23 \n xx', 'b5');
	matches(s.length, 21, 'b6');

	let pvec = new Array(10);
	let prop = (u,sc) => {
					if (!sc.verify(':')) {
						pvec[u] = 0; return true;
					}
					let p = sc.nextNumber();
					if (Number.isNaN(p)) return false;
					pvec[u] = p;
					return true;
				};
	s = new Scanner("a:11 b:22 c");
	matches(s.nextIndex(prop), 1, 'c1'); matches(pvec[1], 11, 'c2');
	matches(s.nextIndex(prop), 2, 'c3'); matches(pvec[2], 22, 'c4');
	matches(s.nextIndex(prop), 3, 'c5'); matches(pvec[3], 0, 'c6');

	s = new Scanner("[a b]");
	matches(s, '[a b]', 'd1');
	s = new Scanner("[a:1 b c:3]");
	let l = s.nextIndexList('[',']',prop);
	matches(l[0],1,'d2'); matches(l[1],2,'d3'); matches(l[2], 3,'d4');
	matches(pvec[1],1,'d5'); matches(pvec[2],0,'d6'); matches(pvec[3],3,'d7');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
