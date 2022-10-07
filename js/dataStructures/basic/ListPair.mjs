/** \file ListPair.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { fassert } from '../../common/Errors.mjs';
import Scanner from './Scanner.mjs';

/** Data structure that represents a pair of complementary index lists.
 *  The index values have a limited range 1..n and each index is
 *  always in one of the two lists.  The lists are referred to as
 *  "in" and "out" and can be accessed using the provided methods.
 *  The only way to modify the data structure is to move an item
 *  from one list to the other, using the swap method.
 *  Initially, all items are in the out list.
 */
export default class ListPair extends Top {
	#n1;		// number of items in in-list
	#n2;		// number of items in out-list

	#first1;	// first item in the in-list
	#last1;	    // last item in the in-list
	#first2;	// first item in the out-list
	#last2	    //last item in the out-list
	#next;		// #next[i] defines next item after i
				// in items use positive #next values
				// out items use negative #next values
	#prev;		// #prev[i] defines item preceding i
				// in items use positive #prev values
				// out items use negative #prev values
	
	/** Constructor for list pair.
	 *  @param n specifies the range of integer values
	 *  @param capacity specifies the maximum range to provide space for
	 */
	constructor(n=10, capacity=n) {
		super(n);
		this.#next = new Int32Array(capacity+1);
		this.#prev = new Int32Array(capacity+1);
		this.#first1 = this.#last1 = 0;
		this.#first2 = 1; this.#last2 = this.n;
		for (let i = 1; i <= capacity; i++) {
			this.#next[i] = i+1; this.#prev[i] = -(i-1);
		}
		this.#next[this.n] = this.#prev[1] = 0;
		this.#n1 = 0; this.#n2 = this.n;
	}

	/** Expand index range and possibly the space.
	 *  Default version does not suffice here;
	 *  must also add new list items to second list.
	 */
	expand(n) {
		if (n <= this.n) return;
		let n0 = this.n;
		super.expand(n);
		this.#next[this.#last2] = n0+1; this.#prev[n0+1] = -this.#last2;
		this.#next[n] = 0; this.#last2 = n;
		this.#n2 += n-n0;
	}
	
	/** Assign one ListPair to another by copying its contents.
	 *  @param l is the ListPair whose contents is to be copied.
	 */
	assign(l) {
		if (l == this) return;
		if (l.n > this.capacity) reset(l.n);
		else { this.clear(); this._n = l.n; }
		for (let i = l.first1(); i != 0; i = l.next1(i)) {
			if (this.in2(i)) this.swap(i);
		}
		for (let i = l.first2(); i != 0; i = l.next2(i)) {
			this.swap(i); this.swap(i); // to match order in l
		}
	}

	/** Assign one ListPair to another by transferring its contents.
	 *  @param l is the ListPair to assign.
	 */
	xfer(l) {
		if (l == this) return;
		this._n = l.n;
		this.#next = l.#next; this.#prev = l.#prev;
		l.#next = l.#prev = null;
		this.#first1 = l.#first1; this.#last1 = l.#last1;
		this.#first2 = l.#first2; this.#last2 = l.#last2;
		this.#n1 = l.#n1; this.#n2 = l.#n2;
	}

	get capacity() { return this.#next.length - 1; }
	
	/** Determine if an item belongs to the "in-list".
	 *  @param i is a valid list item
	 *  @param return true if i is a member of the "in-list", else false.
	 */
	in1(i) {
		fassert(this.valid(i), `ListPair.in1: invalid list item ${i} (n=${this.n})`);
		return this.#prev[i] > 0 || i == this.#first1;
	}
	
	/** Determine if an int belongs to the "out-list".
	 *  @param i is a valid list item
	 *  @param return true if i is a member of the "out-list", else false.
	 */
	in2(i) {
		fassert(this.valid(i));
		return this.#prev[i] < 0 || i == this.#first2;
	}
	
	/** Get the number of elements in list 1.  */
	n1() { return this.#n1; }
	
	/** Get the number of elements in list 2  */
	n2() { return this.#n2; }
	
	/** Get the first item in list 1.
	 *  @return the first value on the in-list or 0 if the list is empty.
	 */
	first1() { return this.#first1; }
	
	/** Get the first item in list 2.
	 *  @return the first value on the out-list or 0 if the list is empty.
	 */
	first2() { return this.#first2; }
	
	/** Get the last item in list 1.
	 *  @return the last value on the in-list or 0 if the list is empty.
	 */
	last1() { return this.#last1; }
	
	/** Get the first item in list 2.
	 *  @return the last value on the out-list or 0 if the list is empty.
	 */
	last2() { return this.#last2; }
	
	/** Get the next item in list 1.
	 *  @param i is the "current" value
	 *  @return the next int on the in-list or 0 if no more values
	 */
	next1(i) {
		fassert(this.in1(i)); return this.#next[i];
	}
	
	/** Get the next value in the list2.
	 *  @param i is the "current" value
	 *  @return the next value on the out-list or 0 if no more values
	 */
	next2(i) {
		fassert(this.in2(i)); return this.#next[i];
	}
	
	/** Get the previous value in list 1.
	 *  @param i is the "current" value
	 *  @return the previous value on the in-list or 0 if no more values
	 */
	prev1(i) {
		fassert(this.in1(i)); return this.#prev[i];
	}
	
	/** Get the previous value in list 2.
	 *  @param i is the "current" value
	 *  @return the previous value on the out-list or 0 if no more values
	 */
	prev2(i) {
		fassert(this.in2(i)); return -this.#prev[i];
	}
	
	/** Compare two list pairs for equality.
	 *  @param other is another list pair or a string
	 *  @return true if the two lists are identical
	 */
	equals(other) {
		let lp = super.equals(other);
		if (typeof lp == 'boolean') return lp;
		if (this.n1 != lp.n1 || this.n2 != lp.n2) return false;
		let i = this.first1(); let j = lp.first1();
		while (i != 0) {
			if (i != j) return false;
			i = this.next1(i); j = lp.next1(j);
		}
		i = this.first2(); j = lp.first2();
		while (i != 0) {
			if (i != j) return false;
			i = this.next2(i); j = lp.next2(j);
		}
		return lp;
	}
	
	/** Remove all elements from inSet. */
	clear() { while (this.first1() != 0) this.swap(this.first1()); }
	
	/** Move an item from one list to the other.
	 *  Inserts swapped item at end of the other list
	 *  @param i is the index of item to be swapped
	 *  @param j is a list item in the "other" list; i is inserted
	 *  into the other list, following item j, or at the start if j=0.
	 */
	swap(i, j=-1) {
		if (j < 0) j = this.in1(i) ? this.last2() : this.last1();

		fassert(this.valid(i) && i != 0 && this.valid(j));
		fassert((this.in1(i)  && (j == 0 || this.in2(j))) ||
			   (this.in2(i) && (j == 0 || this.in1(j))));

		if (this.in1(i)) {
			// first remove i from in-list
			if (i == this.last1()) this.#last1 = this.#prev[i];
			else this.#prev[this.#next[i]] = this.#prev[i];
			if (i == this.first1()) this.#first1 = this.#next[i];
			else this.#next[this.#prev[i]] = this.#next[i];
	
			// now add i to out-list
			if (this.#n2 == 0) {
				this.#next[i] = this.#prev[i] = 0;
				this.#first2 = this.#last2 = i;
			} else if (j == 0) {
				this.#next[i] = this.#first2; this.#prev[i] = 0;
				this.#prev[this.#first2] = -i; this.#first2 = i;
			} else if (j == this.#last2) {
				this.#next[j] = i; this.#prev[i] = -j;
				this.#next[i] = 0; this.#last2 = i;
			} else {
				this.#next[i] = this.#next[j]; this.#prev[i] = -j; 
				this.#prev[this.#next[j]] = -i; this.#next[j] = i;
			}
			this.#n1--; this.#n2++;
		} else {
			// first remove i from out-list
			if (i == this.last2()) this.#last2 = -this.#prev[i];
			else this.#prev[this.#next[i]] = this.#prev[i];
			if (i == this.first2()) this.#first2 = this.#next[i];
			else this.#next[-this.#prev[i]] = this.#next[i];
	
			// now add i to in-list
			if (this.#n1 == 0) {
				this.#next[i] = this.#prev[i] = 0;
				this.#first1 = this.#last1 = i;
			} else if (j == 0) {
				this.#next[i] = this.#first1; this.#prev[i] = 0;
				this.#prev[this.#first1] = i; this.#first1 = i;
			} else if (j == this.#last1) {
				this.#next[j] = i; this.#prev[i] = j;
				this.#next[i] = 0; this.#last1 = i;
			} else {
				this.#next[i] = this.#next[j]; this.#prev[i] = j; 
				this.#prev[this.#next[j]] = i; this.#next[j] = i;
			}
			this.#n1++; this.#n2--;
		}
		return;
	}
	
	/** Create a string representation of a given string.
	 *  @param label is an optional function used to produce item strings.
	 *  @return the string
	 */
	toString(label=0) {
		if (!label) label = (u => this.x2s(u));
		let s = '';
		for (let i = this.first1(); i != 0; i = this.next1(i)) {
			s += label(i);
			if (i != this.last1()) s += ' ';
		}
		s += ' : ';
		for (let i = this.first2(); i != 0; i = this.next2(i)) {
			s += label(i);
			if (i != this.last2()) s += ' ';
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
        let li = sc.nextIndexList('[', ':');
        if (li == null) return false;
		sc.reset(-1);
        let lo = sc.nextIndexList(':', ']');
        if (lo == null) return false;
		let n = Math.max(Math.max(...li), Math.max(...lo));

		// verify that lists are valid
		if (li.length + lo.length != n) return false;
        let items = new Set();
        for (let i of li) {
            if (items.has(i)) return false;
            items.add(i);
        }
        for (let i of lo) {
            if (items.has(i)) return false;
            items.add(i);
        }
		
		// initialize this
		if (n != this.n) this.reset(n);
		else this.clear();
        for (let i of li) this.swap(i);
        for (let i of lo) { this.swap(i); this.swap(i); }
			// double swap produces correct order for out-list
		return true;
	}
}
