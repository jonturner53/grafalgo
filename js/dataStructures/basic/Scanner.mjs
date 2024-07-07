/** @file Scanner.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** The Scanner class provides methods to parse a string incrementally.
 */
export default class Scanner extends Top {
	cursor;		// position in string (cursor)
	buffer;		// string being scanned

	/** Constructor for Scanner objects.
	 *  @param s is a pointer to the string to be scanned.
	 */
	constructor(s) { super(); this.buffer = s; this.cursor = 0; }

	/** Reset the Scanner object.
	 *  With no arguments, simply sets the cursor to zero.
	 *  @param i specifies an initial position for the cursor;
	 *  if negative, add value to cursor
	 *  @param s specifies a new string to be scanned
	 */
	reset(i=0, s=this.buffer) {
		this.cursor = (i >= 0 ? i : Math.max(0, this.cursor+i));
		this.buffer = s;
	}

	/** Get the position of the cursor in the string.  */
	get cursor() { return this.cursor; }

	/** Get the length of the unscanned portion of the string.  */
	get length() { return this.buffer.length - this.cursor; }

	/** Return true if no non-space characters remaining. */
	empty() { return this.firstNonSpace() == this.buffer.length; }

	/** Return a string representation of the Scanner object.
	 *  This is just the unscanned portion of the string.
	 */
	toString() { return this.buffer.slice(this.cursor); }

	/** Find position of first non-space character.
	 *  @param i0 is an optional starting position (relative to the current
	 *  cursor position) from which to scan
	 *  @return the (absolute) position of the first non-space character
	 */
	firstNonSpace(i0=0) {
		i0 += this.cursor
		const space = " \t\n\r\f\b\v";
		for (let i = i0; i < this.buffer.length; i++) {
			if (!space.includes(this.buffer[i])) return i;
		}
		return this.buffer.length;
	}

	/** Skip whitespace.  */
	skipspace() {
		this.cursor = this.firstNonSpace();
	}

	#zero = '0'.codePointAt(0);
	#nine = '9'.codePointAt(0);
	#a = 'a'.codePointAt(0);
	#z = 'z'.codePointAt(0);
	#A = 'A'.codePointAt(0);
	#Z = 'Z'.codePointAt(0);

	/** Determine if a character is a space character.
	 *  @param c is a character; if omitted, use the next character
	 *  in the buffer
	 *  @return true for a space character
	 */
	isspace(c=this.buffer[this.cursor]) {
		const space = " \t\n\r\f\b\v";
		return space.includes(c);
	}

	isdigit(c=this.buffer[this.cursor]) {
		let i = c.codePointAt(0);
		return this.#zero <= i && i <= this.#nine;
	}

	islower(c=this.buffer[this.cursor]) {
		let i = c.codePointAt(0);
		return this.#a <= i && i <= this.#z;
	}

	isupper(c=this.buffer[this.cursor]) {
		let i = c.codePointAt(0);
		return this.#A <= i && i <= this.#Z;
	}

	/** Verify that the next bit of text matches a string.
	 *  @param s is text to be matched
	 *  @param skip determines whether leading white space should be skipped.
	 */
	verify(s, skip=true) {
		let c0 = skip ? this.firstNonSpace() : this.cursor;
		if (c0 + s.length > this.buffer.length) {
			this.cursor = c0; return false;
		}
		for (let i = 0; i < s.length; i++) {
			if (s[i] != this.buffer[c0+i]) {
				this.cursor = c0; return false;
			}
		}
		this.cursor = c0 + s.length;
		return true;
	}

	/** Verify that the next bit of text matches a string without
	 *  advancing cursor 
	 */
	peek(s, skip) {
		let status = this.verify(s, skip);
		if (status) this.reset(-s.length);
		return status;
	}

	nextchar() {
		return (this.cursor < this.buffer.length ?
							  this.buffer[this.cursor++] : 0);
	}

	/** Get an integer value from the scanned string.
	 *  @return the integer value represented by the next non-space
	 *  chunk of text in the scanned string; if that chunk of text does
	 *  not represent an integer value, NaN is returned and the cursor
	 *  remains at its original position.
	 */
	nextInt(skip=true) {
		let c0 = skip ? this.firstNonSpace() : this.cursor;
		let value = parseInt(this.buffer.slice(c0, c0+20));
		if (Number.isNaN(value)) return NaN;
		if (this.buffer[c0] == '-' || this.buffer[c0] == '+') 
			c0 = this.firstNonSpace(c0+1);
		let i = c0;
		for ( ; i < this.buffer.length; i++) {
			if (!this.isdigit(this.buffer[i])) break;
		}
		this.cursor = i; return value;
	}

	/** Get a numeric value (possibly floating point) from the scanned string.
	 *  @return the numeric value represented by the next non-space
	 *  chunk of text in the scanned string; if that chunk of text does
	 *  not represent a number, NaN is returned and the cursor
	 *  remains at its original position.
	 */
	nextNumber() {
		let s = this.buffer; let n = s.length;
		let i = this.firstNonSpace();
		if (s.startsWith('Infinity',i)) return Infinity;
		let value = parseFloat(s.slice(i, i+30));
		if (Number.isNaN(value)) return NaN;
		if (s[i] == '-' || s[i] == '+') {
			i = this.firstNonSpace((i+1) - this.cursor);
		}
		for ( ; i < n; i++) {
			if (!this.isdigit(s[i])) break;
		}
		if (i == n || s[i] != '.') {
			this.cursor = i; return value;
		}
		i++;	// skip past '.'
		for ( ; i < n; i++) {
			if (!this.isdigit(s[i])) break;
		}
		if (i == n || s[i] != 'e') {
			this.cursor = i; return value;
		}
		i++; 	// skip past 'e'
		if (s[i] == '+' || s[i] == '-') i++;
		for ( ; i < n; i++) {
			if (!this.isdigit(s[i])) break;
		}
		this.cursor = i; return value;
	}

	/** Scan next word.
	 *  A word is defined as an alphanumeric string (including underscores)
	 *  that starts with a non-digit.
	 *  @return the next word encountered, after skipping space characters;
	 *  if the next chunk of non-space text is not a word, return the empty
	 *  string and do not update the scanner state.
	 */
	nextWord(skip=1) {
		let s = this.buffer; let n = s.length;
		let c0 = skip ? this.firstNonSpace() : this.cursor;
		for (let i = c0; i < n; i++) {
			if (this.islower(s[i]) || this.isupper(s[i]) ||
				s[i] == '_' || (i > c0 && this.isdigit(s[i])))
				continue;
			if (i > c0) this.cursor = i;
			return s.slice(c0, i); 
		}
		if (c0 < n) this.cursor = n;
		return s.slice(c0);
	}

	/** Scan for a string enclosed in double quotes. */
	nextString(skip=true) {
		let s = this.buffer; let n = s.length;
		if (!this.verify('"',skip)) return null;
		let c0 = this.cursor;
		for (let i = c0; i < n; i++) {
			if (s[i] == '"') {
				this.cursor = i+1; return s.slice(c0,i);
			}
		}
		this.cursor--; return null;
	}

	/** Read an index value.
	 *  An index typically represents some component of a data structure,
	 *  such as an element of a set or vertex in a graph.
	 *  By convention, data structures with an index range <=26
	 *  have a string representation that substitutes lower-case
	 *  letters for the index values used internally (so 1 becomes 'a',
	 *  2 becomes 'b' and so forth; also 0 becomes '-'). On input, if the
	 *  next non-space character is a lower-case letter or a dash,
	 *  the corresponding integer is returned.
	 *  If the next non-space character is a digit, we read an integer
	 *  and interpret it as an index.
	 *  @param prop(u,sc) is an optional function that is called just before
	 *  nextIndex returns if u!=0; u is the index value just read and sc is
	 *  this scanner; prop should return true on success, false on failure;
	 *  prop is typically used to extract additional information from
	 *  the scanned string and save it in the caller's context
	 *  @return the index value on success, -1 if no index is found in input
	 *  or -2 if an index is found but the prop function returns false
	 */
	nextIndex(prop=0) {
		let u = 0;
		this.verify('*'); // ignore optional asterisk
		let c0 = this.firstNonSpace();
		if (this.buffer.charCodeAt(c0) == '-'.charCodeAt(0)) {
			this.cursor = c0 + 1; u = 0;
		} else if (this.islower(this.buffer[c0])) {
			this.cursor = c0 + 1; 
			u = this.buffer.charCodeAt(c0) - ('a'.charCodeAt(0) - 1);
		} else {
			u = this.nextInt();
			if (Number.isNaN(u)) return -1;
		}
		return (u && prop && !prop(u, this) ? -2 : u);
	}

	/** Variant of nextIndex using lower and upper case letters.
	 *  This version accepts either lower or upper case letters; by default
	 *  27 is returned for 'A', 28 for 'B' and so forth
	 *  @param is an offset to be added to the returned index value when
	 *  an upper case letter is scanned
	 */
	nextIndexExt(prop=0, offset=26) {
		let u = 0;
		this.verify('*'); // ignore optional asterisk
		let c0 = this.firstNonSpace();
		if (this.buffer.charCodeAt(c0) == '-'.charCodeAt(0)) {
			this.cursor = c0 + 1; u = 0;
		} else if (this.islower(this.buffer[c0])) {
			this.cursor = c0 + 1; 
			u = this.buffer.charCodeAt(c0) - ('a'.charCodeAt(0) - 1);
		} else if (this.isupper(this.buffer[c0])) {
			this.cursor = c0 + 1; 
			u = this.buffer.charCodeAt(c0) - ('A'.charCodeAt(0) - 1);
			u += offset;
		} else {
			u = this.nextInt();
			if (Number.isNaN(u)) return -1;
		}
		return (u && prop && !prop(u, this) ? -2 : u);
	}

	/** Get the next list of index values from the scanned string.
	 *  @param ld is the left delimiter for the index list (for example '[')
	 *  @param rd is the right delimiter for the index list (for example '[')
	 *  @param prop is an optional function used to scan for a property;
	 *  it is called immediately after an index is successfully scanned
	 *  and the value of the index is passed to it.
	 *  @return list of index values or null on failure
	 */
	nextIndexList(ld, rd, prop=0) {
		let l = []; let c0 = this.cursor;
		if (!this.verify(ld)) return null;
		for (let i = this.nextIndex(prop); i !=-1; i = this.nextIndex(prop)) {
			if (i == -2) return null;
			l.push(i);
		}
		if (!this.verify(rd)) {
			this.cursor = c0; l.length = 0; return null;
		}
		return l;
	}

	/** Return the next line in the input.
	 *  Read up to the next newline character and return the string up to
	 *  and including the newline character. If no complete line remains
	 *  return the empty string and leave the cursor unchanged.
	 */
	nextLine() {
		let i = this.buffer.indexOf('\n');
		if (i < 0) return '';
		this.cursor = i+1;
		return this.buffer.slice(0, i+1);
	}
}

