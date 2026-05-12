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

	propName;	// name of optional item property
	defProp;	// default property value
	propValues; // array of property values
	
	/** Constructor for List object.
	 *  @param n is the range for the list
	 */
	constructor(n=10, propName, defVal) {
		super(n);
		this.Next = new Int32Array(this.n+1).fill(-1);
		this.Next[0] = this.First = this.Last = this.Length = 0;
		this.Prev = null;

		this.propName = ''; this.propValues == null;
		if (arguments.length == 3)
			this.addProperty(propName, defVal);
	}

	/** Add an item property.
	 *  @param propName is the name of the new property
	 *  @param defVal is the default value of the new property
	 */
	addProperty(propName='value', defVal=0) {
		this.propName = propName;
		this.defProp = defVal;
		this.propValues = new Array(this.n+1).fill(defVal);
		Object.defineProperty(this, propName,
			{ value: 	function(i) {
							ea && assert(this.valid(i),
                     			`Graph.${propName}: invalid item number: ${i}`);
							if (arguments.length > 1) {
								this.propValues[i] = arguments[1];
							}
							return this.propValues[i];
						}
			});
	}
		
	/** Determine if this object has both forward and reverse links. */
	get hasReverse() { return this.Prev ? true : false; }

	/** Turn reverse links on or off.
	 *  @param on is a boolean used to enable or disable the reverse feature
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
	
	/** Remove all elements from list.
	 *  Note: property values are retained when items leave list
	 */
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
	 *  if zero, i is inserted at the front of the list
	 */
	insert(i, j) {
		ea && assert(i && this.valid(i) && !this.contains(i) &&
					 (j == 0 || this.contains(j)),
					 `List.insert: ${this.x2s(i)} ${this.x2s(j)} ${''+this}`);
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
	 */
	push(i) { this.insert(i, 0); }
	
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
	 *  @return true if the list was modified, else false
	 */
	enq(i) { this.insert(i, this.last()); }
	
	/** Remove the first item in the list. 
	 *  @return the item removed, or 0
	 */
	deq() { return this.pop(); }

	/** Set list to a range.
	 *  @param lo is a positive integer
	 *  @param hi >= lo defines range [lo,hi]
	 */
	range(lo, hi) {
		ea && assert(1 <= lo && lo <= hi && hi <= this.n);
		this.clear(); for (let i = lo; i <= hi; i++) this.enq(i);
	}

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
		that = super.equals(...(arguments.length == 1 ?
							[that, this.n] : arguments));
			// when that is a string, Top constructs and returns a List;
			// passing it this.n ensures that index range of List matches this
		if (typeof that == 'boolean') return that;
		if (this.length != that.length) return false;

		if (this.propName != that.propName) return false;

		let j = that.first();
		for (let i = this.first(); i; i = this.next(i)) {
			if (i != j) return false;
			if (this.propName) {
				if (typeof this.propValues[i] != typeof that.propValues[i]) {
					return false;
				}
				if (typeof this.propValues[i] != 'object' &&
				    this.propValues[i] != that.propValues[i]) {
					return false;
				}
			}
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
		that = super.equals(...(arguments.length==1 ? [that,this.n]:arguments));
		if (typeof that == 'boolean') return that;
		// that is now guaranteed to be an object that can be compared
		for (let i = this.first(); i; i = this.next(i))
			if (!that.contains(i)) return false;
		return true;
	}

	prop2string(i) {
		let p = this.propValues[i];
		if (typeof p == 'string') return '"' + p + '"';
		if (typeof p == 'object') return JSON.stringify(p);
		return ''+p;
	}

	/** Create a string representation of a given string.
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(label=0) {
		if (!label) {
			label = (j => this.x2s(j) +
					 (this.propValues && this.propValues[j] != this.defProp ?
					  ':' + this.prop2string(j) : ''));
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
	 *  @param n is an optional minimum value for the index range
	 *  @param prop is an optional function used to parse an item property
	 *  @return true on success, else false
	 */
	static fromString(s, n=10, propName='value', defVal=0, scanProp=0) {
		let sc = new Scanner(s);
		let propVals = []; let hasProps = 0;
		if (!scanProp) {
			scanProp = (u,sc) => {
						if (!sc.verify(':',0)) return true;
						let p = sc.nextDatum();
						if (p == null) return false;
						//if (Number.isNaN(p)) return false;
						propVals[u] = p; hasProps = 1;
						return true;
					};
		}
		let l = sc.nextIndexList('[', ']', scanProp);
		if (l == null) return null;
		let items = new Set();
		for (let i of l) {
			n = Math.max(i, n);
            if (items.has(i)) return null;
            items.add(i);
		}

		let list = new List(n);
		if (arguments.length >= 4 || hasProps) {
			list.addProperty(propName, defVal);
		}
		for (let i of l) {
			list.enq(i);
			if (hasProps && propVals[i])
				list.propValues[i] = propVals[i];
		}
		return list;
	}
}
