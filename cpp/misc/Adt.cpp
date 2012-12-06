/** @file Adt.cpp 
 *
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Adt.h"

namespace grafalgo {

/** Read an item from the input stream.
 *  An item might be an element of a set of vertex in a graph.
 *  By convention, data structures that can hold at most 26 items
 *  have a string representation that substitutes lower-case
 *  letters for the index values used internally (so 1 becomes 'a',
 *  2 becomes 'b' and so forth). On input, if the next non-space
 *  character is a lower-case letter, we replace 'a' with 1, etc.
 *  If the next non-space character is a digit, we read an integer
 *  and interpret it as an index.
 *  @param in is an open inpust stream
 *  @param x is a reference to an index in which the input value is
 *  returned
 *  @return true on success, else false
 */
bool Adt::readItem(istream& in, index& x) {
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

string& Adt::item2string(index x, string& s) const {
	stringstream ss;
	if (n() <= 26) ss << ((char) ((x-1) + 'a'));
	else ss << x;
	s = ss.str(); return s;
}


} // ends namespace
