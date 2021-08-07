/** @file Adt.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

/** The Adt class is a base class from which other data structures
 *  in grafalgo are derived.
 *
 *  The data structures in grafalgo are built using integer index values
 *  to refer to specific items (set elements, nodes in search trees,
 *  vertices in graphs). In this context, an index is a positive integer
 *  in a bounded range 0..n, for some value of n (0 is used as null).
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
export default class Adt {
	#n;		// index values in 0..n

	constructor(n=26) { this.#n = n; }

	/** Get the index range for the object.
	 *  @return the largest index value
	 */
	get n() { return this.#n; }

	/** Set the index range for the object.
	 *  For use of subclasses only.
	 *  @param nn becomes the largest index value
	 */
	set _n(n) { this.#n = n; }

	/** Determine if a given index is valid.
	 *  @param[in] i is an integer
	 *  @return true if i lies within the allowed range of index values,
	 *  else false
	 */
	valid(i) { i = Math.floor(i); return 0 <= i && i <= this.#n; }

	/** Create a string representation of the data structure.
	 *  Should show all information relevant to the provided abstraction.
	 *  Subclasses are all expected to implement this method.
 	 */
	toString() { return ""; };

	/** Create an alternate string representation of the data structure,
	 *  showing implementation details.
	 *  @returns a string that represents the internal details of the
	 *  data structure; for subclasses that do not provide their own
	 *  long string representation, the "short" string is used by default.
 	 */
	toLongString() { return this.toString(); };

	/** Compare two Adts for equality.
	 *  @param a2 is an Adt object to be compared to this.
	 *  @return true if this is equal to a2; for subclasses that do not
	 *  provide their own equality check, comparison defaults to equality
	 *  of the string representations.
	 */
	equals(a2) { return this.toString() == a2.toString(); }

	/** Compare two Adts for equality, including internal details.
	 *  @param a2 is an Adt object to be compared to this.
	 *  @return true if this is equal to a2, not just at the abstraction
	 *  level, but also for internal details; for subclasses that do not
	 *  provide their own long equality check, comparison defaults to equality
	 *  of the long string representations.
	longEquals(a2) {
		return (typeof a2) == 'string' ?
					this.toLongString() == a2 :
					this.toLongString() == a2.toLongString();
	}
	 */

	/** Check the data structure for internal consistency.
	 *  @return true if the data structure is internally consistent,
	 *  else return false; if a subclass does not supply a consistent()
	 *  method, false is returned.
	consistent() { return false; }
	 */

	/** Convert an index to a string.
	 *  @param[in] x is a valid index for the data structure
	 *  @return a string that represents the value of x; if this.n>26, this is
	 *  just the string representing the number x, otherwise, it is a lower-case
	 *  letter.
	 */
	index2string(x) {
		const alpha = '-abcdefghijklmnopqrstuvwxyz';
		let s = "";
		if (0 <= this.n && this.n <= 26) {
			s += alpha[x];
		} else {
			s += x;
		}
		return s;
	}

	/* Handy methods for unit testing. */

/*
	assertEqual() {
		if (arguments.length < 2 || arguments.length > 4)
			throw new AssertFailure("too few or to many arguments");
		let tag = "no valid tag";
		if ((typeof arguments[arguments.length-1]) == 'string')
			tag = arguments[arguments.length-1];
		if (arguments.length == 2 &&
			(arguments[0] instanceof Adt ||
			 (typeof arguments[0]) == 'string')) {
			if (!this.equals(arguments[0]))
				throw new AssertFailure(
					`${tag} [${this.toString()} ${arguments[0].toString()}]`);
		} else if (arguments.length == 3 &&
				   ((typeof arguments[0]) == 'number' &&
				    (typeof arguments[1]) == 'number') ||
				   ((typeof arguments[0]) == 'string' &&
				    (typeof arguments[1]) == 'string')) {
            if (arguments[0] != arguments[1])
				throw new AssertFailure(
					`${tag} [${arguments[0]} ${arguments[1]}]`);
		} else if (arguments.length == 4 &&
				   ((typeof arguments[0] instanceof Adt ||
					(typeof arguments[0]) == 'string') &&
				   (typeof arguments[1]) == 'number' &&
				   (typeof arguments[2]) == 'number')) {
			if (!this.equals(arguments[0]) || arguments[1] != arguments[2])
				throw new AssertFailure(
					`${tag} [${this.toString()} ${arguments[0].toString()} ` +
					`${arguments[0]} ${arguments[1]}]`);
		} else {
			//throw new AssertFailure("invalid arguments");
			let s = "";
			for (let i = 0; i < arguments.length; i++) {
				if (i > 0) s += ', ';
				if (arguments[i] == null)
					s += 'null';
				else if (arguments[i])
					s += arguments[i].toString();
			}
			throw "assertEqual: invalid arguments: " + s;
		}
	}

	assertEqualLong() {
		if (arguments.length != 2 && arguments.length != 4)
			throw new AssertFailure("must have 2 or 4 arguments");
		let tag = "no valid tag";
		if ((typeof arguments[arguments.length-1]) == 'string')
			tag = arguments[arguments.length-1];
		if (arguments.length == 2 &&
			(arguments[0] instanceof Adt ||
			 (typeof arguments[0]) == 'string')) {
			if (!this.longEquals(arguments[0]))
				throw new AssertFailure(
					`${tag} [${this.toString()} ${arguments[0].toString()}]`);
		} else if (arguments.length == 4 &&
				   ((typeof arguments[0] instanceof Adt ||
					(typeof arguments[0]) == 'string') &&
				   (typeof arguments[1]) == 'number' &&
				   (typeof arguments[2]) == 'number')) {
			if (!this.longEquals(arguments[0]) || arguments[1] != arguments[2])
				throw new AssertFailure(
					`${tag} [${this.toString()} ${arguments[0].toString()} ` +
					`${arguments[0]} ${arguments[1]}]`);
		} else {
			throw new AssertFailure("invalid arguments");
		}
	}

	assertTrue(success, tag) {
		if (!success) throw new AssertFailure(tag);
	}

	assertConsistent(tag) {
		if (!this.consistent()) throw new AssertFailure(tag);
	}
*/
}

/*
export class AssertFailure extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertFailure";
  }
}
*/
