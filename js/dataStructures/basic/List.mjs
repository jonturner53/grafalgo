/** @file List.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import Scanner from './Scanner.mjs';

//import { fassert } from '../../common/Errors.mjs';
let fassert = (()=>1);

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
	#first;		// first item in list
	#last;		// last item in list
	#length;	// number of items in list
	#next;		// #next[i] is successor of i in list
	#prev;		// #prev[i] is predecessor of i in list
				// allocated dynamically as required
	#value;		// allocated dynamically as required
	
	/** Constructor for List object.
	 *  @param n is the range for the list
	 */
	constructor(n=10) {
		super(n);
		this.#next = new Int32Array(this.n+1).fill(-1);
		this.#next[0] = this.#first = this.#last = this.#length = 0;
		this.#prev = this.#value = null;
	}

	/** Convert to a doubly-linked list. */
	addPrev() {
		if (this.hasPrev) return;
		this.#prev = new Int32Array(this.n+1);
		for (let i = this.first(); i; i = this.next(i))
			if (this.next(i)) this.#prev[this.next(i)] = i;
	}

	/** Determine if this object is doubly-linked. */
	get hasPrev() { return this.#prev ? true : false; }

	/** Add a value for each list item */
	addValues() {
		if (this.hasValues) return;
		this.#value = new Array(this.#next.length).fill(null);
	}

	/** Determine if this object includes item values. */
	get hasValues() { return this.#value ? true : false; }

	/** Get the value of an item.
	 *  @param i is an integer
	 *  @param val is an optional value to be assigned to i
	 *  @return the value of i or null if i is not a valid item or no
	 *  value has been assigned to i
	 */
	value(i, val=null) {
		if (val != null) {
			if (!this.hasValues) this.addValues();
			this.#value[i] = val;
		}
		return (this.valid(i) && this.hasValues ? this.#value[i] : null);
	}

	/** Assign new value to list from another. 
	 *  @param other is a list whose value is to be assigned to this
	 *  @param relaxed is a boolean; when false, this.n is adjusted
	 *  to exactly match other.n; when true, this.n is only adjusted
	 *  if it is less than other.n; relaxed assignments are used to
	 *  implement the expand method
	 */
	assign(other, relaxed=false) {
		super.assign(other, relaxed);

		if (other.hasPrev && !this.hasPrev) this.addPrev();
		if (other.hasValues && !this.hasValues) this.addValues();
		if (this.hasValues) {
			for (let i = 0; i <= this.n; i++) this.value(i,other.value(i));
		}
		for (let i = other.first(); i; i = other.next(i)) {
			if (this.hasValues) this.enq(i, other.value(i));
			else this.enq(i);
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param other is a list whose contents are to be transferred to this
	 */
	xfer(other) {
		super.xfer(other);
		this.#first = other.first(); this.#last = other.last();
		this.#length = other.length;
		this.#next = other.#next; other.#next = null;
		this.#prev = other.#prev; other.#prev = null;
		this.#value = other.#value; other.#value = null;
	}
	
	/** Remove all elements from list. */
	clear() { while (!this.empty()) this.pop(); }

	/** Get the number of items in the list. */
	get length() { return this.#length; }

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
		if (!this.#prev) this.addPrev();
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
			if (!this.#prev) this.addPrev();
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
	
	/** Test if an item is in the list. 
	 *  @param i is an item
	 *  @return true if i is in the list, else false
	 */
	contains(i) { return this.valid(i) && i != 0 && this.#next[i] != -1; } 

	/** Insert an item into the list, relative to another. 
	 *  @param i is item to insert
	 *  @param j is item after which i is to be inserted;
	 *  @param value is optional value for inserted item
	 *  if zero, i is inserted at the front of the list
	 */
	insert(i, j, value=null) {
		if (i > this.n) this.expand(i);
		fassert(this.valid(i) && i != 0 && !this.contains(i) &&
					   (j == 0 || this.contains(j)));
		//		`List.enq: ${this.x2s(i)} ${this.x2s(j)} ${this.toString()}`);
		if (value != null) this.value(i, value);
		if (j == 0) {
			if (this.empty()) this.#last = i;
			this.#next[i] = this.#first; this.#first = i; this.#length++;
		} else {
			this.#next[i] = this.#next[j]; this.#next[j] = i; this.#length++;
			if (this.#last == j) this.#last = i;
		}
		if (this.#prev) {
			this.#prev[i] = j;
			if (i != this.last()) this.#prev[this.next(i)] = i;
		}
		return;
	}
	
	/** Remove the item following a specified item. 
	 *  @param i is item whose successor is to be deleted;
	 *  if zero, the first item is deleted
	 *  @return the item that follows the deleted item
	 */
	deleteNext(i) {
		fassert(i == 0 || this.contains(i));
		if (i == this.last()) return 0;
		let j;
		if (i == 0) { j = this.#first;   this.#first = this.#next[j]; }
		else	    { j = this.#next[i]; this.#next[i] = this.#next[j]; }
		if (this.#last == j) this.#last = i;
		this.#next[j] = -1; this.#length--;
		if (this.#prev) {
			if (i == 0)
				this.#prev[this.first()] = 0;
			else if (this.next(i) != 0)
				this.#prev[this.next(i)] = i;
			this.#prev[j] = 0;
		}
		if (this.hasValues) this.value(j,null);
		return (i == 0 ? this.first() : this.next(i));
	}

	/** Remove a specified item.
	 *  @param i is an item to be removed
	 *  @return item that follows i
	 */
	delete(i) {
		fassert(this.valid(i));
		if (!this.contains(i)) return;
		return (i == this.first() ? this.deleteNext(0) :
									this.deleteNext(this.prev(i)));
	}
	
	/** Push item onto front of a list. 
	 *  @param item to be added.
	 *  @param value is an optional value associated with i
	 */
	push(i, value) { this.insert(i, 0, value); }
	
	/** Remove the first item in the list. 
	 *  @return the item removed, or 0
	 */
	pop() { let i = this.first(); this.deleteNext(0); return i; }

    /** Remove the last item on the list.
     *  @return true if the list was modified, else false
     */
    popLast() { this.delete(this.last()); }
	
	/** Add item to the end of the list. 
	 *  @param item to be added.
	 *  @param value is an optional value associated with i
	 *  @return true if the list was modified, else false
	 */
	enq(i, value) { this.insert(i, this.last(), value); }
	
	/** Remove the first item in the list. 
	 *  @return the item removed, or 0
	 */
	deq() { return this.pop(); }

	/** Compare two lists for equality.
	 *  @param other is the list to be compared to this one or a string
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order)
	 */
	equals(other) {
		let l = super.equals(other); 
		if (typeof l == 'boolean') return l;
		let j = l.first();
		for (let i = this.first(); i != 0; i = this.next(i)) {
			if (i != j) return false;
			if (this.value(i) != l.value(j)) return false;
			j = l.next(j);
		}
		return j == 0 ? l : false;
	}

	/** Compare two lists for set equality.
	 *  @param other is the list to be compared to this one
	 *  @return true if they contain the same items, but not
	 *  necessarily in the same order.
	 */
	setEquals(other) {
		let l = super.equals(other); 
		if (typeof l == 'boolean') return l;
		// l is now guaranteed to be an object that can be compared
		for (let i = this.first(); i != 0; i = this.next(i))
			if (!l.contains(i)) return false;
		return true;
	}

	/** Create a string representation of a given string.
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(label=0) {
		if (!label) {
			label = (u => this.x2s(u) +
					 (this.#value ? ':' + this.value(u) : ''));
		}
		let s = '';
		for (let i = this.first(); i != 0; i = this.next(i)) {
			if (i != this.first()) s += ' ';
			s += label(i);
		}
		return '[' + s + ']';
	}
	
	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s,prop=0) {
		let sc = new Scanner(s);
		let l = sc.nextIndexList('[', ']',prop);
		if (l == null) return false;
		let n = 0; let items = new Set();
		for (let i of l) {
			n = Math.max(i, n);
            if (items.has(i)) return false;
            items.add(i);
		}
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let i of l) this.enq(i);
		return true;
	}
}
