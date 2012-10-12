/** @file Util.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Util.h"

/** Read up to first occurrence of a given character.
 *  @param in is the input stream to read from
 *  @param c  is character to look for
 *  @return c or 0, on end-of-file
 */
char Util::readNext(istream& in, char c) {
	in.ignore(INT_MAX,c);
	return (in.eof() ? 0 : c);
}

/** Skip over all occurrences of a specified input character.
 *  @param in is the input stream to read from
 *  @param c  is character to skip over
 *  @return the first character not equal to c or 0, on end-of-file
 */
char Util::skip(istream& in, char c) {
        char c1;
        while (1) {
                in.get(c1);
                if (in.eof()) return 0;
                if (c1 != c) return c1;
        }
}

/** Read a data structure "node" from the input.
 *  For data structures with at most 26 nodes, the next alphabetic
 *  character in the input stream is interpreted as a node name.
 *  Otherwise, the next integer value is interpreted as a node number.
 *  @param in is the input stream to read from
 *  @param u is a reference to an int (the data structure node)
 *  @param n is the number of nodes in the data structure
 *  @return true on success, false on failure
 */
bool Util::readNode(istream& in, int& u, int n) {
	char c;
        if (n <= 26) {
                if ((c = skip(in,' ')) == 0) return false;
                u = num(c);
        } else {
                if (!(in >> u)) return false;
        }
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

/** Read a lower-case letter.
 *  @param in is an open input stream
 *  @param x is a reference to an integer variable in which result
 *  is returned; if the next non-whitespace character on the current line
 *  is a lower-case character c, make x = (c+1) - 'a'
 *  @return true on if a lower-case character is found, else false;
 *  the input stream advances past white space in any case, but not
 *  past a newline
 */
bool Util::readAlpha(istream& in, int& x) {
	char c1, c2;
	while (1) {
		in.get(c1); if (!in.good()) return false;
		if (c1 == '\n') { in.putback(c1); return false; }
		if (isspace(c1)) continue;
		if (!islower(c1)) return false;
		x = num(c1);
		return true;
	}
}

/** Read next word (string containing letters, numbers, underscores, slashes)
 *  on the current line and return it in s. Return true on success,
 *  false on failure.
 */
bool Util::readWord(istream& in, string& s) {
	char c; bool inword;
	s = ""; inword = false;
	while (1) {
		in.get(c); if (!in.good()) return false;
		if (c == '\n') { in.putback(c); return inword; }
		if (isspace(c)) {
			if (inword) { in.putback(c); return true; }
			else continue;
		}
		if (!isalpha(c) && !isdigit(c) && c != '_' && c != '/') {
			in.putback(c); return inword;
		}
		s += c; inword = true;
	}
}

/** If next thing on current line is a number, read it into i and
 *  return true. Otherwise return false.
 */
bool Util::readNum(istream& in, int& i) {
	char c; long long j;
	while (1) {
		in.get(c); if (!in.good()) return false;
		if (c == '\n') { in.putback(c); return false; }
		if (isspace(c)) continue;
		if (!isdigit(c) && c != '-') return false;
		in.putback(c);
		if (in >> j) { i = j; return true; }
		else return false;
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
		in.get(c); if (!in.good()) return false;
		if (c ==  '#') {com =  true; continue; }
		if (c == '\n') {com = false; continue; }
		if (com || isspace(c)) continue;
		in.putback(c); return true;
	}
}

/** Verify the next non-space input character.
 *  @param in is an open input stream
 *  @param c is the expected next non-blank character
 *  @param n is an optional integer parameter that represents
 *  an upper-bound on the number of space characters to skip past.
 *  @return true if c is encountered after at most n space characters,
 *  else false; if the first non-space character matches c, it is
 *  read and discarded, otherwise it is left in the input stream
 */
bool Util::verify(istream& in, char c, int n) {
	char c1;
	while (true) {
		if (n-- < 0) return false;
		in.get(c1); if (!in.good()) return false;
		if (c1 == c) return true;
		if (!isspace(c1)) break;
	}
	in.putback(c1);
	return false;
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

/** Replacement for the missing strnlen function.
 */
int Util::strnlen(char* s, int n) {
	for (int i = 0; i < n; i++) 
		if (*s++ == '\0') return i;
	return n;
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
