/** @file Exceptions.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EXCEPTIONS_H
#define EXCEPTIONS_H

#include "stdinc.h"

/** This class contains exceptions used within algolib
 */

/** This exception is thrown by methods that detect illegal argument values.
 *  The constructor initializes an internal exception string that can be
 *  retrieved using the toString method.
 */
class IllegalArgumentException {
public:
	/** Construct a new object and initialize the exception string.
	 *  @param s is a reference to a string describing the condition that
	 *  triggered the exception.
	 */
	IllegalArgumentException(string& s) {
		xStr = "IllegalArgumentException: " + s;
	}

	/** Construct a string representing the object.
	 *  @param s is a reference to a string in which the result is returned
	 *  @return a reference to s;
	 */
	string& toString(string& s) { s = xStr; return s; }
private:
	string xStr; 
};

/** This exception is thrown by constructors (and other methods) that
 *  are unable to allocate space for the data structure because there is
 *  no memory left to allocate.
 *
 *  The constructor initializes an internal exception string that can be
 *  retrieved using the toString method.
 */
class OutOfSpaceException {
public:
	/** Construct a new object and initialize the exception string.
	 *  @param s is a reference to a string describing the condition that
	 *  triggered the exception.
	 */
	OutOfSpaceException(string& s) { xStr = "OutOfSpaceException: " + s; }

	/** Construct a string representing the object.
	 *  @param s is a reference to a string in which the result is returned
	 *  @return a reference to s;
	 */
	string& toString(string& s) { s = xStr; return s; }
private:
	string xStr; 
};

#endif
