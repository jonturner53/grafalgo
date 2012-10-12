/** @file Util.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef UTIL_H
#define UTIL_H

#include "stdinc.h"

/** This class contains miscellaneous utility methods.
 */
class Util {
public:
	// basic io helper functions
	static char readNext(istream&, char);
	static char skip(istream&, char);
	static bool verify(istream&, char, int=0);
	static bool skipBlank(istream&);
	static bool readNum(istream&, int&);
	static bool readWord(istream&, string&);
	static string& num2string(int, string&);

	// functions to facilitate use of single character 
	// node names in small data structures
	static char nam(int);			
	static int num(char);			
	static bool readNode(istream&, int&, int);
	static bool readAlpha(istream&, int&);	
	static string& node2string(int, int, string&);

	// other stuff
	static bool prefix(string&, string&);	
	static void genPerm(int, int*);	
	static int strnlen(char*, int);
	static uint32_t getTime();
};

/** Convert a small integer to a lower-case letter.
 *  @param u is an integer in the range 1..26
 *  @return the corresponding lower-case letter
 *  (1 becomes 'a', 2 becomes 'b', etc)
 */
inline char Util::nam(int u) { return char(u + ('a'-1)); }

/** Convert a lower-case letter to a small integer.
 *  @param c is a lower-case letter
 *  @return the corresponding integer
 *  ('a' becomes 1, 'b' becomes 2, etc)
 */
inline int Util::num(char c) { return int(c - ('a'-1)); }

/** Create a string representation of a numeric value.
 *  @param i is the integer whose value to be converted to a string
 *  @param s is the string in which the value is returned
 *  @return a reference to the string
 */
inline string& Util::num2string(int i, string& s) {
	stringstream ss; ss << i; s = ss.str();
	return s;
}

/** Create a string representation of a data structure node.
 *  @param u is the node
 *  @param n is the number of nodes in the data structure;
 *  if 1 <= n <= 26, a single lower case character is returned
 *  as the string; otherwise, the numeric value of u is added
 *  @param s points to the string to be in which the value is returned
 *  @param return a reference to the modified string
 */
inline string& Util::node2string(int u, int n, string& s) {
        if (1 <= n && n <= 26) s = nam(u);
        else num2string(u,s);
	return s;
}

#endif
