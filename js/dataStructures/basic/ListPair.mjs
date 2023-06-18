/** \file ListPair.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import Scanner from './Scanner.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Data structure that represents a pair of complementary index lists.
 *  The index values have a limited range 1..n and each index is
 *  always in one of the two lists (numbered 1,2).
 *  The only way to modify the data structure is to move an item
 *  from one list to the other, using the swap method.
 *  Initially, all items are in the out list.
 */
export default class ListPair extends Top {
	#length;    // #length[i-1] is length of list i
	#first;     // #first[i-1] is first item in list i
	#last;      // #last[i-1] is last item in list i
	#next;      // #next[i] defines next item after i
				// items in list 1 use positive #next values
				// items in list 2 use negative #next values
	#prev;      // #prev[i] defines item preceding i
	
	/** Constructor for list pair.
	 *  @param n specifies the range of integer values
	 */
	constructor(n=10) {
		super(n);
		this.#length = new Int32Array(2);
		this.#first = new Int32Array(2);
		this.#last = new Int32Array(2);
		this.#next = new Int32Array(this.n+1);
		this.#prev = new Int32Array(this.n+1);

		this.#length[0] = 0; this.#length[1] = this.n;
		this.#first[0] = this.#last[0] = 0;
		this.#first[1] = 1; this.#last[1] = this.n;
		for (let i = 1; i <= this.n; i++) {
			this.#next[i] = i+1; this.#prev[i] = -(i-1);
		}
		this.#next[this.n] = this.#prev[1] = 0;
	}

	/** Assign one ListPair to another by copying its contents.
	 *  @param l is the ListPair whose contents is to be copied.
	 */
	assign(other, relaxed=false) {
		super.assign(other, relaxed);
		for (let i = other.first(1); i; i = other.next(i)) {
			this.swap(i);
		}
		for (let i = other.first(2); i; i = other.next(i)) {
			this.swap(i); this.swap(i); // to match order in other
		}
		for (let i = other.n+1; i <= this.n; i++) {
			this.swap(i); this.swap(i);
		}
	}

	/** Assign one ListPair to another by transferring its contents.
	 *  @param other is the ListPair to assign.
	 */
	xfer(other) {
		super.xfer(other);
		this.#next = other.#next; this.#prev = other.#prev;
		other.#next = other.#prev = null;
		this.#first[0] = other.#first[0]; this.#last[0] = other.#last[0];
		this.#first[1] = other.#first[1]; this.#last[1] = other.#last[1];
		this.#length[0] = other.#length[0]; this.#length[1] = other.#length[1];
	}
	
	/** Determine if an item belongs in a specified list.
	 *  @param i is valid index
	 *  @param k is 1 or 2
	 *  @param return true if i is a member of list k, else false.
	 */
	in(i,k) {
		ea && assert(1 <= k && k <= 2);
		return this.valid(i) && (i == this.first(k) ||
				(k == 1 && this.#prev[i] > 0) || (k == 2 && this.#prev[i] < 0));
	}
	
	/** Get the number of elements in a list.  */
	length(k) { return this.#length[k-1]; }
	
	/** Get the first item in a list.
	 *  @return the first value on list k or 0 if the list is empty.
	 */
	first(k) { return this.#first[k-1]; }
	
	/** Get the last item in a list.
	 *  @return the last value on list k or 0 if the list is empty.
	 */
	last(k) { return this.#last[k-1]; }
	
	/** Get the next item in a list.
	 *  @param i is the index of a list item.
	 *  @return the next item on the list containing i
	 */
	next(i) { return this.#next[i]; }
	
	/** Get the previous item in a list.
	 *  @param i is the index of a list item.
	 *  @return the previous item on the list containing i
	 */
	prev(i) { return this.#prev[i]; }
	
	/** Remove all elements from list 1. */
	clear() { while (this.first(1) != 0) this.swap(this.first(1)); }
	
	/** Move an item from one list to the other.
	 *  Inserts swapped item at end of the other list
	 *  @param i is the index of item to be swapped
	 *  @param j is a list item in the "other" list; i is inserted
	 *  into the other list, following item j, or at the start if j=0.
	 */
	swap(i, j=-1) {
		if (j < 0) j = this.in(i,1) ? this.last(2) : this.last(1);

		ea && assert(this.valid(i) && i && this.valid(j));
		ea && assert((this.in(i,1) && (!j || this.in(j,2))) ||
			    (this.in(i,2) && (!j || this.in(j,1))));

		if (this.in(i,1)) {
			// first remove i from list 1
			if (i == this.last(1)) this.#last[0] = this.#prev[i];
			else this.#prev[this.#next[i]] = this.#prev[i];
			if (i == this.first(1)) this.#first[0] = this.#next[i];
			else this.#next[this.#prev[i]] = this.#next[i];
	
			// now add i to list 2
			if (this.length(2) == 0) {
				this.#next[i] = this.#prev[i] = 0;
				this.#first[1] = this.#last[1] = i;
			} else if (j == 0) {
				this.#next[i] = this.#first[1]; this.#prev[i] = 0;
				this.#prev[this.#first[1]] = -i; this.#first[1] = i;
			} else if (j == this.last(2)) {
				this.#next[j] = i; this.#prev[i] = -j;
				this.#next[i] = 0; this.#last[1] = i;
			} else {
				this.#next[i] = this.#next[j]; this.#prev[i] = -j; 
				this.#prev[this.#next[j]] = -i; this.#next[j] = i;
			}
			this.#length[0]--; this.#length[1]++;
		} else {
			// first remove i from list 2
			if (i == this.last(2)) this.#last[1] = -this.#prev[i];
			else this.#prev[this.#next[i]] = this.#prev[i];
			if (i == this.first(2)) this.#first[1] = this.#next[i];
			else this.#next[-this.#prev[i]] = this.#next[i];
	
			// now add i to list 1
			if (this.length(1) == 0) {
				this.#next[i] = this.#prev[i] = 0;
				this.#first[0] = this.#last[0] = i;
			} else if (j == 0) {
				this.#next[i] = this.#first[0]; this.#prev[i] = 0;
				this.#prev[this.#first[0]] = i; this.#first[0] = i;
			} else if (j == this.last(1)) {
				this.#next[j] = i; this.#prev[i] = j;
				this.#next[i] = 0; this.#last[0] = i;
			} else {
				this.#next[i] = this.#next[j]; this.#prev[i] = j; 
				this.#prev[this.#next[j]] = i; this.#next[j] = i;
			}
			this.#length[0]++; this.#length[1]--;
		}
		return;
	}
	
	/** Compare two list pairs for equality.
	 *  @param other is another list pair or a string
	 *  @return true if the two lists are identical
	 */
	equals(other) {
		let lp = super.equals(other);
		if (typeof lp == 'boolean') return lp;
		let i = this.first(1); let j = lp.first(1);
		while (i && i == j) { i = this.next(i); j = lp.next(j); }
		if (i != j) return false;
		i = this.first(2); j = lp.first(2);
		while (i && i == j) { i = this.next(i); j = lp.next(j); }
		if (i != j) return false;
		return lp;
	}
	
	/** Create a string representation of a given string.
	 *  @param label is an optional function used to produce item strings.
	 *  @return the string
	 */
	toString(label=0) {
		if (!label) label = (u => this.x2s(u));
		let s = '';
		for (let i = this.first(1); i; i = this.next(i)) {
			s += label(i);
			if (i != this.last(1)) s += ' ';
		}
		s += ' : ';
		for (let i = this.first(2); i; i = this.next(i)) {
			s += label(i);
			if (i != this.last(2)) s += ' ';
		}
		return '[' + s + ']';
	}

	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);

		// first read values into two lists
        let l1 = sc.nextIndexList('[', ':');
        if (l1 == null) return false;
		sc.reset(-1);
        let l2 = sc.nextIndexList(':', ']');
        if (l2 == null) return false;
		let n = Math.max(Math.max(...l1), Math.max(...l2));

		// verify that lists are valid
		if (l1.length + l2.length != n) return false;
        let items = new Set();
        for (let i of l1) {
            if (items.has(i)) return false;
            items.add(i);
        }
        for (let i of l2) {
            if (items.has(i)) return false;
            items.add(i);
        }
		
		// initialize this
		if (n != this.n) this.reset(n);
		else this.clear();
        for (let i of l1) this.swap(i);
        for (let i of l2) { this.swap(i); this.swap(i); }
			// double swap produces correct order for list 2
		return true;
	}
}
