/** @file Dlists.java 
 *
 * @author Jon Turner
 * @date 2021
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Adt from '../Adt.mjs';
import { assert } from '../../common/Errors.mjs';
import Scanner from './Scanner.mjs';

/** The Dlists class maintains a collection of disjoint lists defined
 *  over a set of integers 1..n. Each list in the collection is identified
 *  by its first item.
 */
export default class Dlists extends Adt {
	_next;		// _next[i] is next item on list or 0 for last item
	_prev;		// _prev[i] is previous item on list or last for first item,
				// where last is the last item on the list

	constructor(n, capacity=n) {
		super(n); this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n <= capacity);
		this._next = new Array(capacity+1);
		this._prev = new Array(capacity+1);
		// initialize to singleton lists
		for (let i = 0; i <= this.n; i++) {
			this._next[i] = 0; this._prev[i] = i;
		}
		this._prev[0] = 0;
	}

	reset(n, capacity=n) {
		assert(n <= capacity);
		this._n = n; this.#init(capacity);
	}

	/** Get the capacity of the list (max number of items it has space for). */
	get _capacity() { return this._next.length - 1; }

	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new Dlists(this.n,
				Math.floor(Math.max(n, 1.25 * this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		// make singletons from items in expanded range
		for (let i = this.n+1; i <= n; i++) {
			this._next[i] = 0; this._prev[i] = i;
		}
		this._n = n;
	}

	assign(dl) {
		if (dl == this) return;
		if (dl.n > this.capacity) this.reset(dl.n);
		else { this.clear(); this._n = dl.n; }
		for (let i = 1; i <= this.n; i++) {
			this._next[i] = dl._next[i]; this._prev[i] = dl._prev[i];
		}
	}
	xfer(dl) {
		if (dl == this) return;
		this._next = dl._next; this._prev = dl._prev;
		dl._next = dl._prev = null;
	}
	
	/** Clear the data structure, moving all items into single node lists.
	*/
	clear() {
		for (let i = 1; i <= this.n; i++) {
			this._next[i] = 0; this._prev[i] = i;
		}
	}

	isFirst(i) { assert(this.valid(i)); return this._next[this._prev[i]] == 0; }
	
	/** Get the last item in a list.
	 *  @param f is the first item on a list.
	 *  @return the last item in the list
	 */
	last(f) {
		assert(this.isFirst(f));
		return this._prev[f];
	}

	/** Get the next list item.
	 *  @param i is a list item
	 *  @return the item that follows i in its list
	 */
	next(i) {
		assert(this.valid(i)); return this._next[i];
	}
	
	/** Get the previous list item.
	 *  @param i is a list item
	 *  @return the item that precedes i in its list
	 */
	prev(i) {
		return (this.isFirst(i) ? 0 : this._prev[i]);
	}

	/** Determine if an item is in a singleton list.
	 *  @param i is the index of an item
	 *  @return true if it is the only item in its list, else false
	 */
	singleton(i) {
		assert(this.valid(i));
		return this._prev[i] == i;
	}
	
	/** Find the start of a list.
	 *  @param i is an item on some list
	 *  @return the first item on the list
	 */
	findList(i) {
		assert(this.valid(i));
		while (this.prev(i) != 0) i = this.prev(i);
		return i;
	}

	/** Rotate list l to make i it's first item.
	 *  @param f is the first item on a list.
	 *  @param i is another item on the same list
	 *  @return the modified list
	 */
	rotate(f, i) {
		if (i == f) return i;
		this._next[this.last(f)] = f;
		this._prev[f] = this._prev[f];
		this._next[this._prev[i]] = 0;
		return i;
	}
	
	/** Remove an item from its list.
	 *  This method turns the deleted item into a singleton list.
	 *  @param i is an item in a list
	 *  @param f is the first item of a list
	 *  @return the first item of the modified list, or 0 if f was a singleton
	 */
	delete(i, f) {
		assert(this.valid(i) && this.valid(f) && this.isFirst(f));
		if (this.singleton(f)) return 0;
		let l = this.last(f); let nf = this.next(f);
		let pi = this.prev(i); let ni = this.next(i);
		if (i == f) {
			this._prev[nf] = this._prev[f]; f = nf;
		} else if (i == l) {
			this._prev[f] = pi; this._next[pi] = 0;
		} else {
			this._prev[ni] = pi; this._next[pi] = ni;
		}
		this._next[i] = 0; this._prev[i] = i;
		return f;
	}
	
	/** Join two lists together.
	 *  @param f1 is the first item on a list
	 *  @param f2 is the first item on another list
	 *  @return the id of the list formed by joining the two lists;
	 *  defined to be f1, for non-zero f1
	 */
	join(f1, f2) {
		assert(this.valid(f1) && this.valid(f2));
		if (f2 == 0 || f1 == f2) return f1;
		if (f1 == 0) return f2;
		assert(this.isFirst(f1) && this.isFirst(f2));
		let l1 = this.last(f1); let l2 = this.last(f2);
		this._next[l1] = f2;
		this._prev[f2] = l1;
		this._prev[f1] = l2
		return f1;
	}

	/** Sort the lists by item number */
	sort() {
		let vec = [];
		for (let i = 1; i <= this.n; i++) {
			if (this.singleton(i) || !this.isFirst(i)) continue;
			let j = i; vec.length = 0;
			while (!this.singleton(j)) {
				vec.push(j); j = this.delete(j, j);
			}
			vec.push(j);
			vec.sort((a,b) => a-b);
			for (j = 1; j < vec.length; j++)
				this.join(vec[0], vec[j])
		}
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
			let j1 = i; let j2 = i;
			do {
				j1 = this.next(j1); j2 = dl.next(j2);
				if (j1 != j2) return false;
			} while (j1 != 0);
		}
		return true;
	}
	
	/** Produce a string representation of the object.
	 *  @param details causes singletons to be shown, when true
	 *  @param strict forces items to be displayed as integers, not letters
	 *  @param pretty causes lists to be separated with newlines
	 *  @return a string such as "[(a c), (d b g)]".
	 */
	toString(details=0, pretty=0, strict=0) {
		let s = '';
		for (let l = 1; l <= this.n; l++) {
			if (!this.isFirst(l) || (this.singleton(l) && !details))
				continue;
			if (s.length > 0) s += ',' + (pretty ? '\n ' : ' ');
			s += '(';
			for (let i = l; i != 0; i = this.next(i)) {
				if (i != l) s += ' ';
				s += this.index2string(i, strict);
			}
			s += ')';
		}
		return '[' + s + (pretty ? ']\n' : ']');
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
			for (let i = 1; i < l.length; i++) {
				this.join(l[0], l[i]);
			}
			if (!sc.verify(',')) break;

		}
		if (sc.verify(']')) return true;
		this.clear(); return false;
	}
}
