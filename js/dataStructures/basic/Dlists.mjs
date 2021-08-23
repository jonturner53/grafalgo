/** @file Dlists.java 
 *
 * @author Jon Turner
 * @date 2021
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Adt from '../Adt.mjs';
import { assert } from '../../Errors.mjs';
import Scanner from './Scanner.mjs';

/** The Dlists class maintains a collection of disjoint lists defined
 *  over a set of integers 1..n.
 */
export default class Dlists extends Adt {
	#next;
	#prev;

	constructor(n, capacity=n) {
		super(n); this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n <= capacity);
		this.#next = new Array(capacity+1);
		this.#prev = new Array(capacity+1);
		// initialize to singleton lists
		for (let i = 0; i <= this.n; i++) {
			this.#next[i] = 0; this.#prev[i] = i;
		}
	}

	reset(n, capacity=n) {
		assert(n <= capacity);
		this._n = n; this.#init(capacity);
	}

	/** Get the capacity of the list (max number of items it has space for). */
	get _capacity() { return this.#next.length - 1; }

	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new Dlists(this.n,
				Math.floor(Math.max(n, 1.25 * this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		// make singletons from items in expanded range`
		for (let i = this.n+1; i <= n; i++) {
			this.#next[i] = 0; this.#prev[i] = i;
		}
		this._n = n;
	}

	assign(dl) {
		if (dl == this) return;
		if (dl.n > this.capacity) this.reset(dl.n);
		else { this.clear(); this._n = dl.n; }
		for (let i = 0; i <= this.n; i++) {
			this.#next[i] = dl.#next[i]; this.#prev[i] = dl.#prev[i];
		}
	}
	xfer(dl) {
		if (dl == this) return;
		this.#next = dl.#next; this.#prev = dl.#prev;
		dl.#next = dl.#prev = null;
	}
	
	/** Clear the data structure, moving all items into single node lists.
	*/
	clear() {
		for (let i = 0; i <= this.n; i++) {
			this.#next[i] = 0; this.#prev[i] = i;
		}
	}

	/** Get the first item in a list.
	 *  @param l is the id of a list.
	 *  @return the index of the first item in the list
	 */
	first(l) {
		assert(this.valid(l)); return l;
	}

	#isFirst(i) {
		return this.#next[this.#prev[i]] == 0;
	}
	
	/** Get the last item in a list.
	 *  @param l is the id of list.
	 *  @return the last item in the list
	 */
	last(l) {
		assert(this.valid(l) && this.#isFirst(l));
		return this.#prev[l];
	}

	/** Get the next list item.
	 *  @param i is a list item
	 *  @return the item that follows i in its list
	 */
	next(i) {
		assert(this.valid(i)); return this.#next[i];
	}
	
	/** Get the previous list item.
	 *  @param i is a list item
	 *  @return the int that precedes i in its list
	 */
	prev(i) {
		assert(this.valid(i));
		return (this.#isFirst(i) ? 0 : this.#prev[i]);
	}

	/** Determine if an item is in a singleton list.
	 *  @param i is the index of an item
	 *  @return true if it is the only item in its list, else false
	 */
	singleton(i) {
		assert(this.valid(i));
		return this.#prev[i] == i;
	}
	
	/** Change the id for a given list.
	 *  @param l is an id of some list
	 *  @param j is the index of some item in the list; on return j is the id
	 */
	rename(l, j) {
		assert(this.valid(l) && this.valid(j) && this.#isFirst(l));
		this.#next[this.prev(l)] = l; this.#next[this.prev(j)] = 0;
	}

	/** Find the identifier of a list.
	 *  @param i is an item on some list
	 *  @return the id of the list
	 */
	findList(i) {
		assert(this.valid(i));
		while (!this.#isFirst(i)) i = this.prev(i);
		return i;
	}
	
	/** Remove an item from its list.
	 *  This method turns the deleted item into a singleton list.
	 *  @param i is an item in a list
	 *  @param l is a list id
	 *  @return the id of the modified list, or 0 if l was a singleton
	 */
	delete(i, l) {
		assert(this.valid(i) && this.valid(l) && this.#isFirst(l));
		if (this.singleton(l)) return 0;
		if (i == l) {
			this.#prev[this.#next[l]] = this.prev(l);
			l = this.#next[l]; // l is now the new id
		} else if (i == this.last(l)) {
			this.#prev[l] = this.#prev[l];
			this.#next[this.#prev[i]] = 0;
		} else {
			this.#prev[this.#next[i]] = this.#prev[i];
			this.#next[this.#prev[i]] = this.#next[i];
		}
		this.#next[i] = 0; this.#prev[i] = i;
		return l;
	}
	
	/** Join two lists together.
	 *  @param l1 is a list id
	 *  @param l2 is a second list id
	 *  @return the id of the list formed by joining the two lists;
	 *  defined to be l1, for non-zero l1
	 */
	join(l1, l2) {
		assert(this.valid(l1) && this.valid(l2));
		if (l2 == 0 || l1 == l2) return l1;
		if (l1 == 0) return l2;
		assert(this.#isFirst(l1) && this.#isFirst(l2));
		let last2 = this.last(l2);
		this.#next[this.#prev[l1]] = l2;
		this.#prev[l2] = this.#prev[l1];
		this.#prev[l1] = last2;
		return l1;
	}
	
	/** Produce a string representation of the object.
	 *  @return a string such as "[(a c), (d b e), (f), (g)]".
	 */
	toString() {
		let s = '';
		for (let l = 1; l <= this.n; l++) {
			if (!this.#isFirst(l) || this.singleton(l)) continue;
			if (s.length > 0) s += ', ';
			s += '(';
			for (let i = this.first(l); i != 0; i = this.next(i)) {
				if (i != this.first(l)) s += ' ';
				s += this.index2string(i);
			}
			s += ')';
		}
		return '[' + s + ']';
	}

	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		if (!sc.verify('[')) return false;
		let l = new Array(10);
		while (sc.nextIndexList(l, '(', ')') != null) {
			let n = 0;
			for (let i of l) n = Math.max(i, n);
			if (n > this.n) this.expand(n);
			for (let i = 1; i < l.length; i++)
				this.join(l[0], l[i]);
			if (!sc.verify(',')) break;
		}
		if (sc.verify(']')) return true;
		this.clear(); return false;
	}
}
