/** @file Assert.mjs 
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

export const EnableAssert = 1;
	// for use in client code with expensive assert arguments
	// write: EnableAssertions && assert(...) to avoid
	// evaluation of arguments to assert when assertion
	// are disabled

/** Throw exception if assert condition is not true */
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
