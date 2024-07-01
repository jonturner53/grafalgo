/** @file List.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import Scanner from './Scanner.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

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
	First;      // first item in list
	Last;       // last item in list
	Length;     // number of items in list
	Next;       // Next[i] is successor of i in list
	Prev;       // Prev[i] is predecessor of i in list
                // allocated dynamically as required
	Value;      // allocated dynamically as required
	
	/** Constructor for List object.
	 *  @param n is the range for the list
	 */
	constructor(n=10) {
		super(n);
		this.Next = new Int32Array(this.n+1).fill(-1);
		this.Next[0] = this.First = this.Last = this.Length = 0;
		this.Prev = this.Value = null;
	}

	/** Determine if this object has both forward and reverse links. */
	get hasReverse() { return this.Prev ? true : false; }

	/** Turn reverse links on or off.
	 *  @param on is a boolean used to enable or disable the values feature
	 */
	set hasReverse(on) {
		if (on && !this.Prev) {
			this.Prev = new Array(this.Next.length).fill(undefined);
			for (let i = this.first(); i; i = this.next(i))
				if (this.next(i)) this.Prev[this.next(i)] = i;
		} else if (!on && this.Prev) {
			this.Prev = null;
		}
	}

	/** Determine if this object includes item values. */
	get hasValues() { return this.Value ? true : false; }

	/** Turn item values feature on or off.
	 *  @param on is a boolean used to enable or disable the values feature
	 */
	set hasValues(on) {
		if (on && !this.Value) {
			this.Value = new Array(this.Next.length).fill(undefined);
		} else if (!on && this.Value) {
			this.Value = null;
		}
	}

	/** Get/set the value of an item.
	 *  @param i is an integer
	 *  @param val is an optional value to be assigned to i
	 *  @return the value of i or null if i is not a valid item or no
	 *  value has been assigned to i
	 */
	value(i, val=undefined) {
		ea && assert(this.valid(i));
		if (val != undefined) {
			if (!this.hasValues) this.hasValues = true;
			this.Value[i] = val;
		}
		return this.hasValues ? this.Value[i] : undefined;
	}

	/** Assign new value to list from another. 
	 *  @param that is a list whose value is to be assigned to this
	 *  @param relaxed is a boolean; when false, this.n is adjusted
	 *  to exactly match that.n; when true, this.n is only adjusted
	 *  if it is less than that.n; relaxed assignments are used to
	 *  implement the expand method
	 */
	assign(that, relaxed=false) {
		super.assign(that, relaxed);

		if (that.hasReverse && !this.hasReverse) this.hasReverse = true;
		if (that.hasValues && !this.hasValues) this.hasValues = true;
		for (let i = that.first(); i; i = that.next(i)) {
			if (this.hasValues) this.enq(i, that.value(i));
			else this.enq(i);
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param that is a list whose contents are to be transferred to this
	 */
	xfer(that) {
		super.xfer(that);
		this.First = that.first(); this.Last = that.last();
		this.Length = that.length;
		this.Next = that.Next; that.Next = null;
		this.Prev = that.Prev; that.Prev = null;
		this.Value = that.Value; that.Value = null;
	}
	
	/** Remove all elements from list. */
	clear() { while (!this.empty()) this.pop(); }

	/** Get the number of items in the list. */
	get length() { return this.Length; }

	/** Get the next item in a list.
	 *  @param i is an item on the list
	 *  @return the item that follows i, or 0 if there is no next item
	 */
	next(i) { return this.Next[i]; }
	
	/** Get the previous item in a list.
	 *  @param i is an item on the list
	 *  @return the item that follows i, or 0 if there is no next item
	 */
	prev(i) {
		if (!this.Prev) this.hasReverse = true;
		return this.Prev[i];
	}

	/** Get first item on list.
	 *  @return the first item on the list or 0 if the list is empty
	 */
	first() { return this.First; }
	top() { return this.First; }
	
	/** Get the last item on list.
	 *  @return the last item on the list or 0 if the list is empty
	 */
	last() { return this.Last; }

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
			if (!this.Prev) this.hasReverse = true;
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
	contains(i) { return this.valid(i) && i != 0 && this.Next[i] != -1; } 

	/** Insert an item into the list, relative to another. 
	 *  @param i is item to insert
	 *  @param j is item after which i is to be inserted;
	 *  @param value is optional value for inserted item
	 *  if zero, i is inserted at the front of the list
	 */
	insert(i, j, value=undefined) {
		if (i > this.n) this.expand(i);
		ea && assert(i && this.valid(i) && !this.contains(i) &&
					 (j == 0 || this.contains(j)),
					 `List.insert: ${this.x2s(i)} ${this.x2s(j)} ${''+this}`);
		if (value != undefined) this.value(i, value);
		if (j == 0) {
			if (this.empty()) this.Last = i;
			this.Next[i] = this.First; this.First = i; this.Length++;
		} else {
			this.Next[i] = this.Next[j]; this.Next[j] = i; this.Length++;
			if (this.Last == j) this.Last = i;
		}
		if (this.Prev) {
			this.Prev[i] = j;
			if (i != this.last()) this.Prev[this.next(i)] = i;
		}
		return;
	}
	
	/** Remove the item following a specified item. 
	 *  @param i is item whose successor is to be deleted;
	 *  if zero, the first item is deleted
	 *  @return the item that follows the deleted item
	 */
	deleteNext(i) {
		ea && assert(i == 0 || this.contains(i));
		if (i == this.last()) return 0;
		let j;
		if (i == 0) { j = this.First;   this.First = this.Next[j]; }
		else	    { j = this.Next[i]; this.Next[i] = this.Next[j]; }
		if (this.Last == j) this.Last = i;
		this.Next[j] = -1; this.Length--;
		if (this.Prev) {
			if (i == 0)
				this.Prev[this.first()] = 0;
			else if (this.next(i) != 0)
				this.Prev[this.next(i)] = i;
			this.Prev[j] = 0;
		}
		if (this.hasValues) this.value(j,undefined);
		return (i == 0 ? this.first() : this.next(i));
	}

	/** Remove a specified item.
	 *  @param i is an item to be removed
	 *  @return item that follows i
	 */
	delete(i) {
		ea && assert(this.valid(i), `invalid list item ${i}`);
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

	/** Find an item in common between two lists.
	 *  @param that is a second List object
	 *  @return an item that is common to both lists or 0.
	 */
	common2(that) {
		for (let i = this.first(); i; i = this.next(i))
			if (that.contains(i)) return i;
		return 0;
	}

	/** Compare two lists for equality.
	 *  @param that is the list to be compared to this one or a string
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order)
	 */
	equals(that) {
		that = super.equals(that); 
		if (typeof that == 'boolean') return that;
		let j = that.first();
		for (let i = this.first(); i; i = this.next(i)) {
			if (i != j) return false;
			if (this.value(i) != that.value(j)) return false;
			j = that.next(j);
		}
		return j == 0 ? that : false;
	}

	/** Compare two lists for set equality.
	 *  @param that is the list to be compared to this one
	 *  @return true if they contain the same items, but not
	 *  necessarily in the same order.
	 */
	setEquals(that) {
		that = super.equals(that); 
		if (typeof that == 'boolean') return that;
		// that is now guaranteed to be an object that can be compared
		for (let i = this.first(); i; i = this.next(i))
			if (!that.contains(i)) return false;
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
					 (this.hasValues && this.value(u) ?
					  ':' + this.value(u) : ''));
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
		let pvec = [];
		if (!prop) {
			prop = (u,sc) => {
						if (!sc.verify(':')) return true;
						let p = sc.nextNumber();
						if (Number.isNaN(p)) return false;
						pvec[u] = p;
						return true;
					};
		}
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
		for (let i of l) {
			if (pvec.length == 0) this.enq(i);
			else this.enq(i, pvec[i] ? pvec[i] : 0);
		}
		return true;
	}
}
