/** @file Top.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../common/Assert.mjs';

/** The Top class is the super-class from which other classes
 *  in grafalgo are derived.
 *
 *  The data structures in grafalgo are built using integer index values
 *  to refer to specific items (set elements, list items, vertices in graphs).
 *  In this context, an index is a positive integer in a bounded range 0..n,
 *  for some value of n (0 is used as null).
 *
 *  The use of index values has a couple advantages over pointers.
 *  First, index values can serve as common "handles" for
 *  items in multiple data structures, eliminating the need to have
 *  explicit mappings to relate such items. As one example,
 *  in an algorithm that uses a graph and a separate list of vertices,
 *  both can use the same indexes to represent the vertices.
 *  Index values also make it trivial to have fast membership tests
 *  for index lists and similar data structures.
 */
export default class Top {
	#n;		// index values in 0..n

	constructor(n=5) { this.#n = n; }

	/** Reset the object, discarding value.  */
	reset() {
		this.xfer(new this.constructor(... arguments));
	}

    assign(other, relaxed=false) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
        if (this.n == other.n || relaxed && this.n > other.n) this.clear();
        else this.reset(other.n);
	}

	xfer(other) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:xfer: self-assignment or mismatched types');
		this.#n = other.#n;
	}

	/** Get the index range for the object.
	 *  @return the largest index value
	 */
	get n() { return this.#n; }

	/** Set the index range for the object.
	 *  For use of subclasses only.
	 *  @param n becomes the largest index value
	 */
	set _n(n) { this.#n = n; }

	/** Expand the index range of an object.
	 *  Since index range is often semantically significant,
	 *  cannot over-expand.
	 */
	expand(n) {
		ea && assert(n > this.n, 'Top: expand must increase range');
		let nu = new this.constructor(n);
		nu.assign(this,true); this.xfer(nu);
	}

	clear() {
		throw `Top: sub-class ${this.constructor.name} failed to ` +
			  `define clear method.`;
	}
	toString() {
		throw `Top: sub-class ${this.constructor.name} failed to ` +
			  `define toString method.`;
	}

	/** Determine if a given index is valid.
	 *  @param[in] i is an integer
	 *  @return true if i lies within the allowed range of index values,
	 *  else false
	 */
	valid(i) { i = Math.floor(i); return 0 <= i && i <= this.#n; }

	/** Determine if two objects are equal.
	 *  Uses string comparison for objects that lack a fromString method.
	 *  @param other is an object to be compared to this, or a string
	 *  @returns true or false if equality status can be determined
	 *  without an explicit object comparison; otherwise returns an
	 *  object that can be compared to "this".
	 */
	equals(other) {
		if (this === other) return true;
        if (typeof other == 'string') {
			//if (!('fromString' in this)) 
			//	return this.toString() == other;
            let s = other;
			if (typeof this.fromString !== 'function')
				return s == this.toString();
			other = new this.constructor();
			assert(other.fromString(s), other.constructor.name +
						 ':equals: fromString cannot parse ' + s);
				// note: this assert must always be enabled
			if (other.n > this.n) return false;
			if (other.n < this.n) other.expand(this.n);
        } else if (other.constructor.name != this.constructor.name ||
		    other.n != this.n) {
			return false;
		}
		return other;
	}

	/** Convert an index to a string.
	 *  @param x is a valid index for the data structure
	 *	@param label is an optional function used to produce string from value
	 *  @return a string that represents the value of x; if this.n>26, this is
	 *  just the string representing the number x, otherwise, it is a lower-case
	 *  letter.
	 */
	index2string(x, label=0) {
		if (label) return label(x);
		return (this.n <= 26 ? '-abcdefghijklmnopqrstuvwxyz'[x] : x);
	}
	x2s(x,label) { return this.index2string(x,label); }

	/** Convert a list of index values to a string.
	 *  @param ilist is an array of valid index values
	 *	@param label is an optional function used to produce string from value
	 *  @return a string that represents the list.
	 */
	ilist2string(ilist, label=0) {
		let s = '';
		for (let i of ilist) {
			if (s.length > 0) s += ' ';
			s += this.index2string(i, label);
		}
		return '[' + s + ']';
	}

	/** Convert a list of numeric values to a string.
	 *  @param nlist is an array of valid index values
	 *  @return a string that represents the list.
	 */
	nlist2string(nlist) {
		let s = '';
		for (let i of nlist) {
			if (s.length > 0) s += ' ';
			s += i;
		}
		return '[' + s + ']';
	}
}
