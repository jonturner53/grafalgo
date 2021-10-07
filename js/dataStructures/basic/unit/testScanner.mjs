/** \file testScanner.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

'use strict';

import { assert,AssertError } from '../../../common/Errors.mjs';
import Scanner from '../Scanner.mjs';

try {
	console.log('running basic tests');

	let s = new Scanner("  123  45.5abc_2C.  a  23 \n xx");
	assert(s.nextInt(), 123, 'a1');
	assert(s.nextNumber(), 45.5, 'a2');
	assert(s, 'abc_2C.  a  23 \n xx', 'b1');
	assert(s.nextWord(), 'abc_2C', 'a3');
	assert(s.verify('.'), 'a4');
	assert(s.nextIndex(), 1, 'a5');
	assert(s, '  23 \n xx', 'b1');
	assert(s.nextIndex(), 23, 'a6');
	assert(s.verify('x'), 'a7');

	s.reset();
	assert(s, '  123  45.5abc_2C.  a  23 \n xx', 'b1');
	assert(s.nextWord(), '', 'b2');
	assert(s.nextNumber(), 123, 'b3');
	assert(s.nextInt(), 45, 'b4');
	assert(s.equals('.5abc_2C.  a  23 \n xx'), 'b5');
	assert(s.length, 21, 'b6');

	console.log('passed tests');
} catch(e) {
    if (e instanceof AssertFailure)
        console.log(e.name + ': ' + e.message);
    else
        throw(e);
}
