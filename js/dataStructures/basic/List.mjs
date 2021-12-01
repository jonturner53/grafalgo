/** @file List.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { assert } from '../../common/Errors.mjs';
import Scanner from './Scanner.mjs';

/** Data structure representing a list of unique integers.
 *
 *  Used to represent a list of integers from a defined range 1..n,
 *  where each integer may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. Less general than generic lists but useful when
 *  underlying index set is shared by multiple data structures.
 *
 *  Initially, a singly-linked list is used. However, certain operations
 *  may trigger a conversion to a doubly-linked list (prev(), delete(),
 *  popLast(), at(i) where i<0)
 */
export default class List extends Top {
	#first;		///< first item in list
	#last;		///< last item in list
	#length;	///< number of items in list
	#next;		///< #next[i] is successor of i in list
	#prev;		///< #prev[i] is predecessor of i in list
				///< allocated dynamically as required
	#value;		///< allocated dynamically as required
	
	/** Constructor for List object.
	 *  @param n is the range for the list
	 *  @param capacity is the max range to allocate space for
	 */
	constructor(n, capacity=n) {
		super(n);
		if (!capacity) capacity = this.n;
		this.#init(capacity);
	}

	#init(capacity) {
		assert(capacity >= this.n);
		this.#next = new Array(capacity+1).fill(-1, 1, this.n+1);
		this.#next[0] = this.#first = this.#last = this.#length = 0;
		if (this.#prev) {
			this.#prev = new Array(capacity+1).fill(0, 0, this.n+1);
		}
		if (this.#value) {
			this.#value = new Array(capacity+1).fill(null, 0, this.n+1);
		}
	}

	#addPrev() {
		this.#prev = new Array(this.#next.length).fill(0, 1, this.n+1);
		this.#prev[this.first()] = 0;
		for (let i = this.first(); i != 0; i = this.next(i))
			if (this.next(i) != 0) this.#prev[this.next(i)] = i;
	}

	#addValue() {
		this.#value = new Array(this.#next.length).fill(null, 0, this.n+1);
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
		if (this.#prev)  this.#prev.fill(0, this.n+1, n+1);
		if (this.#value) this.#value.fill(null, this.n+1, n+1);
		this._n = n;
	}

	/** Assign new value to list from another. O(size)
	 *  @paran l is a list whose value is to be assigned to this
	 */
	assign(l) {
		if (l == this) return;
		if (l.n > this._capacity) this.reset(l.n);
		else { this.clear(); this._n = l.n; }
		if (l.#prev && !this.#prev) this.#addPrev();
		if (l.#value && !this.#value) this.#addValue();
		for (let i = l.first(); i != 0; i = l.next(i)) {
			if (this.#value) this.enq(i, l.value(i));
			else this.enq(i);
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param l is a list whose contents are to be transferred to this
	 */
	xfer(l) {
		if (l == this) return;
		this._n = l.n;
		this.#first = l.first(); this.#last = l.last();
		this.#length = l.length;
		this.#next = l.#next; l.#next = null;
		this.#prev = l.#prev; l.#next = null;
		this.#value = l.#value; l.#value = null;
	}
	
	/** Remove all elements from list. */
	clear() { while (!this.empty()) this.pop(); }

	/** Get the number of items in the list. */
	get length() { return this.#length; }

	/** Get the capacity of the list (max number of items it has space for). */
	get _capacity() { return this.#next.length - 1; }
	
	/** Get the next item in a list.
	 *  @param i is an item on the list
	 *  @return the item that follows i, or 0 if there is no next item
	 */
	next(i) { return this.#next[i]; }
	
	/** Get the previous item in a list.
	 *  @param i is an item on the list
	 *  @return the item that follows i, or 0 if there is no next item
	 */
	prev(i) {
		if (!this.#prev) this.#addPrev();
		return this.#prev[i];
	}
	
	/** Get first item on list.
	 *  @return the first item on the list or 0 if the list is empty
	 */
	first() { return this.#first; }
	top() { return this.#first; }
	
	/** Get the last item on list.
	 *  @return the last item on the list or 0 if the list is empty
	 */
	last() { return this.#last; }

	/** Get an item based on its position in the list.
	 *  @param i is position of index to be returned; negative
	 *  values are interpreted from end of list (so, at(-1) == last())
	 *  @return item at position i, or 0 if no such item
	 */
	at(i) {
		if (i > 0) {
		    for (let j = this.first(); j != 0; j = this.next(j)) {
				if (--i == 0) return j;
			}
		} else if (i < 0) {
			if (!this.#prev) this.#addPrev();
        	for (let j = this.last(); j != 0; j = this.prev(j)) {
				if (++i == 0) return j;
			}
		}
	    return 0;
	}
	
	/** Test if list is empty.
	 *  @return true if list is empty, else false.
	 */
	empty() { return this.length == 0; }
	
	/** Test if an item is in the list. O(1)
	 *  @param i is an item
	 *  @return true if i is in the list, else false
	 */
	contains(i) { return this.valid(i) && i != 0 && this.#next[i] != -1; } 

	/** Get the value of an item.
	 *  @param i is an integer
	 *  @return the value of i or null if i is not a valid item or no value
	 *  has been assigned to it
	 */
	value(i) {
		return this.#value && this.valid(i) ? this.#value[i] : null;
	}

	/** Set the value of an item.
	 *  @param i is a list item
	 *  @param value is a for i
	 */
	setValue(i, value) {
		assert(this.valid(i) && i != 0);
		if (!this.#value) this.#addValue();
		this.#value[i] = value;
	}

	/** Insert an item into the list, relative to another. O(1)
	 *  @param i is item to insert
	 *  @param j is item after which i is to be inserted;
	 *  @param value is optional value for inserted item
	 *  if zero, i is inserted at the front of the list
	 */
	insert(i, j, value=null) {
		if (i > this.n) this.expand(i);
		assert(this.valid(i) && i != 0 && !this.contains(i) &&
					   (j == 0 || this.contains(j)));
		if (value) this.setValue(i, value);
		if (j == 0) {
			if (this.empty()) this.#last = i;
			this.#next[i] = this.#first; this.#first = i; this.#length++;
			return;
		}
		this.#next[i] = this.#next[j]; this.#next[j] = i; this.#length++;
		if (this.#last == j) this.#last = i;
		if (this.#prev) {
			this.#prev[i] = j;
			if (i != this.last()) this.#prev[this.next(i)] = i;
		}
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
		if (this.#prev && this.next(i) != 0)
			this.#prev[this.next(i)] = i;
		if (this.#value) this.#value[j] = null;
		return j;
	}

	/** Remove a specified item.
	 *  @param i is an item to be removed
	 */
	delete(i) {
		assert(this.valid(i));
		if (!this.contains(i)) return;
		if (i == this.first()) {
			return this.deleteNext(0);
		} else {
			if (!this.#prev) this.#addPrev();
			return this.deleteNext(this.prev(i));
		}
	}
	
	/** Push item onto front of a list. O(1)
	 *  @param item to be added.
	 *  @param value is an optional value associated with i
	 */
	push(i, value) { this.insert(i, 0, value); }
	
	/** Remove the first item in the list. O(1)
	 *  @return the item removed, or 0
	 */
	pop() { return this.deleteNext(0); }

    /** Remove the last item on the list.
     *  @return true if the list was modified, else false
     */
    popLast() { this.delete(this.last()); }
	
	/** Add item to the end of the list. O(1)
	 *  @param item to be added.
	 *  @param value is an optional value associated with i
	 *  @return true if the list was modified, else false
	 */
	enq(i, value) { this.insert(i, this.last(), value); }
	
	/** Remove the first item in the list. O(1)
	 *  @return the item removed, or 0
	 */
	deq() { return this.pop(); }

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
		if (this.length != l.length) return false;
		let j = l.first();
		for (let i = this.first(); i != 0; i = this.next(i)) {
			if (i != j) return false;
			if (this.value(i) != l.value(j)) return false;
			j = l.next(j);
		}
		return j == 0;
	}

	/** Create a string representation of a given string.
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(label=false) {
		let s = "[";
		for (let i = this.first(); i != 0; i = this.next(i)) {
			if (i != this.first()) s += " ";
			s += this.index2string(i, label);
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
		let items = new Set();
		for (let i of l) {
            if (items.has(i)) { this.clear(); return false; }
            items.add(i); this.enq(i);
		}
		return true;
	}
}
