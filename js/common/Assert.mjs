/** @file Assert.mjs 
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

/** Throw exception if assert condition is not true.
 *  Note that assertState does not affect execution of assert.
 *  This is intentional.
 */
export function assert(condition, description) {
	if (!condition) {
		throw new AssertFail(description);
	}
}

export class AssertFail extends Error {
  constructor(message) {
    super(message);
    this.name = 'Assertion Failure';
  }
}

let assertState = 1;

/** Turn assertion checking on/off. */
export function enableAssert()  { assertState = 1; }
export function disableAssert() { assertState = 0; }

export function assertEnabled() { return assertState; }
	// for use in client code with expensive assert arguments
	// write: assertEnabled() && assert(...) to avoid both
	// assertion checking and evaluation of arguments to assert.

