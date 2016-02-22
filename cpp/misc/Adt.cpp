/** @file Adt.cpp 
 *
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Adt.h"

namespace grafalgo {

/** Read an index from the input stream.
 *  An index typically represents some component of a data structure,
 *  such as an element of a set or vertex in a graph.
 *  By convention, data structures whose index sets have at most 26 elements
 *  have a string representation that substitutes lower-case
 *  letters for the index values used internally (so 1 becomes 'a',
 *  2 becomes 'b' and so forth). On input, if the next non-space
 *  character is a lower-case letter, we replace 'a' with 1, etc.
 *  If the next non-space character is a digit, we read an integer
 *  and interpret it as an index.
 *  @param in is an open input stream
 *  @param x is a reference to an index in which the input value is
 *  returned
 *  @return true on success, else false
 */
bool Adt::readIndex(istream& in, index& x) {
	Util::skipSpace(in);
	char c = in.peek();
	if (!in.good()) return false;
	if (islower(c)) {
		x = (c - 'a') + 1; c = in.get(); return in.good();
	} else if (isdigit(c)) {
		in >> x; return in.good();
	}
	return false;
}

/** Convert an index to a string.
 *  @param[in] x is a valid index for the data structure
 *  @return a string that represents the value of x; if n()>26, this is
 *  just the string representing the number x, otherwise, it is a lower-case
 *  letter.
 */
string Adt::index2string(index x) const {
	string s = "";
	if (n() <= 26) {
		if (x == 0) s += '-';
		else s += ((char) ((x-1) + 'a'));
	}
	else s += to_string(x);
	return s;
}

} // ends namespace
