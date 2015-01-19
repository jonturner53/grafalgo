/** @file Utest.h 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef UTEST_H
#define UTEST_H

#include "stdinc.h"

/** Macro to assist in unit testing of data structures.
 *  @param x is the name of the object under test
 *  @param expr is an expression to be evaluated
 *  @param testString is a string describing the test;
 *  it is printed if the test fails, to aid with debugging
 *  @param expectedVal is the expected value of expr; if expr!=expectedValue
 *  the test fails, an error message is output and the test program terminates
 *  @param expectedFinal is the expected value of x.toString() after
 *  expr is evaluated
 */
#define chek(x, expr, testString, expectedVal, expectedFinal) { \
	string before = x.toString(); \
	int val = expr; \
	string after = x.toString(); \
	if (val != expectedVal || after != expectedFinal) { \
		cerr << "Test " << testString << " failed\n" \
		     << "expression evaluates to " << val \
		     << ", expecting " << expectedVal << endl \
		     << "initial state:" << before << endl \
		     << "final state:" << after << endl \
		     << "expected state:" << expectedFinal << endl; \
		exit(1); \
	} \
}

/** Macro to check the state of a data structure being tested.
 *  @param x is the name of the object under test
 *  @param testString is a string describing the test;
 *  it is printed if the test fails, to aid with debugging
 *  @param expected is the expected value of x.toString()
 */
#define chekState(x, testString, expected) \
	chek(x, true, testString, true, expected);

/** Macro to test a condition involving a data structure.
 *  @param x is the name of the object under test
 *  @param condition is a boolean condition to be evaluated;
 *  if it evaluates to false, the test fails
 *  @param testString is a string describing the test;
 *  it is printed if the test fails, to aid with debugging
 */
#define chekCond(x, condition, testString) \
	chek(x, condition, testString, true, x.toString());

/** Macro to test an integer-valued expression involving a data structure.
 *  @param x is the name of the object under test
 *  @param expr is an expression to be evaluated
 *  @param testString is a string describing the test;
 *  it is printed if the test fails, to aid with debugging
 *  @param expectedVal is the expected value of expr; if expr!=expectedValue
 *  the test fails, an error message is output and the test program terminates
 */
#define chekExpr(x, expr, testString, expectedVal) \
	chek(x, expr, testString, expectedVal, x.toString());

/** Macro to test a string-valued expression involving a data structure.
 *  @param x is the name of the object under test
 *  @param expr is an expression to be evaluated
 *  @param testString is a string describing the test;
 *  it is printed if the test fails, to aid with debugging
 *  @param expectedVal is the expected value of expr; if expr!=expectedValue
 *  the test fails, an error message is output and the test program terminates
 */
#define chekSexpr(x, expr, testString, expectedVal) { \
	string before = x.toString(); \
	string val = expr; \
	string after = x.toString(); \
	if (val != expectedVal) { \
		cerr << "Test " << testString << " failed\n" \
		     << "expression evaluates to " << val \
		     << ", expecting " << expectedVal << endl \
		     << "initial state:" << before << endl \
		     << "final state:" << after << endl \
		     << "expected state:" << after << endl; \
		exit(1); \
	} \
}

#endif
