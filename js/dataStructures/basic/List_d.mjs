/** \file List_d.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../Errors.mjs';
import List from './List.mjs';

/** Data structure representing a doubly-linked list of integers.
 *
 *  Used to represent a list of integers from a defined range 1..n,
 *  where each index may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. This class extends List and adds support for
 *  reverse traversal and general delete operation.
 */
export default class List_d extends List {
	#prev;	// #prev[i] is previous index in list

	/** Constructor for List_d object
	 *  @param n is the range of the list
	 *  @param capacity is the max range to allocate space for
	 */
	constructor(n=10, capacity=n) { super(n); this.#init(capacity); }

	/** Allocate space for and initialize List_d object.
	 *  More precisely, the parts that are not initialize in parent class.
	 *  @param capacity is the max range
	 */
	#init(capacity) {
		assert(this.n <= capacity);
		this.#prev = new Array(capacity+1).fill(-1, 1, this.n+1);
		this.#prev[0] = 0;
	}
	
	/** Allocate space for List_d and initialize it.  */
	reset(n, capacity=n) {
		super.reset(n, capacity);
		this.#prev = new Array(capacity+1).fill(-1, 0, this.n+1);
	}
	
	/** Expand the space available for this List_d.
	 *  Rebuilds old value in new space.
	 *  @param n is the index range of the expanded object
	 *  @param capacity is the size of the expanded object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new List_d(this.n,
							    Math.max(n, Math.floor(1.25 * this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this.#prev.fill(-1, this.n+1, n+1);
		super.expand(n);
	}
	
	/** Assignment operator.
	 *  @param l is another list to be copied to this.
	 *  @return true if the two lists are equal
	 */
	assign(l) {
		super.assign(l);
		let last_i = 0;
		for (let i = this.first(); i != 0; i = this.next(i)) {
			this.#prev[i] = last_i; last_i = i;
		} 
	}

	/** Transfer the contents of another List_d object to this.
	xfer(l) {
		super.xfer(l); this.#prev = l.#prev; l.#prev = null;
	}
	
	/** Return the predecessor of an item in the list.
	 *  @param i is item whose predecessor is to be returned
	 *  @return the item that precedes i or 0, if none
	 */
	prev(i) {
		assert(this.member(i)); return this.#prev[i];
	}
	
	/** Get an item based on its position in the list.
	 *  @param i is position of item to be returned; negative values
	 *  are interpreted relative to the end of the list.
	 *  @return the item at the specfied position
	 */
	at(i) {
		assert((this.valid(i) || this.valid(-1)) && i != 0);
		if (i > 0) return super.at(i);
		let j;
		for (j = this.last(); j != 0 && i != -1; j = this.prev(j)) { i++; }
		return j;
	}
	
	/** Insert an item into the list, relative to another.
	 *  @param i is item to insert
	 *  @param j is item after which i is to be inserted;
	 *  if j == 0, i is inserted at the front of the list
	 */
	insert(i, j) {
		assert(this.valid(i) && !this.member(i) &&
					   (j == 0 || this.member(j)));
		super.insert(i, j);
		// now update this.#prev
		this.#prev[i] = j;
		if (i != this.last()) this.#prev[this.next(i)] = i;
	}
	
	/** Remove a specified item.
	 *  @param i is an item to be removed
	 */
	delete(i) {
		assert(this.valid(i));
		if (!this.member(i)) return;
		if (i == this.first()) {
			this.#prev[this.next(i)] = 0; super.deleteNext(0);
		} else {
			if (i != this.last()) this.#prev[this.next(i)] = this.#prev[i];
			super.deleteNext(this.prev(i));
		}
		this.#prev[i] = -1;
	}

	/** Remove item following a specified item.
	 *  @param i is a list item; the next list item is removed; if i==0 the
	 *  first item is removed
	 */
	deleteNext(i) {
		assert(i == 0 || this.member(i));
		if (i == this.last()) return;
		super.deleteNext(i);
		if (this.next(i) != 0) this.#prev[this.next(i)] = i;
	}
	
	pop() {
		assert(!this.empty());
		let f = this.first(); this.delete(f); return f;
	}

	/** Remove the last item on the list.
	 *  @return true if the list was modified, else false
	 */
	popLast() { this.delete(this.last()); }

	consistent() {
		if (!super.consistent()) return false;
		if (this.#prev[0] != 0) return false;
		for (let i = 1; i <= this.n; i++) {
			if ((this.next(i) == -1 || this.#prev[i] == -1) &&
				this.next(i) != this.#prev[i])
				return false;
			if (this.next(i) > 0 && this.#prev[this.next(i)] != i)
				return false;
			if (this.#prev[i] > 0 && this.next(this.#prev[i]) != i)
				return false;
		}
		if (this.#prev[this.first()] != 0)
			return false;
		return true;
	}
}
