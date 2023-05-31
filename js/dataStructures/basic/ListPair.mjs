/** \file ListPair.mjs
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

/** Data structure that represents a pair of complementary index lists.
 *  The index values have a limited range 1..n and each index is
 *  always in one of the two lists.  The lists are referred to as
 *  "in" and "out" and can be accessed using the provided methods.
 *  The only way to modify the data structure is to move an item
 *  from one list to the other, using the swap method.
 *  Initially, all items are in the out list.
 */
export default class ListPair extends Top {
	#n1;		// number of items in list 1
	#n2;		// number of items in list 2

	#first1;	// first item in the list 1
	#last1;	    // last item in the list 1
	#first2;	// first item in the list 2
	#last2	    //last item in the list 2
	#next;		// #next[i] defines next item after i
				// in items use positive #next values
				// out items use negative #next values
	#prev;		// #prev[i] defines item preceding i
				// in items use positive #prev values
				// out items use negative #prev values
	
	/** Constructor for list pair.
	 *  @param n specifies the range of integer values
	 */
	constructor(n=10) {
		super(n);
		this.#next = new Int32Array(this.n+1);
		this.#prev = new Int32Array(this.n+1);
		this.#first1 = this.#last1 = 0;
		this.#first2 = 1; this.#last2 = this.n;
		for (let i = 1; i <= this.n; i++) {
			this.#next[i] = i+1; this.#prev[i] = -(i-1);
		}
		this.#next[this.n] = this.#prev[1] = 0;
		this.#n1 = 0; this.#n2 = this.n;
	}

	/** Expand index range and possibly the space.
	 *  Default version does not suffice here;
	 *  must also add new list items to second list.
	expand(n) {
		if (n <= this.n) return;
		let n0 = this.n;
		super.expand(n);
		this.#next[this.#last2] = n0+1; this.#prev[n0+1] = -this.#last2;
		this.#next[n] = 0; this.#last2 = n;
		this.#n2 += n-n0;
	}
	 */
	
	/** Assign one ListPair to another by copying its contents.
	 *  @param l is the ListPair whose contents is to be copied.
	 */
	assign(other, relaxed=false) {
		super.assign(other, relaxed);
		for (let i = other.first1(); i != 0; i = other.next1(i)) {
			if (this.in2(i)) this.swap(i);
		}
		for (let i = other.first2(); i != 0; i = other.next2(i)) {
			this.swap(i); this.swap(i); // to match order in other
		}
	}

	/** Assign one ListPair to another by transferring its contents.
	 *  @param other is the ListPair to assign.
	 */
	xfer(other) {
		super.xfer(other);
		this.#next = other.#next; this.#prev = other.#prev;
		other.#next = other.#prev = null;
		this.#first1 = other.#first1; this.#last1 = other.#last1;
		this.#first2 = other.#first2; this.#last2 = other.#last2;
		this.#n1 = other.#n1; this.#n2 = other.#n2;
	}
	
	/** Determine if an item belongs to list 1
	 *  @param i is an integer
	 *  @param return true if i is a member of list 1, else false.
	 */
	in1(i) {
		return this.valid(i) && (this.#prev[i] > 0 || i == this.#first1);
	}
	
	/** Determine if an item belongs to list 2.
	 *  @param i is an integer
	 *  @param return true if i is a member of list 2, else false.
	 */
	in2(i) {
		return this.valid(i) && (this.#prev[i] < 0 || i == this.#first2);
	}
	
	/** Get the number of elements in list 1.  */
	n1() { return this.#n1; }
	
	/** Get the number of elements in list 2  */
	n2() { return this.#n2; }
	
	/** Get the first item in list 1.
	 *  @return the first value on the list 1 or 0 if the list is empty.
	 */
	first1() { return this.#first1; }
	
	/** Get the first item in list 2.
	 *  @return the first value on the list 2 or 0 if the list is empty.
	 */
	first2() { return this.#first2; }
	
	/** Get the last item in list 1.
	 *  @return the last value on the list 1 or 0 if the list is empty.
	 */
	last1() { return this.#last1; }
	
	/** Get the first item in list 2.
	 *  @return the last value on the list 2 or 0 if the list is empty.
	 */
	last2() { return this.#last2; }
	
	/** Get the next item in list 1.
	 *  @param i is the "current" value
	 *  @return the next int on the list 1 or 0 if no more values
	 */
	next1(i) {
		fassert(this.in1(i));
		// `ListPair.next: item ${i} not in list1`);
		return this.#next[i];
	}
	
	/** Get the next value in the list2.
	 *  @param i is the "current" value
	 *  @return the next value on the list 2 or 0 if no more values
	 */
	next2(i) {
		fassert(this.in2(i));
		return this.#next[i];
	}
	
	/** Get the previous value in list 1.
	 *  @param i is the "current" value
	 *  @return the previous value on the list 1 or 0 if no more values
	 */
	prev1(i) {
		fassert(this.in1(i));
		return this.#prev[i];
	}
	
	/** Get the previous value in list 2.
	 *  @param i is the "current" value
	 *  @return the previous value on the list 2 or 0 if no more values
	 */
	prev2(i) {
		fassert(this.in2(i)); 
		return -this.#prev[i];
	}
	
	/** Remove all elements from list 1. */
	clear() { while (this.first1() != 0) this.swap(this.first1()); }
	
	/** Move an item from one list to the other.
	 *  Inserts swapped item at end of the other list
	 *  @param i is the index of item to be swapped
	 *  @param j is a list item in the "other" list; i is inserted
	 *  into the other list, following item j, or at the start if j=0.
	 */
	swap(i, j=-1) {
		if (j < 0) j = this.in1(i) ? this.last2() : this.last1();

		fassert(this.valid(i) && i && this.valid(j));
		fassert((this.in1(i)  && (!j || this.in2(j))) ||
			   (this.in2(i) && (!j || this.in1(j))));

		if (this.in1(i)) {
			// first remove i from list 1
			if (i == this.last1()) this.#last1 = this.#prev[i];
			else this.#prev[this.#next[i]] = this.#prev[i];
			if (i == this.first1()) this.#first1 = this.#next[i];
			else this.#next[this.#prev[i]] = this.#next[i];
	
			// now add i to list 2
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
			// first remove i from list 2
			if (i == this.last2()) this.#last2 = -this.#prev[i];
			else this.#prev[this.#next[i]] = this.#prev[i];
			if (i == this.first2()) this.#first2 = this.#next[i];
			else this.#next[-this.#prev[i]] = this.#next[i];
	
			// now add i to list 1
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
	
	/** Compare two list pairs for equality.
	 *  @param other is another list pair or a string
	 *  @return true if the two lists are identical
	 */
	equals(other) {
		let lp = super.equals(other);
		if (typeof lp == 'boolean') return lp;
		if (this.n1 != lp.n1 || this.n2 != lp.n2) return false;
		let i = this.first1(); let j = lp.first1();
		while (i && i == j) { i = this.next1(i); j = lp.next1(j); }
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
