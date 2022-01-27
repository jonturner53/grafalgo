/** @file Top.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

/** The Top class is the super-class from which other classes
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
export default class Top {
	#n;		// index values in 0..n

	constructor(n=5) { this.#n = n; }

	/** Get the index range for the object.
	 *  @return the largest index value
	 */
	get n() { return this.#n; }

	/** Set the index range for the object.
	 *  For use of subclasses only.
	 *  @param n becomes the largest index value
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

	/** Compare two Top objects for equality.
	 *  @param a2 is a Top object to be compared to this.
	 *  @return true if this is equal to a2; for subclasses that do not
	 *  provide their own equality check, comparison defaults to equality
	 *  of the string representations.
	 */
	equals(a2) { return this.toString() == a2.toString(); }

	/** Convert an index to a string.
	 *  @param x is a valid index for the data structure
	 *	@param label is an optional function used to produce string from value
	 *  @return a string that represents the value of x; if this.n>26, this is
	 *  just the string representing the number x, otherwise, it is a lower-case
	 *  letter.
	 */
	index2string(x, label=null) {
		if (!label)
			label = (x => this.n <= 26 ? '-abcdefghijklmnopqrstuvwxyz'[x] : x);
		return label(x);
	}

	/** Convert a list of index values to a string.
	 *  @param ilist is an array of valid index values
	 *	@param label is an optional function used to produce string from value
	 *  @return a string that represents the list.
	 */
	ilist2string(ilist, label=null) {
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