/** @file Scanner.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import Top from '../Top.mjs';

/** The Scanner class provides methods to parse a string incrementally.
 */
export default class Scanner extends Top {
	#i;		// position in string (cursor)
	#s;		// string being scanned

	/** Constructor for Scanner objects.
	 *  @param s is a pointer to the string to be scanned.
	 */
	constructor(s) { super(); this.#s = s; this.#i = 0; }

	/** Reset the Scanner object.
	 *  With no arguments, simply sets the cursor to zero.
	 *  @param i specifies an initial position for the cursor
	 *  @paran s specifies a new string to be scanned
	 */
	reset(i=0, s=this.#s) { this.#i = i; this.#s = s; }

	/** Get the position of the cursor in the string.  */
	get cursor() { return this.#i; }

	/** Get the length of the unscanned portion of the string.  */
	get length() { return this.#s.length - this.#i; }

	/** Return a string representation of the Scanner object.
	 *  This is just the unscanned portion of the string.
	 */
	toString() { return this.#s.slice(this.#i); }

	/** Find position of first non-space character.
	 *  @param i0 is an optional starting position (relative to the current
	 *  cursor position) from which to scan
	 */
	firstNonSpace(i0=0) {
		i0 += this.#i
		const space = " \t\n\r\f\b\v";
		for (let i = i0; i < this.#s.length; i++) {
			if (!space.includes(this.#s[i])) return i;
		}
		return this.#s.length;
	}

	/** Skip whitespace.  */
	skipspace() {
		this.#i = this.firstNonSpace();
	}

	#zero = '0'.codePointAt(0);
	#nine = '9'.codePointAt(0);
	#a = 'a'.codePointAt(0);
	#z = 'z'.codePointAt(0);
	#A = 'A'.codePointAt(0);
	#Z = 'Z'.codePointAt(0);

	isdigit(c) {
		let i = c.codePointAt(0);
		return this.#zero <= i && i <= this.#nine;
	}

	islower(c) {
		let i = c.codePointAt(0);
		return this.#a <= i && i <= this.#z;
	}

	isupper(c) {
		let i = c.codePointAt(0);
		return this.#A <= i && i <= this.#Z;
	}

	/** Verify that the next bit of text matches s.
	 *  @param s is text to be matched
	 *  @param skip determines whether leading white space should be skipped.
	 */
	verify(s, skip=true) {
		let i0 = this.#i;
		if (skip) i0 = this.firstNonSpace();
		if (i0 + s.length > this.#s.length) {
			this.#i = i0; return false;
		}
		for (let i = 0; i < s.length; i++) {
			if (s[i] != this.#s[i0+i]) {
				this.#i = i0; return false;
			}
		}
		this.#i = i0 + s.length;
		return true;
	}

	/** Get an integer value from the scanned string.
	 *  @return the integer value represented by the next non-space
	 *  chunk of text in the scanned string; if that chunk of text does
	 *  not represent an integer value, NaN is returned and the cursor
	 *  remains at its original position.
	 */
	nextInt() {
		let i0 = this.firstNonSpace();
		let value = parseInt(this.#s.slice(i0, i0+20));
		if (isNaN(value)) return NaN;
		if (this.#s[i0] == '-' || this.#s[i0] == '+') 
			i0 = this.firstNonSpace(i0+1);
		let i = i0;
		for ( ; i < this.#s.length; i++) {
			if (!this.isdigit(this.#s[i])) break;
		}
		this.#i = i; return value;
	}

	/** Get a numeric value (possibly floating point) from the scanned string.
	 *  @return the numeric value represented by the next non-space
	 *  chunk of text in the scanned string; if that chunk of text does
	 *  not represent a number, NaN is returned and the cursor
	 *  remains at its original position.
	 */
	nextNumber() {
		let s = this.#s; let n = s.length;
		let i0 = this.firstNonSpace();
		let value = parseFloat(s.slice(i0, i0+30));
		if (isNaN(value)) return NaN;
		if (s[i0] == '-' || s[i0] == '+')
			i0 = this.firstNonSpace(i0+1);
		let i = i0;
		for ( ; i < n; i++) {
			if (!this.isdigit(s[i])) break;
		}
		if (i == n || s[i] != '.') {
			this.#i = i; return value;
		}
		i++;	// skip past '.'
		for ( ; i < n; i++) {
			if (!this.isdigit(s[i])) break;
		}
		if (i == n || s[i] != 'e') {
			this.#i = i; return value;
		}
		i++; 	// skip past 'e'
		if (s[i] == '+' || s[i] == '-') i++;
		for ( ; i < n; i++) {
			if (!this.isdigit(s[i])) break;
		}
		this.#i = i; return value;
	}

	/** Extract next word.
	 *  A word is defined as an alphanumeric string (including underscores)
	 *  that starts with a non-digit.
	 *  @return the next word encountered, after skipping space characters;
	 *  if the next chunk of non-space text is not a word, return the empty
	 *  string and do not update the scanner state.
	 */
	nextWord() {
		let s = this.#s; let n = s.length;
		let i0 = this.firstNonSpace();
		for (let i = i0; i < n; i++) {
			if (this.islower(s[i]) || this.isupper(s[i]) ||
				s[i] == '_' || (i > i0 && this.isdigit(s[i])))
				continue;
			if (i > i0) this.#i = i;
			return s.slice(i0, i); 
		}
		if (i0 < n) this.#i = n;
		return s.slice(i0);
	}

	/** Read an index value.
	 *  An index typically represents some component of a data structure,
	 *  such as an element of a set or vertex in a graph.
	 *  By convention, data structures with an index range <=26
	 *  have a string representation that substitutes lower-case
	 *  letters for the index values used internally (so 1 becomes 'a',
	 *  2 becomes 'b' and so forth). On input, if the next non-space
	 *  character is a lower-case letter, we replace 'a' with 1, etc.
	 *  If the next non-space character is a digit, we read an integer
	 *  and interpret it as an index.
	 *  @return the index value on success, else 0
	 */
	nextIndex() {
		let i0 = this.firstNonSpace();
		if (this.islower(this.#s[i0])) {
			this.#i = i0 + 1; 
			return this.#s.charCodeAt(i0) - ('a'.charCodeAt(0) - 1);
		}
		let value = this.nextInt();
		if (isNaN(value)) return 0;
		return value;
	}

	/** Get the next index list from the scanned string.
	 *  @param l is an array used to return an index list
	 *  @param ld is the left delimiter for the index list (for example '[')
	 *  @param rd is the right delimiter for the index list (for example '[')
	 *  @return l on success, null on failure
	 */
	nextIndexList(l, ld, rd) {
		l.length = 0;
		let i0 = this.#i;
		if (!this.verify(ld)) return null;
		let x = this.nextIndex();
		while (x != 0) {
			l.push(x); x = this.nextIndex();
		}
		if (!this.verify(rd)) {
			this.#i = i0; l.length = 0; return null;
		}
		return l;
	}

	/** Return the next line in the input.
	 *  Read up to the next newline character and return the string up to
	 *  and including the newline character. If no complete line remains
	 *  return the empty string and leave the cursor unchanged.
	 */
	nextLine() {
		let i = this.#s.indexOf('\n');
		if (i < 0) return '';
		this.#i = i+1;
		return this.#s.slice(0, i+1);
	}
}

