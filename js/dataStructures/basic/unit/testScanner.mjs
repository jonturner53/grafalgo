/** \file testScanner.js
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

'use strict';

import { AssertFailure } from '../../Adt.mjs';
import Scanner from '../Scanner.mjs';

try {
	console.log('running basic tests');

	let s = new Scanner("  123  45.5abc_2C.  a  23 \n xx");
	s.assertEqual(s.nextInt(), 123, 'a1');
	s.assertEqual(s.nextFloat(), 45.5, 'a2');
	s.assertEqual(s.nextWord(), 'abc_2C', 'a3');
	s.assertTrue(s.verify('.'), 'a4');
	s.assertEqual(s.nextIndex(), 1, 'a5');
	s.assertEqual(s.nextIndex(), 23, 'a6');
	s.assertTrue(s.verify('x'), 'a7');

	s.reset();
	s.assertEqual('  123  45.5abc_2C.  a  23 \n xx', 'b1');
	s.assertEqual(s.nextWord(), '', 'b2');
	s.assertEqual(s.nextFloat(), 123, 'b3');
	s.assertEqual(s.nextInt(), 45, 'b4');
	s.assertTrue(s.equals('.5abc_2C.  a  23 \n xx'), 'b5');
	s.assertEqual(s.length, 21, 'b6');
	

	console.log('passed tests');
} catch(e) {
    if (e instanceof AssertFailure)
        console.log(e.name + ': ' + e.message);
    else
        throw(e);
}
