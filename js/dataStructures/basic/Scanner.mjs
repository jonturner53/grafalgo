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
		this.cursor = (i >= 0 ? Math.min(s.length, i) :
								Math.max(0, this.cursor+i));
		this.buffer = s;
	}

	/** Get the length of the unscanned portion of the string.  */
	get length() { return Math.max(0, this.buffer.length - this.cursor); }

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
	 *  or -1 if there is no non-space character
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
	skipspace() { this.cursor = this.firstNonSpace(); }

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

	isalpha(c=this.buffer[this.cursor]) {
		let i = c.codePointAt(0);
		return c == '_' ||  (this.#a <= i && i <= this.#z) ||
							(this.#A <= i && i <= this.#Z);
	}

	/** Verify that the next bit of text matches a string.
	 *  @param s is text to be matched
	 *  @param skip determines whether leading white space should be skipped.
	 *  @param advance determines whether cursor is advanced when s is matched.
	 *  @return true if s is a prefix of buffer[cursor].
	 */
	verify(s, skip=true, advance=true) {
		if (skip) this.skipspace();
		if (!this.buffer.startsWith(s,this.cursor))
			return false;
		if (advance) this.cursor += s.length;
		return true;
	}

	/** Get next character from buffer and advance cursor. */
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
		if (skip) this.skipspace();
		let chunk = this.buffer.slice(this.cursor, this.cursor+20);
		let value = parseInt(chunk);
		if (Number.isNaN(value)) return NaN;
		let [prefix] = chunk.match(/^[+-]?\d+/);
		this.cursor += prefix.length;
		return value;
	}

	/** Get a numeric value (possibly floating point) from the scanned string.
	 *  @return the numeric value represented by the next non-space
	 *  chunk of text in the scanned string; if that chunk of text does
	 *  not represent a number, NaN is returned and the cursor
	 *  remains at its original position.
	 */
	nextNumber(skip=true) {
		if (skip) this.skipspace();
		let chunk = this.buffer.slice(this.cursor, this.cursor+30);
		let value = parseFloat(chunk);
		if (Number.isNaN(value)) return NaN;
		let [prefix] = chunk.match(/^([+-]?\d*((\.\d*)?([eE][+-]?\d{1,3})?)?)/);
		this.cursor += prefix.length;
		return value;
	}

	/** Scan next word.
	 *  A word is defined as an alphanumeric string (including underscores)
	 *  that starts with a non-digit.
	 *  @return the next word encountered, after skipping space characters;
	 *  if the next chunk of non-space text is not a word, return the empty
	 *  string and do not update the scanner state.
	 */
	nextWord(skip=1) {
		if (skip) this.skipspace();
		for (let i = this.cursor; i < this.buffer.length; i++) {
			if (this.isalpha(this.buffer[i]) ||
				(i > this.cursor && this.isdigit(this.buffer[i])))
				continue;
			let word = this.buffer.slice(this.cursor,i);
			this.cursor = i;
			return word;
		}
		let word = this.buffer.slice(this.cursor);
		this.cursor = this.buffer.length;
		return word;
	}

	/** Scan for a string enclosed in a pair of delimiters.
	 *  @param delim1 is an opening delimiters.
	 *  @param delim2 is a closing delimiters.
	 *  @param strip is a boolean that controls whether or not the
	 *  the delimiters are stripped from the returned string
	 *  @return the string (including the delimiters) if there is one,
	 *  else null; delimiters may have length>1.
	 */
	nextString(skip=true, delim1='"', delim2 = '"', strip=true) {
		if (skip) this.skipspace();
		if (!this.buffer.startsWith(delim1, this.cursor)) return null;
		let p = this.buffer.indexOf(delim2, this.cursor+delim1.length);
		if (p < 0) return null;
		let s='';
		if (strip) {
			s = this.buffer.slice(this.cursor+delim1.length, p);
			this.cursor += delim1.length + s.length + delim2.length;
		} else {
			s = this.buffer.slice(this.cursor, p+delim2.length);
			this.cursor += s.length;
		}
		return s;
	}

	/* Scan for next string, number, array or object.
	 * @param sc is scanner
	 * @return the data item identified by the next portion of the scanned
	 * string; note that this method does not handle nested objects
	 * or arrays
	 */
	nextDatum(sc) {
		if (sc.verify('"',1,0))  {
			let s = sc.nextString(1);
			return s == null ? null : s;
		}
		if (sc.verify('{',1,0)) {
			let s = sc.nextString(1,'{','}',0);
			if (s == null) return null;
			try { let k = JSON.parse(s); return k; } catch { return null; }
		}
		if (sc.verify('[',1,0))  {
			let s = sc.nextString(1,'[',']',0);
			if (s == null) return null;
			try { let k = JSON.parse(s); return k; } catch { return null; }
		}
		let c0 = this.cursor;
		if (sc.verify('true') && !this.isalpha()) return true;
		else this.cursor = c0;
		if (sc.verify('false') && !this.isalpha()) return false;
		else this.cursor = c0;
		let n = sc.nextNumber(); return (n == NaN ? null : n);
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
		this.skipspace();
		this.verify('*'); // ignore optional asterisk
		if (this.buffer[this.cursor] == '-') {
			u = 0; this.cursor++; 
		} else if (this.islower(this.buffer[this.cursor])) {
			u = this.buffer.charCodeAt(this.cursor) - (this.#a - 1);
			this.cursor++;
		} else {
			u = this.nextInt(0);
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
		this.skipspace();
		this.verify('*'); // ignore optional asterisk
		if (this.buffer[this.cursor] == '-') {
			u = 0; this.cursor++; 
		} else if (this.islower(this.buffer[this.cursor])) {
			u = this.buffer.charCodeAt(this.cursor) - (this.#a - 1);
			this.cursor++;
		} else if (this.isupper(this.buffer[this.cursor])) {
			u = this.buffer.charCodeAt(this.cursor) - (this.#A - 1);
			this.cursor++;
		} else {
			u = this.nextInt(0);
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
		this.skipspace();
		let l = []; let c0 = this.cursor;
		if (!this.verify(ld)) return null;
		for (let i = this.nextIndex(prop); i !=- 1; i = this.nextIndex(prop)) {
			if (i == -2) return null;
			l.push(i);
		}
		if (this.verify(rd)) return l;
		this.cursor = c0;
		return null;
	}

	/** Return the next line in the input.
	 *  Read up to the next newline character and return the string up to
	 *  and including the newline character. If no complete line remains
	 *  return the empty string and leave the cursor unchanged.
	 */
	nextLine() {
		let i = this.buffer.indexOf('\n', this.cursor);
		if (i < 0) return '';
		let line = this.buffer.slice(this.cursor, i+1);
		this.cursor = i+1;
		return line;
	}
}
