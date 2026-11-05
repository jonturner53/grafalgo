/** \file ListPair.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import Scanner from './Scanner.mjs';

import { assert, assertEnabled } from '../../common/Assert.mjs';
let ae; // initialized in constructor

/** Data structure that represents a pair of complementary index lists.
 *  The index values have a limited range 1..n and each index is
 *  always in one of the two lists (numbered 1,2).
 *  The only way to modify the data structure is to move an item
 *  from one list to the other, using the swap method.
 *  Initially, all items are in the out list.
 */
export default class ListPair extends Top {
	length_;    // length_[i-1] is length of list i
	first_;     // first_[i-1] is first item in list i
	last_;      // last_[i-1] is last item in list i
	next_;      // next_[i] defines next item after i
	prev_;      // prev_[i] defines item preceding i
               // items in list 1 use positive prev_ values
               // items in list 2 use negative prev_ values

	/** Constructor for list pair.
	 *  @param n specifies the range of integer values
	 */
	constructor(n=10, property=['',0]) {
		ae = assertEnabled();
		super(n,property);
		this.length_ = new Int32Array(2);
		this.first_ = new Int32Array(2);
		this.last_ = new Int32Array(2);
		this.next_ = new Int32Array(this.n+1);
		this.prev_ = new Int32Array(this.n+1);

		this.length_[0] = 0; this.length_[1] = this.n;
		this.first_[0] = this.last_[0] = 0;
		this.first_[1] = 1; this.last_[1] = this.n;
		for (let i = 1; i <= this.n; i++) {
			this.next_[i] = i+1; this.prev_[i] = -(i-1);
		}
		this.next_[this.n] = this.prev_[1] = 0;
	}

	/** Determine if an item belongs in a specified list.
	 *  @param i is valid index
	 *  @param k is 1 or 2
	 *  @param return true if i is a member of list k, else false.
	 */
	in(i,k) {
		ae && assert(1 <= k && k <= 2);
		return this.valid(i) && (i == this.first(k) ||
				(k == 1 && this.prev_[i] > 0) || (k == 2 && this.prev_[i] < 0));
	}
	
	/** Get the number of elements in a list.  */
	length(k) { return this.length_[k-1]; }
	
	/** Get the first item in a list.
	 *  @return the first value on list k or 0 if the list is empty.
	 */
	first(k) { return this.first_[k-1]; }
	
	/** Get the last item in a list.
	 *  @return the last value on list k or 0 if the list is empty.
	 */
	last(k) { return this.last_[k-1]; }
	
	/** Get the next item in a list.
	 *  @param i is the index of a list item.
	 *  @return the next item on the list containing i
	 */
	next(i) { return this.next_[i]; }
	
	/** Get the previous item in a list.
	 *  @param i is the index of a list item.
	 *  @return the previous item on the list containing i
	 */
	prev(i) { return (this.prev_[i] >= 0 ? this.prev_[i] : -this.prev_[i]); }
	
	/** Remove all elements from list 1. */
	clear() {
		super.clear();
		while (this.first(1) != 0) this.swap(this.first(1));
	}
	
	/** Move an item from one list to the other.
	 *  Inserts swapped item at end of the other list
	 *  @param i is the index of item to be swapped
	 *  @param j is a list item in the "other" list; i is inserted
	 *  into the other list, following item j, or at the start if j=0.
	 */
	swap(i, j=-1) {
		ae && assert(i > 0 && i <= this.n, i + ' ' + this.n);
		if (j < 0) j = this.in(i,1) ? this.last(2) : this.last(1);

		ae && assert(this.valid(i) && i && this.valid(j));
		ae && assert((this.in(i,1) && (!j || this.in(j,2))) ||
			    (this.in(i,2) && (!j || this.in(j,1))));

		if (this.in(i,1)) {
			// first remove i from list 1
			if (i == this.last(1)) this.last_[0] = this.prev_[i];
			else this.prev_[this.next_[i]] = this.prev_[i];
			if (i == this.first(1)) this.first_[0] = this.next_[i];
			else this.next_[this.prev_[i]] = this.next_[i];
	
			// now add i to list 2
			if (this.length(2) == 0) {
				this.next_[i] = this.prev_[i] = 0;
				this.first_[1] = this.last_[1] = i;
			} else if (j == 0) {
				this.next_[i] = this.first_[1]; this.prev_[i] = 0;
				this.prev_[this.first_[1]] = -i; this.first_[1] = i;
			} else if (j == this.last(2)) {
				this.next_[j] = i; this.prev_[i] = -j;
				this.next_[i] = 0; this.last_[1] = i;
			} else {
				this.next_[i] = this.next_[j]; this.prev_[i] = -j; 
				this.prev_[this.next_[j]] = -i; this.next_[j] = i;
			}
			this.length_[0]--; this.length_[1]++;
		} else {
			// first remove i from list 2
			if (i == this.last(2)) this.last_[1] = -this.prev_[i];
			else this.prev_[this.next_[i]] = this.prev_[i];
			if (i == this.first(2)) this.first_[1] = this.next_[i];
			else this.next_[-this.prev_[i]] = this.next_[i];
	
			// now add i to list 1
			if (this.length(1) == 0) {
				this.next_[i] = this.prev_[i] = 0;
				this.first_[0] = this.last_[0] = i;
			} else if (j == 0) {
				this.next_[i] = this.first_[0]; this.prev_[i] = 0;
				this.prev_[this.first_[0]] = i; this.first_[0] = i;
			} else if (j == this.last(1)) {
				this.next_[j] = i; this.prev_[i] = j;
				this.next_[i] = 0; this.last_[0] = i;
			} else {
				this.next_[i] = this.next_[j]; this.prev_[i] = j; 
				this.prev_[this.next_[j]] = i; this.next_[j] = i;
			}
			this.length_[0]++; this.length_[1]--;
		}
		return;
	}
	
	/** Compare two list pairs for equality.
	 *  @param that is another list pair or a string
	 *  @return true if the two lists are identical
	 */
	equals(that, ...args) {
		that = super.equals(that, ...(args.length ? args :
                                      [this.n, this.property(0)]));
		if (typeof that == 'boolean') return that;
		if (this.n != that.n) return false;

		let i = this.first(1); let j = that.first(1);
		while (i && i == j) { i = this.next(i); j = that.next(j); }
		if (i != j) return false;
		i = this.first(2); j = that.first(2);
		while (i && i == j) { i = this.next(i); j = that.next(j); }
		if (i != j) return false;

		return that;
	}

	/** Create a string representation of a given string.
	 *  @param label is an optional function used to produce item strings.
	 *  @return the string
	 */
	toString(label=0) {
		if (!label) label = (j => this.x2s(j));
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
	 *  @param s is a string, such as produced by toString();
	 *  it need not be complete, any index in the index range that does
	 *  not appear in the input is assumed to belong to the second set
	 *  @param n is a minimum value for the index range
	 *  @param prop is an optional function used to parse an item property
	 *  @return true on success, else false
	 */
	static fromString(s, n=8, property=['',0], scanProp=0) {
		let sc = new Scanner(s);
		let propVals = []; let hasProps = 0;
		if (!scanProp) {
			scanProp = (u,sc) => {
						if (!sc.verify(':',0)) return true;
						let p = sc.nextNumber();
                        if (Number.isNaN(p)) return false;
						propVals[u] = p; hasProps = 1;
						return true;
					};
		}

		// first read values into two lists
        let l1 = sc.nextIndexList('[', ':', scanProp);
        if (l1 == null) return null;
		sc.reset(-1);
        let l2 = sc.nextIndexList(':', ']', scanProp);
        if (l2 == null) return null;
		n = Math.max(n, ...l1, ...l2);
		if (n != l1.length+l2.length) return null;
		// verify that lists are valid
        let items = new Set();
        for (let i of l1) {
            if (items.has(i)) return null;
            items.add(i);
        }
        for (let i of l2) {
            if (items.has(i)) return null;
            items.add(i);
        }
		
		// initialize this
		if (!property[0] && hasProps) property = ['values',0];
		let lp = new ListPair(n, property);

		let [pname] = property;
		for (let i = 1; i <= lp.n; i++) {
			if (propVals[i] != undefined)
				lp[pname](i,propVals[i]);
		}
        for (let i of l1) lp.swap(i);
        for (let i of l2) { lp.swap(i); lp.swap(i); }
			// double swap produces correct order for list 2
		return lp;
	}
}
