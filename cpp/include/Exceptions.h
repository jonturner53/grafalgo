/** @file Exceptions.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EXCEPTIONS_H
#define EXCEPTIONS_H

using namespace std;

namespace grafalgo {

/** This class contains exceptions used within grafalgo
 */

/** This is a generic base class for grafalgo exceptions.
 *  All grafalgo exceptions define an exception object with an
 *  internal string that is initialized by the constructor.
 *  The value of this string can be retrieved using the toString method.
 */
class Exception {
public:
	/** Construct a new object and initialize the exception string.
	 *  @param s is a reference to a string describing the condition that
	 *  triggered the exception.
	 */
	Exception(const string& s) { xStr = "Exception: " + s; }

	/** Construct a string representing the object.
	 *  @param s is a reference to a string in which the result is returned
	 *  @return a reference to s;
	 */
	string& toString(string& s) { s = xStr; return s; }

	friend ostream& operator<<(ostream& out, Exception& e) {
                string s; return out << e.toString(s);
        }

protected:
	string xStr; 
};

/** This exception is thrown by methods that detect illegal argument values.  */
class IllegalArgumentException : public Exception {
public:
	/** Construct a new object and initialize the exception string.
	 *  @param s is a reference to a string describing the condition that
	 *  triggered the exception.
	 */
	IllegalArgumentException(string& s) :
		Exception("IllegalArgumentException: " + s) {}
};

/** This exception is thrown by constructors (and other methods) that
 *  are unable to allocate space for the data structure because there is
 *  no memory left to allocate.
 */
class OutOfSpaceException : public Exception {
public:
	/** Construct a new object and initialize the exception string.
	 *  @param s is a reference to a string describing the condition that
	 *  triggered the exception.
	 */
	OutOfSpaceException(string& s) :
		Exception("OutOfSpaceException: " + s) {}
};

/** This exception is thrown by methods that encounter an error while
 *  attempting to read in a data structure.
 */
class InputException : public Exception {
public:
	/** Construct a new object and initialize the exception string.
	 *  @param s is a reference to a string describing the condition that
	 *  triggered the exception.
	 */
	InputException(string& s) : Exception("InputException: " + s) {}
};

} // ending namespace
#endif
