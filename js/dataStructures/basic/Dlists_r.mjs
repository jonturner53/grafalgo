/** @file Dlists_r.java 
 *
 * @author Jon Turner
 * @date 2021
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Adt from '../Adt.mjs';
import { assert } from '../../common/Errors.mjs';
import Dlists from './Dlists.mjs';
import Scanner from './Scanner.mjs';

/** The Dlists_r class maintains a collection of disjoint lists defined
 *  over a set of integers 1..n. It supports constant time list-reversal,
 *  by swapping the role of the next/prev pointers.
 */
export default class Dlists_r extends Dlists {
	#nabor1;		// nabor1[i] is one of the neighbors of i in its list
	#nabor2;		// nabor2[i] is the other neighbor of i in its list

	constructor(n, capacity=n) {
		super(n); this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n <= capacity);
		this.#nabor1 = this._next; this.#nabor2 = this._prev;
	}

	xfer(dl) {
		super.xfer(dl); this.#nabor1 = this._next; this.#nabor2 = this._prev;
	}
	
	isFirst(i) {
		return this.#nabor1[i] < 0 || this.#nabor2[i] < 0;
	}
	
	/** Get the last item in a list.
	 *  @param f is the first item in a list
	 *  @return the last item in the list
	 */
	last(f) {
		assert(this.valid(f) && this.isFirst(f));
		return (this.#nabor1[f] < 0 ? -this.#nabor1[f] : -this.#nabor2[f]);
	}

	/** Get the next list item.
	 *  @param i is a list item
	 *  @param j is the list item preceding i, or 0 if i is the first item.
	 *  @return the item that follows i in its list, or 0 if i is the last item.
	 */
	next(i, j) {
		assert(this.valid(i));
		let n1 = this.#nabor1[i]; let n2 = this.#nabor2[i];
		return (this.isFirst(i) ? (n1 >= 0 ? n1 : n2) :
								  (j == n1 ? n2 : n1));
	}
	
	/** Get the previous list item.
	 *  @param i is a list item
	 *  @param j is the list item following i, or 0 if i is the last item.
	 *  @return the item that precedes j on the list, or 0 if j is the first
	 *  item.
	 */
	prev(i, j) {
		assert(this.valid(i));
		let n1 = this.#nabor1[i]; let n2 = this.#nabor2[i];
		return (this.isFirst(i) ? 0 : (n1 == 0 ? n2 :
				(n2 == 0 ? n1 : (j == n1 ? n2 : n1))));
	}

	/** Determine if an item is in a singleton list.
	 *  @param i is the index of an item
	 *  @return true if it is the only item in its list, else false
	 */
	singleton(i) {
		assert(this.valid(i));
		return this.#nabor1[i] == -i || this.#nabor2[i] == -i;
	}
	
	/** Find the start of a list.
	 *  @param i is an item on some list
	 *  @return the first item on the list
	 */
	findList(i) {
		assert(this.valid(i));
		let n1 = this.#nabor1[i]; let n2 = this.#nabor2[i];
		if (n1 < 0 || n2 < 0) {
			return i;
		} else if (n1 == 0 || n2 == 0) {
			let pi = (n1 == 0 ? n2 : n1);
		} else {
			// we're somewhere in the middle of the list, assume n1 == prev(i)
			let pi = n1; let trailer = i;
			for (let j = pi; j != 0; [j, trailer] = [this.prev(j, trailer), j])
				;
			if (this.isFirst(trailer)) return trailer;
			// assumption was wrong, so n2 = prev(i)
			pi = n2;
		}
		// pi == prev(i), follow list back to first item
		let trailer = i;
		for (let j = pi; j != 0; [j, trailer] = [this.prev(j, trailer), j])
			;
		return trailer;
	}
				
	/** Rotate list l to make i it's first item.
	 *  @param f is the first item on a list.
	 *  @param i is another item on the same list
	 *  @return the modified list
	 */
	rotate(f, i) {
		if (i == f) return i;

		// find i and prev(i)
		let trailer = 0;
		for (let j = f; j != i; [j, trailer] = [this.next(j, trailer), j]) {
			assert(j != 0);
		}
		let pi = trailer;  // j==i and pi==prev(i)

		// fixup pointers at i
			 if (this.#nabor1[i] == 0) this.#nabor1[i] = f;
		else if (this.#nabor2[i] == 0) this.#nabor2[i] = f;
		if (this.#nabor1[i] == pi) this.#nabor1[i] = -pi;
		else					   this.#nabor2[i] = -pi;
		if (this.#nabor1[pi] == i) this.#nabor1[pi] = 0;
		else					   this.#nabor2[pi] = 0;

		// fixup pointers at f
		let n1 = this.#nabor1[f]; let n2 = this.#nabor2[f];
		if (n1 < 0) {
			this.#nabor1[f] = -n1;
			if (-n1 != i) {
				if (this.#nabor1[-n1] == 0) this.#nabor1[-n1] = f;
				else						this.#nabor2[-n1] = f;
			}
		} else {
            this.#nabor2[f] = -n2; 
			if (-n2 != i) {
	            if (this.#nabor1[-n2] == 0) this.#nabor1[-n2] = f;
	            else                        this.#nabor2[-n2] = f;
			}
		}

		return i;
	}
	
	/** Remove the first item from a list.
	 *  @param f is the first item in a list
	 *  @return the first item of the modified list, or 0 if it`was a singleton
	 */
	pop(f) {
		assert(this.valid(f) && this.isFirst(f));
		if (this.singleton(f)) return 0;
		let s;
		if (this.#nabor1[f] < 0) {
			s = this.#nabor2[f];
			if (f == this.#nabor1[s]) this.#nabor1[s] = this.#nabor1[f];
			else this.nabor2[s] = this.#nabor1[f];
		} else { // this.#nabor2[f] < 0
			s = this.#nabor1[f];
			if (f == this.#nabor1[s]) this.#nabor1[s] = this.#nabor2[f];
			else this.#nabor2[s] = this.#nabor2[f];
		}
		this.#nabor1[f] = 0; this.#nabor2[f] = -f;
		return s;
	}

	delete(i, f) {
		let n1 = this.#nabor1[i]; let n2 = this.#nabor2[i];
		if (this.isFirst(i)) {
			return this.pop(i);
		} else if (i == this.last(f)) {
			let pi = (n1 == 0 ? n2 : n1);
			if (i == this.#nabor1[pi]) this.#nabor1[pi] = 0;
			else					   this.#nabor2[pi] = 0;
			if (this.#nabor1[f] < 0) this.#nabor1[f] = -pi;
			else 					 this.#nabor2[f] = -pi;
		} else {
			if (i == this.#nabor1[n1]) this.#nabor1[n1] = n2;
			else					   this.#nabor2[n1] = n2;
			if (i == this.#nabor1[n2]) this.#nabor1[n2] = n1;
			else					   this.#nabor2[n2] = n1;
		}
		this.#nabor1[i] = 0; this.#nabor2[i] = -i;
	}
	
	/** Join two lists together.
	 *  @param f1 is the first item on one list
	 *  @param f2 is the first item on a second list
	 *  @return the first item on the list formed by joining the two lists;
	 *  defined to be f1, for non-zero f1
	 */
	join(f1, f2) {
		if (f2 == 0 || f1 == f2) return f1;
		if (f1 == 0) return f2;
		assert(this.isFirst(f1) && this.isFirst(f2));
		let l1 = this.last(f1); let l2 = this.last(f2);
		if (this.#nabor1[f1] < 0)  this.#nabor1[f1] = -l2;
		else 					   this.#nabor2[f1] = -l2;
		if (this.#nabor1[f2] < 0)  this.#nabor1[f2] = l1;
		else					   this.#nabor2[f2] = l1;
		if (this.#nabor1[l1] == 0) this.#nabor1[l1] = f2;
		else					   this.#nabor2[l1] = f2;
		return f1;
	}

	/** Reverse a list.
	 *  @param f is the first item on a list
	 *  @return the first item on the reversed list
	 */
	reverse(f) {
		if (this.singleton(f)) return f;
		let l = this.last(f);
		if (this.#nabor1[f] < 0)  this.#nabor1[f] = 0;
		else					  this.#nabor2[f] = 0;
		if (this.#nabor1[l] == 0) this.#nabor1[l] = -f;
		else					  this.#nabor2[l] = -f;
		return l
	}

	/** Determine if two Dlists are equal.
	 *  @param dl is a second Dlist or a string representing a Dlist
	 *  @return true if the two Dlists contain identical lists.
	 */
	equals(dl) {
		if (this === dl) return true;
		if (typeof dl == 'string') {
			let s = dl; dl = new Dlists(this.n); dl.fromString(s);
		} else if (!(dl instanceof Dlists))
			return false;
		if (this.n != dl.n) return false;
		for (let i = 1; i < this.n; i++) {
			if (this.isFirst(i) != dl.isFirst(i)) return false;
			if (!this.isFirst(i)) continue;
			let j1 = i; let k1 = 0; let j2 = i; let k2 = 0;
			do {
				[j1, k1] = [this.next(j1, k1), j1];
				[j2, k2] = [this.next(j2, k2), j2];
				if (j1 != j2) return false;
			} while (j1 != 0);
		}
		return true;
	}
	
	/** Produce a string representation of the object.
	 *  @param details causes singletons to be shown, when true
	 *  @param label is a function used to label list items
	 *  @param pretty causes lists to be separated with newlines
	 *  @return a string such as "[(a c), (d b g)]".
	 */
	toString(details=0, pretty=0, label=0) {
		let s = '';
		for (let l = 1; l <= this.n; l++) {
			if (!this.isFirst(l) || (this.singleton(l) && !details))
				continue;
			if (s.length > 0) s += ',' + (pretty ? '\n ' : ' ');
			s += '('; let j = 0;
			for (let i = l; i != 0; [i,j] = [this.next(i,j),i]) {
				if (i != l) s += ' ';
				s += this.index2string(i, label);
			}
			s += ')';
		}
		return '[' + s + (pretty ? ']\n' : ']');
	}
}
