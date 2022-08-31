/** @file ListSet.mjs 
 *
 * @author Jon Turner
 * @date 2021
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { assert } from '../../common/Errors.mjs';
import Scanner from './Scanner.mjs';

/** The ListSet class maintains a collection of disjoint lists defined
 *  over a set of integers 1..n. Each list in the collection is identified
 *  by its first item.
 */
export default class ListSet extends Top {
	#next;		// #next[i] is next item on list or 0 for last item
	#prev;		// #prev[i] is previous item on list or last for first item,
				// where last is the last item on the list

	constructor(n, capacity=n) {
		super(n);
		if (!capacity) capacity = this.n;
		this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n <= capacity);
		this.#next = new Int32Array(capacity+1);
		this.#prev = new Int32Array(capacity+1);
		// initialize to singleton lists
		this.#next.fill(0);
		for (let i = 0; i <= this.n; i++) {
			this.#prev[i] = i;
		}
		this.#prev[0] = 0;
	}

	reset(n, capacity=n) {
		assert(n <= capacity);
		this._n = n; this.#init(capacity);
	}

	/** Get the capacity of the list (max number of items it has space for). */
	get capacity() { return this.#next.length - 1; }

	expand(n) {
		if (n <= this.n) return;
		if (n > this.capacity) {
			let nu = new ListSet(this.n, Math.max(n, ~~(1.5 * this.capacity)));
			nu.assign(this); this.xfer(nu);
		}
		// make singletons from items in expanded range
		for (let i = this.n+1; i <= n; i++) {
			this.#next[i] = 0; this.#prev[i] = i;
		}
		this._n = n;
	}

	assign(ls) {
		if (ls == this) return;
		if (ls.n > this.capacity) this.reset(ls.n);
		else { this.clear(); this._n = ls.n; }
		for (let i = 1; i <= this.n; i++) {
			this.#next[i] = ls.#next[i]; this.#prev[i] = ls.#prev[i];
		}
	}
	xfer(ls) {
		if (ls == this) return;
		this._n = ls.n;
		this.#next = ls.#next; this.#prev = ls.#prev;
		ls.#next = ls.#prev = null;
	}
	
	/** Clear the data structure, moving all items into single node lists.
	*/
	clear() {
		for (let i = 1; i <= this.n; i++) {
			this.#next[i] = 0; this.#prev[i] = i;
		}
	}

	isfirst(i) { assert(this.valid(i)); return this.#next[this.#prev[i]] == 0; }
	
	/** Get the last item in a list.
	 *  @param f is the first item on a list.
	 *  @return the last item in the list
	 */
	last(f) {
		assert(this.isfirst(f));
		return this.#prev[f];
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
	 *  @return the item that precedes i in its list
	 */
	prev(i) {
		return (this.isfirst(i) ? 0 : this.#prev[i]);
	}

	/** Determine if an item is in a singleton list.
	 *  @param i is the index of an item
	 *  @return true if it is the only item in its list, else false
	 */
	singleton(i) {
		assert(this.valid(i));
		return this.#prev[i] == i;
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
		this.#next[this.last(f)] = f;
		this.#prev[f] = this.#prev[f];
		this.#next[this.#prev[i]] = 0;
		return i;
	}
	
	/** Remove an item from its list.
	 *  This method turns the deleted item into a singleton list.
	 *  @param i is an item in a list
	 *  @param f is the first item of a list
	 *  @return the first item of the modified list, or 0 if f was a singleton
	 */
	delete(i, f) {
		assert(this.valid(i) && this.valid(f) && this.isfirst(f));
		if (this.singleton(f)) return 0;
		let l = this.last(f); let nf = this.next(f);
		let pi = this.prev(i); let ni = this.next(i);
		if (i == f) {
			this.#prev[nf] = this.#prev[f]; f = nf;
		} else if (i == l) {
			this.#prev[f] = pi; this.#next[pi] = 0;
		} else {
			this.#prev[ni] = pi; this.#next[pi] = ni;
		}
		this.#next[i] = 0; this.#prev[i] = i;
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
		assert(this.isfirst(f1) && this.isfirst(f2));
		let l1 = this.last(f1); let l2 = this.last(f2);
		this.#next[l1] = f2;
		this.#prev[f2] = l1;
		this.#prev[f1] = l2
		return f1;
	}

	/** Split a list at an item. */
	split(f, i) {
		assert (this.valid(f) && this.valid(i) && this.isfirst(f));
		if (i == 0 || i == f) return;
		let p = this.prev(i); let s = this.next(i);
		this.#next[p] = s; this.#prev[s] = p;
		this.#next[i] = 0; this.#prev[i] = i;
	}

	/** Sort the lists by item number */
	sort() {
		let vec = [];
		for (let i = 1; i <= this.n; i++) {
			if (this.singleton(i) || !this.isfirst(i)) continue;
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

	/** Determine if two ListSet are equal.
	 *  @param ls is a second ListSet or a string representing a
	 *  ListSet object
	 *  @return true if the two ListSet objects contain identical lists.
	 */
	equals(ls) {
		if (this === ls) return true;
		if (typeof ls == 'string') {
			let s = ls; ls = new ListSet(this.n); ls.fromString(s);
		} else if (!(ls instanceof ListSet))
			return false;
		if (this.n != ls.n) return false;
		for (let i = 1; i < this.n; i++) {
			if (this.isfirst(i) != ls.isfirst(i)) return false;
			if (!this.isfirst(i)) continue;
			let j1 = i; let j2 = i;
			do {
				j1 = this.next(j1); j2 = ls.next(j2);
				if (j1 != j2) return false;
			} while (j1 != 0);
		}
		return true;
	}
	
	/** Produce a string representation of the object.
	 *  @param details causes singletons to be shown, when true
	 *  @param label is a function used to label list items
	 *  @param pretty causes lists to be separated with newlines
	 *  @return a string such as "[(a c) (d b g)]".
	 */
	toString(details=0, pretty=0, label=0) {
		let s = '';
		for (let l = 1; l <= this.n; l++) {
			if (!this.isfirst(l) || (this.singleton(l) && !details))
				continue;
			if (s.length > 0) s += (pretty ? '\n ' : ' ');
			s += '(';
			for (let i = l; i != 0; i = this.next(i)) {
				if (i != l) s += ' ';
				s += this.index2string(i, label);
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
		if (!sc.verify('[')) return false;

		let lists = []; let n = 0; let items = new Set();
		let l = sc.nextIndexList('(', ')');
		while (l != null) {
			for (let i of l) {
				n = Math.max(i, n);
				if (items.has(i)) return false;
				items.add(i);
			}
			lists.push(l);
			l = sc.nextIndexList('(', ')');
		}
		if (!sc.verify(']')) return false;

		if (n > this.n) this.reset(n);
		else this.clear();
		for (l of lists) {
			for (let i of l) {
				if (i != l[0]) this.join(l[0], i);
			}
		}
		return true;
	}
}
