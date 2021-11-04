/** \file ListPair.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Adt from '../Adt.mjs';
import { assert } from '../../common/Errors.mjs';
import Scanner from './Scanner.mjs';

/** Data structure that represents a pair of complementary index lists.
 *  The index values have a limited range 1..n and each index is
 *  always in one of the two lists.  The lists are referred to as
 *  "in" and "out" and can be accessed using the provided methods.
 *  The only way to modify the data structure is to move an item
 *  from one list to the other, using the swap method.
 *  Initially, all items are in the out list.
 */
export default class ListPair extends Adt {
	#nIn;		///< number of items in in-list
	#nOut;		///< number of items in out-list

	#firstIn;	///< first item in the in-list
	#lastIn;	///< last item in the in-list
	#firstOut;	///< first item in the out-list
	#lastOut	///< last item in the out-list
	#next;		///< #next[i] defines next item after i
				///< in items use positive #next values
				///< out items use negative #next values
	#prev;		///< #prev[i] defines item preceding i
				///< in items use positive #prev values
				///< out items use negative #prev values
	
	/** Constructor for list pair.
	 *  @param n specifies the range of integer values
	 *  @param capacity specifies the maximum range to provide space for
	 */
	constructor(n, capacity=n) { super(n); this.#init(capacity); }

	/** Allocate space and initialize.
	 *  @param capacity is the maximum range
	 */
	#init(capacity) {
		assert(this.n <= capacity);
		this.#next = new Array(capacity+1);
		this.#prev = new Array(capacity+1);
		this.#firstIn = this.#lastIn = 0;
		this.#firstOut = 1; this.#lastOut = this.n;
		for (let i = 1; i <= this.n; i++) {
			this.#next[i] = -(i+1); this.#prev[i] = -(i-1);
		}
		this.#next[this.n] = this.#prev[1] = 0;
		this.#next[0] = this.#prev[0] = 0;
		this.#nIn = 0; this.#nOut = this.n;
	}
	
	/** Reset the list to support a larger range and max range.
	 *  Amount of space allocated is determined by value of this.n.
	 *  @param n specifies the range of integer values
	 *  @param capacity specifies the maximum range to provide space for
	 */
	reset(n, capacity=n) {
		assert(n <= capacity); this._n = n; this.#init(capacity);
	}
	
	/** Expand the space available for this ListPair.
	 *  Rebuilds old value in new space.
	 *  @param n is the range of the expanded object.
	 */
	expand(n) {
		assert(n > 0);
		if (n <= this.n) return;
		if (n > this.capacity) {
			let nu = new ListPair(this.n,
								Math.max(n, Math.floor(1.25 * this.capacity)));
			nu.assign(this); this.xfer(nu);
		}
		for (let i = this.n+1; i <= n; i++) {
			this.#next[i] = -(i+1); this.#prev[i] = -(i-1);
		}
		if (this.#firstOut == 0) {
			this.#firstOut = this.n+1; this.#prev[this.#firstOut] = 0;
		} else {
			this.#next[this.#lastOut] = -(this.n+1);
			this.#prev[this.n+1] = -this.#lastOut;
		}
		this.#lastOut = n; this.#next[this.#lastOut] = 0;
		this.#nOut = n - this.#nIn;
		this._n = n;
	}
	
	/** Assign one ListPair to another by copying its contents.
	 *  @param l is the ListPair whose contents is to be copied.
	 */
	assign(l) {
		if (l == this) return;
		if (l.n > this.capacity) reset(l.n);
		else { this.clear(); this._n = l.n; }
		for (let i = l.firstIn(); i != 0; i = l.nextIn(i)) {
			if (this.isOut(i)) this.swap(i);
		}
		for (let i = l.firstOut(); i != 0; i = l.nextOut(i)) {
			this.swap(i); this.swap(i); // to match order in l
		}
	}

	/** Assign one ListPair to another by transferring its contents.
	 *  @param l is the ListPair to assign.
	 */
	xfer(l) {
		if (l == this) return;
		this.#next = l.#next; this.#prev = l.#prev;
		l.#next = l.#prev = null;
		this.#firstIn = l.#firstIn; this.#lastIn = l.#lastIn;
		this.#firstOut = l.#firstOut; this.#lastOut = l.#lastOut;
		this.#nIn = l.#nIn; this.#nOut = l.#nOut;
	}

	get capacity() { return this.#next.length - 1; }
	
	/** Determine if an item belongs to the "in-list".
	 *  @param i is a valid list item
	 *  @param return true if i is a member of the "in-list", else false.
	 */
	isIn(i) {
		assert(this.valid(i));
		return this.#next[i] > 0 || i == this.#lastIn;
	}
	
	/** Determine if an int belongs to the "out-list".
	 *  @param i is a valid list item
	 *  @param return true if i is a member of the "out-list", else false.
	 */
	isOut(i) {
		assert(this.valid(i));
		return this.#next[i] < 0 || i == this.#lastOut;
	}
	
	/** Get the number of elements in the "in-list".  */
	nIn() { return this.#nIn; }
	
	/** Get the number of elements in the "in-list".  */
	nOut() { return this.#nOut; }
	
	/** Get the first item in the in-list.
	 *  @return the first value on the in-list or 0 if the list is empty.
	 */
	firstIn() { return this.#firstIn; }
	
	/** Get the first item in the out-list.
	 *  @return the first value on the out-list or 0 if the list is empty.
	 */
	firstOut() { return this.#firstOut; }
	
	/** Get the last item in the in-list.
	 *  @return the last value on the in-list or 0 if the list is empty.
	 */
	lastIn() { return this.#lastIn; }
	
	/** Get the first item in the out-list.
	 *  @return the last value on the out-list or 0 if the list is empty.
	 */
	lastOut() { return this.#lastOut; }
	
	/** Get the next item in the inlist.
	 *  @param i is the "current" value
	 *  @return the next int on the in-list or 0 if no more values
	 */
	nextIn(i) {
		assert(this.isIn(i)); return this.#next[i];
	}
	
	/** Get the next value in the outlist.
	 *  @param i is the "current" value
	 *  @return the next value on the out-list or 0 if no more values
	 */
	nextOut(i) {
		assert(this.isOut(i)); return -this.#next[i];
	}
	
	/** Get the previous value in the inlist.
	 *  @param i is the "current" value
	 *  @return the previous value on the in-list or 0 if no more values
	 */
	prevIn(i) {
		assert(this.isIn(i)); return this.#prev[i];
	}
	
	/** Get the previous value in the outlist.
	 *  @param i is the "current" value
	 *  @return the previous value on the out-list or 0 if no more values
	 */
	prevOut(i) {
		assert(this.isOut(i)); return -this.#prev[i];
	}
	
	/** Compare two list pairs for equality.
	 *  @param lp is another list pair
	 *  @return true if the in-lists are identical; the out-lists may differ
	 */
	equals(lp) {
		if (lp === this) return true;
		if (typeof lp == 'string') {
			let s = lp; lp = new ListPair(this.n); lp.fromString(s);
		}
		if (!(lp instanceof ListPair)) return false;
		if (this.nIn != lp.nIn || this.nOut != lp.nOut) return false;
		let i = this.firstIn(); let j = lp.firstIn();
		while (i != 0) {
			if (i != j) return false;
			i = this.nextIn(i); j = lp.nextIn(j);
		}
		i = this.firstOut(); j = lp.firstOut();
		while (i != 0) {
			if (i != j) return false;
			i = this.nextOut(i); j = lp.nextOut(j);
		}
		return true;
	}
	
	/** Remove all elements from inSet. */
	clear() { while (this.firstIn() != 0) this.swap(this.firstIn()); }
	
	/** Move an item from one list to the other.
	 *  Inserts swapped item at end of the other list
	 *  @param i is the index of item to be swapped
	 *  @param j is a list item in the "other" list; i is inserted
	 *  into the other list, following item j, or at the start if j=0.
	 */
	swap(i, j=-1) {
		if (j < 0) j = this.isIn(i) ? this.lastOut() : this.lastIn();

		assert(this.valid(i) && i != 0 && this.valid(j));
		assert((this.isIn(i)  && (j == 0 || this.isOut(j))) ||
			   (this.isOut(i) && (j == 0 || this.isIn(j))));

		if (this.isIn(i)) {
			// first remove i from in-list
			if (i == this.lastIn()) this.#lastIn = this.#prev[i];
			else this.#prev[this.#next[i]] = this.#prev[i];
			if (i == this.firstIn()) this.#firstIn = this.#next[i];
			else this.#next[this.#prev[i]] = this.#next[i];
	
			// now add i to out-list
			if (this.#nOut == 0) {
				this.#next[i] = this.#prev[i] = 0;
				this.#firstOut = this.#lastOut = i;
			} else if (j == 0) {
				this.#next[i] = -this.#firstOut; this.#prev[i] = 0;
				this.#prev[this.#firstOut] = -i; this.#firstOut = i;
			} else if (j == this.#lastOut) {
				this.#next[j] = -i; this.#prev[i] = -j;
				this.#next[i] = 0; this.#lastOut = i;
			} else {
				this.#next[i] = this.#next[j]; this.#prev[i] = -j; 
				this.#prev[-this.#next[j]] = -i; this.#next[j] = -i;
			}
			this.#nIn--; this.#nOut++;
		} else {
			// first remove i from out-list
			if (i == this.lastOut()) this.#lastOut = -this.#prev[i];
			else this.#prev[-this.#next[i]] = this.#prev[i];
			if (i == this.firstOut()) this.#firstOut = -this.#next[i];
			else this.#next[-this.#prev[i]] = this.#next[i];
	
			// now add i to in-list
			if (this.#nIn == 0) {
				this.#next[i] = this.#prev[i] = 0;
				this.#firstIn = this.#lastIn = i;
			} else if (j == 0) {
				this.#next[i] = this.#firstIn; this.#prev[i] = 0;
				this.#prev[this.#firstIn] = i; this.#firstIn = i;
			} else if (j == this.#lastIn) {
				this.#next[j] = i; this.#prev[i] = j;
				this.#next[i] = 0; this.#lastIn = i;
			} else {
				this.#next[i] = this.#next[j]; this.#prev[i] = j; 
				this.#prev[this.#next[j]] = i; this.#next[j] = i;
			}
			this.#nIn++; this.#nOut--;
		}
		return;
	}
	
	/** Create a string representation of a given string.
	 *  @param details enables inclusion of out-string when true,
	 *  otherwise, only the in-string is shown
	 *  @param strict forces all items to be displayed as numbers,
	 *  not as letters
	 *  @param pretty uses newline to separate in-list from out-list
	 *  @return the string
	 */
	toString(details=0, pretty=0, strict=0) {
		let s = '';
		for (let i = this.firstIn(); i != 0; i = this.nextIn(i)) {
			s += this.index2string(i, strict);
			if (i != this.lastIn()) s += ' ';
		}
		if (!details) return'[' + s + ']';
		s += (pretty ? '\n:' : ' : ');
		for (let i = this.firstOut(); i != 0; i = this.nextOut(i)) {
			s += this.index2string(i, strict);
			if (i != this.lastOut()) s += ' ';
		}
		return (pretty ? '[' + s + ']\n' : '[' + s + ']');
	}

	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		if (!sc.verify('[')) return false;
		for (let i = sc.nextIndex(); i > 0; i = sc.nextIndex()) {
			if (i > this.n) this.expand(i);
			if (this.isIn(i)) { this.clear(); return false; }
			this.swap(i);
		}
		if (!sc.verify(':')) { this.clear(); return false; }
		// for out-list, need to ensure all values present in input string,
		// with no repeats; also we must re-order out-list to match input
		let outSet = {};
		for (let i = sc.nextIndex(); i > 0; i = sc.nextIndex()) {
			if (i > this.n) this.expand(i);
			if (this.isIn(i) || i in outSet) { this.clear(); return false; }
			outSet[i] = true;
			this.swap(i); this.swap(i);
				// double swap moves i to end of out-list
		}
		if (Object.keys(outSet).length != this.nOut() || !sc.verify(']')) {
			this.clear(); return false;
		}
		return true;
	}
}
