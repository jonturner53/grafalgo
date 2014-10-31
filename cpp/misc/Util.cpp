/** @file Util.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Util.h"

namespace grafalgo {

/** Skip over space characters in input stream.
 *  @param in is an open input stream
 *  @param sameline is an optional argument; if it is true, do not
 *  skip past the end of the line; the default is false
 *  @return true if we find a non-space character before eof or error,
 *  else false
 */
bool Util::skipSpace(istream& in, bool sameline) {
	while (true) {
		char c = in.peek();
		if (!in.good() || (sameline && c == '\n')) return false;
		if (!isspace(c)) { return true; }
		in.get();
	}
}

/** Advance to the first non-blank character, skipping over comments.
 *  Leave the non-blank character in the input stream.
 *  A comment is anything that starts with the sharp sign '#' and
 *  continues to the end of the line. Return false on error or eof.
 */
bool Util::skipBlank(istream& in) {
	char c; bool com;
	com = false;
	while (1) {
		c = in.peek();
		if (!in.good()) return false;
		if (c == '#') com =  true;
		else if (c == '\n') com = false;
		if (!com && !isspace(c)) return true;
		in.get();
	}
}

/** Advance to the start of the next line.
 *  @eturn false on error or eof.
 */
bool Util::nextLine(istream& in) {
	while (true) {
		char c = in.get();
		if (!in.good()) return false;
		if (c == '\n') return true;
	}
}

/** Read next word from input stream.
 *  A word is a non-blank string starting with an alpha and including
 *  alphas, digits, forward slashes and underscores.
 *  @param in is an open input stream
 *  @param s is a string in which result is returned
 *  @param sameline is an optional argument; if it is true, do not
 *  scan past the end of the line; default is false
 *  @return true on success, else false
 */
bool Util::readWord(istream& in, string& s, bool sameline) {
	s = "";
	skipSpace(in,sameline);
	char c = in.peek();
	if (!in.good() || !isalpha(c)) return false;
	while (1) {
		c = in.peek();
		if (!in.good()) return false;
		if (isalpha(c) || isdigit(c) || c == '_' || c == '/') s += c;
		else return true;
		in.get();
	}
}

/** Read a string from the input stream.
 *  A string starts and ends with a double-quote.
 *  @param in is an open input stream
 *  @param s is a string in which result is returned
 *  @param sameline is an optional argument; if it is true, do not
 *  scan past the end of the line; default is false
 *  @return true if a well-formed string is found, else false
 */
bool Util::readString(istream& in, string& s, bool sameline) {
	s = "";
	skipSpace(in,sameline);
	char c = in.peek();
	if (!in.good() || c != '\"') return false;
	in.get();
	while (1) {
		c = in.peek();
		if (!in.good()) return false;
		if (c == '\"') return true;
		if (sameline && c == '\n') return false;
		s += c;
		in.get();
	}
}

/** Read an integer from the input stream.
 *  @param in is an open input stream
 *  @param i is an int in which result is returned
 *  @param sameline is an optional argument; if it is true, do not
 *  scan past the end of the line; default is false
 *  @return true on success, else false
 */
bool Util::readInt(istream& in, int& i, bool sameline) {
	if (skipSpace(in,sameline)) {
		char c = in.peek();
		if (!in.good()) return false;
		if (isdigit(c) || c == '-') {
			in >> i; return in.good();
		}
		in.get();
	}
	return false;
}

/** Read an integer from the input stream.
 *  @param in is an open input stream
 *  @param i is an int64_t in which result is returned
 *  @param sameline is an optional argument; if it is true, do not
 *  scan past the end of the line; default is false
 *  @return true on success, else false
 */
bool Util::readInt(istream& in, int64_t& i, bool sameline) {
	if (skipSpace(in,sameline)) {
		char c = in.peek();
		if (!in.good()) return false;
		if (isdigit(c) || c == '-') {
			in >> i; return in.good();
		}
		in.get();
	}
	return false;
}

/** Read an integer from the input stream.
 *  @param in is an open input stream
 *  @param i is a uint64_t in which result is returned
 *  @param sameline is an optional argument; if it is true, do not
 *  scan past the end of the line; default is false
 *  @return true on success, else false
 */
bool Util::readInt(istream& in, uint64_t& i, bool sameline) {
	if (skipSpace(in,sameline)) {
		char c = in.peek();
		if (!in.good()) return false;
		if (isdigit(c)) {
			in >> i; return in.good();
		}
		in.get();
	}
	return false;
}

/** Verify the next non-space input character.
 *  @param in is an open input stream
 *  @param c is the expected next non-blank character
 *  @param strict is an optional flag; if true, then we don't skip
 *  over space characters; default is false
 *  @return true if c is present in the input, else false;
 *  if c is found, it is read and discarded, otherwise the
 *  character checked is left in the input stream
 */
bool Util::verify(istream& in, char c, bool strict) {
	skipSpace(in);
	char c1 = in.peek();
	if (!in.good() || c1 != c) return false;
	in.get();
	return true;
}

/** Test if one string is a prefix of another.
 *  @param s1 is a reference to a string
 *  @param s2 is a reference to another string
 *  @return true if s1 is a non-empty prefix of s2, else false.
 */
bool Util::prefix(string& s1, string& s2) {
	return s1.length() > 0 && s2.find(s1) == 0;
}

/** Replacement for the missing strnlen function.
 */
int Util::strnlen(char* s, int n) {
	for (int i = 0; i < n; i++) 
		if (*s++ == '\0') return i;
	return n;
}

/** Create random permutation on integers 1..n and return in p.
 */
void Util::genPerm(int n, int p[]) {
	int i, j, k;
	for (i = 1; i <= n; i++) p[i] = i;
	for (i = 1; i <= n; i++) {
		j = randint(i,n);
		k = p[i]; p[i] = p[j]; p[j] = k;
	}
}

/** Return time expressed as a free-running microsecond clock
 *
 *  Uses the gettimeofday system call, but converts result to
 *  simple microsecond clock for greater convenience.
 */
uint32_t Util::getTime() {
	// note use of static variables
	static uint32_t now;
	static struct timeval prevTimeval = { 0, 0 };

	if (prevTimeval.tv_sec == 0 && prevTimeval.tv_usec == 0) {
		// first call to getTime(); initialize and return 0
		if (gettimeofday(&prevTimeval, NULL) < 0)
			fatal("Util::getTime: gettimeofday failure");
		now = 0;
		return 0;
	}
	// normal case
	struct timeval nowTimeval;
	if (gettimeofday(&nowTimeval, NULL) < 0)
		fatal("Util::getTime: gettimeofday failure");
	uint32_t dsec = nowTimeval.tv_sec; dsec -= prevTimeval.tv_sec;
	uint32_t dusec = nowTimeval.tv_usec - prevTimeval.tv_usec;
	if (nowTimeval.tv_usec < prevTimeval.tv_usec) {
		dusec = nowTimeval.tv_usec + (1000000 - prevTimeval.tv_usec);
		dsec--;
	}
	now += 1000000*dsec + dusec;
	prevTimeval = nowTimeval;

	return now;
}

} // ends namespace
