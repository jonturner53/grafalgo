/** @file List.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Adt from '../Adt.mjs';
import { assert } from '../../common/Errors.mjs';
import Scanner from './Scanner.mjs';

/** Data structure representing a list of unique integers.
 *
 *  Used to represent a list of integers from a defined range 1..n,
 *  where each integer may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. Less general than generic lists but useful when
 *  underlying index set is shared by multiple data structures.
 */
export default class List extends Adt {
	#first;		///< first item in list
	#last;		///< last item in list
	#length;	///< number of items in list
	#next;		///< #next[i] is successor of i in list
	
	/** Constructor for List object.
	 *  @param n is the range for the list
	 *  @param capacity is the max range to allocate space for
	 */
	constructor(n, capacity=n) {
		super(n); this.#init(capacity);
	}

	#init(capacity) {
		assert(capacity >= this.n);
		this.#next = new Array(capacity+1).fill(-1, 1, this.n+1);
		this.#next[0] = this.#first = this.#last = this.#length = 0;
	}

	/** Reset the range and max range of the list; discard value. O(capacity)
	 *  @param n is the range of the index set
	 *  @param capacity the max range for which space is to be allocated
	 */
	reset(n, capacity=n) {
		assert(capacity >= n); this._n = n; this.#init(capacity);
	}

	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new List(this.n, 
						 	  Math.max(n, Math.floor(1.25 * this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this.#next.fill(-1, this.n+1, n+1);
		this._n = n;
	}

	/** Assign new value to list from another. O(size)
	 *  @paran l is a list whose value is to be assigned to this
	 */
	assign(l) {
		if (l == this) return;
		if (l.n > this._capacity) this.reset(l.n);
		else { this.clear(); this._n = l.n; }
		for (let i = l.first(); i != 0; i = l.next(i)) this.enq(i);
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param l is a list whose contents are to be transferred to this
	 */
	xfer(l) {
		if (l == this) return;
		this.#first = l.first(); this.#last = l.last();
		this.#length = l.length;
		this.#next = l.#next; l.#next = null;
	}
	
	/** Remove all elements from list. O(length) */
	clear() { while (!this.empty()) this.pop(); }

	/** Get the number of items in the list. */
	get length() { return this.#length; }

	/** Get the capacity of the list (max number of items it has space for). */
	get _capacity() { return this.#next.length - 1; }
	
	/** Get the next item in a list. O(1)
	 *  @param i is an item on the list
	 *  @return the item that follows i, or 0 if there is no next item
	 */
	next(i) { return this.#next[i]; }
	
	/** Get first item on list. O(1)
	 *  @return the first item on the list or 0 if the list is empty
	 */
	first() { return this.#first; }
	top() { return this.#first; }
	
	/** Get the last item on list. O(1)
	 *  @return the last item on the list or 0 if the list is empty
	 */
	last() { return this.#last; }

	/** Get an item based on its position in the list.
	 *  @param i is position of index to be returned; must be between
	 *  1 and n
	 *  @return index at position i, or 0 if no such index
	 */
	at(i) {
	    assert(valid(i) && i != 0);
	    if (i == 1) return this.first();
		let j;
	    for (let j = this.first(); j != 0 && i != 1; j = this.next(j)) { i--; }
	    return j;
	}
	
	/** Test if list is empty. O(1)
	 *  @return true if list is empty, else false.
	 */
	empty() { return this.length == 0; }
	
	/** Test if an item is in the list. O(1)
	 *  @param i is an item
	 *  @return true if i is in the list, else false
	 */
	contains(i) { return this.valid(i) && (i != 0 && this.#next[i] != -1); } 

	/** Compare two lists for equality. O(length)
	 *
	 *  @param l is the list to be compared to this one
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order);
	 *  they need not have the same storage capacity to be equal
	 */
	equals(l) {
		if (this === l) return true;
		if (typeof l == 'string') {
			let s = l; l = new List(this.n); l.fromString(s);
		} else if (!(l instanceof List)) {
			return false;
		}
		let i = this.first(); let j = l.first();
		while (i == j) {
			if (i == 0) return true;
			i = this.next(i); j = l.next(j);
		}
		return false;
	}
	
	/** Insert an item into the list, relative to another. O(1)
	 *  @param i is item to insert
	 *  @param j is item after which i is to be inserted;
	 *  if zero, i is inserted at the front of the list
	 */
	insert(i, j) {
		assert(this.valid(i) && i != 0 && !this.contains(i) &&
					   (j == 0 || this.contains(j)));
		if (j == 0) {
			if (this.empty()) this.#last = i;
			this.#next[i] = this.#first; this.#first = i; this.#length++;
			return;
		}
		this.#next[i] = this.#next[j]; this.#next[j] = i; this.#length++;
		if (this.#last == j) this.#last = i;
		return;
	}
	
	/** Remove the item following a specified item. O(1)
	 *  @param i is item whose successor is to be deleted;
	 *  if zero, the first item is deleted
	 *  @return the deleted item
	 */
	deleteNext(i) {
		assert(i == 0 || this.contains(i));
		if (i == this.last()) return;
		let j;
		if (i == 0) { j = this.#first;   this.#first = this.#next[j]; }
		else	    { j = this.#next[i]; this.#next[i] = this.#next[j]; }
		if (this.#last == j) this.#last = i;
		this.#next[j] = -1; this.#length--;
	}
	
	/** Push item onto front of a list. O(1)
	 *  @param item to be added.
	 */
	push(i) { this.insert(i, 0); }
	
	/** Remove the first item in the list. O(1)
	 *  @return the item removed, or 0
	 */
	pop() { let f = this.first(); this.deleteNext(0); return f; }
	
	/** Add item to the end of the list. O(1)
	 *  @param item to be added.
	 *  @return true if the list was modified, else false
	 */
	enq(i) { this.insert(i, this.last()); }
	
	/** Remove the first item in the list. O(1)
	 *  @return the item removed, or 0
	 */
	deq() { return this.pop(); }

	/** Create a string representation of a given string.
	 *
	 *  @param s is string used to return value
	 */
	toString(strict=false) {
		let s = "[";
		for (let i = this.first(); i != 0; i = this.next(i)) {
			if (i != this.first()) s += " ";
			s += this.index2string(i, strict);
		}
		return s + "]";
	}
	
	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		let l = new Array(10);
		if (sc.nextIndexList(l, '[', ']') == null) return false;
		let n = 0;
		for (let i of l) n = Math.max(i, n);
		if (n > this.n) this.expand(n);
		for (let i of l) this.enq(i);
		return true;
	}

	/** Check data structure for internal consistency.
	 *  @return true if data structure is consistent, else false.
	 */
	consistent() {
		// check #first, #last and #length
		if (!this.valid(this.#first) || !this.valid(this.#last)) return false;
		if ((this.#first == 0 || this.#last == 0) &&
			(this.#first != this.#last || this.#length != 0))
			return false;
		// verify #next array
		if (this.#next[0] != 0 || this.#next[this.#last] != 0) return false;
		let cnt = 0;
		for (let i = 1; i < this.#next.length; i++) {
			if (this.valid(this.#next[i])) {
				if (this.#next[i] == 0 && i != this.#last) return false;
				cnt++;
			} else if (this.#next[i] != -1) {
				return false;
			}
		}
		if (cnt != this.#length) return false;
		// traverse list and check #last, #length
		for (let i = this.first(); i != 0; i = this.next(i)) {
			if (i == this.last() && cnt != 1) return false;
			if (cnt-- <= 0) return false;
		}
		if (cnt != 0) return false;
		return true;
	}
}
