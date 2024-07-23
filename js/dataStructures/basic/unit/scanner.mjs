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

	let sc = new Scanner('  123  45.5abc_2C.  a  23 \n "xy"z');
	matches(sc.nextInt(), 123, 'a0');
	matches(sc.nextNumber(), 45.5, 'a1');
	matches(sc, 'abc_2C.  a  23 \n "xy"z', 'a2');
	matches(sc.nextWord(), 'abc_2C', 'a3');
	matches(sc.verify('.'), true, 'a4');
	matches(sc.nextIndex(), 1, 'a5');
	matches(sc, '  23 \n "xy"z', 'a6');
	matches(sc.nextIndex(), 23, 'a7');
	matches(sc.nextLine(), " \n", 'a8');
	matches(sc.nextString(), 'xy', 'a9');
	matches(sc, 'z', 'a10');

	sc.reset(0,'  123  45.5e+2abc_2C.  a  23 \n xx');
	matches(sc, '  123  45.5e+2abc_2C.  a  23 \n xx', 'b1');
	matches(sc.nextWord(), '', 'b2');
	matches(sc.nextNumber(), 123, 'b3');
	matches(sc.nextInt(), 45, 'b4');
	matches(sc.toString(), '.5e+2abc_2C.  a  23 \n xx', 'b5');
	matches(sc.nextNumber(), 50, 'b6');
	matches(sc.length, 19, 'b7');

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
	sc = new Scanner("a:11 b:22 c");
	matches(sc.nextIndex(prop), 1, 'c1'); matches(pvec[1], 11, 'c2');
	matches(sc.nextIndex(prop), 2, 'c3'); matches(pvec[2], 22, 'c4');
	matches(sc.nextIndex(prop), 3, 'c5'); matches(pvec[3], 0, 'c6');

	sc = new Scanner("[a b]");
	matches(sc, '[a b]', 'd1');
	sc = new Scanner("[a:1 b c:3]");
	let l = sc.nextIndexList('[',']',prop);
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
