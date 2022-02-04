/** @file ReverseLists.mjs 
 *
 * @author Jon Turner
 * @date 2021
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { assert } from '../../common/Errors.mjs';
import Scanner from './Scanner.mjs';

/** The ReverseLists class maintains a collection of disjoint lists defined
 *  over a set of integers 1..n. It supports constant time list-reversal,
 *  by swapping the role of the next/prev pointers.
 */
export default class ReverseLists extends Top {
	#nabor1;		// nabor1[i] is one of the neighbors of i in its list
	#nabor2;		// nabor2[i] is the other neighbor of i in its list

	constructor(n, capacity=n) {
		super(n);
		if (!capacity) capacity = this.n;
		this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n <= capacity);
		this.#nabor1 = new Int32Array(capacity+1);
		this.#nabor2 = new Int32Array(capacity+1);
		// initialize to singleton lists
		for (let i = 0; i <= this.n; i++) {
			this.#nabor1[i] = 0; this.#nabor2[i] = -i;
		}
		this.#nabor2[0] = 0;
	}

	reset(n, capacity=n) {
		assert(n <= capacity);
		this._n = n; this.#init(capacity);
	}

	/** Get the capacity. (max number of items it has space for). */
	get _capacity() { return this.#nabor1.length - 1; }

	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new ReverseLists(this.n,
				Math.max(n, ~~(1.5*this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		// make singletons from items in expanded range
		for (let i = this.n+1; i <= n; i++) {
			this.#nabor1[i] = 0; this.#nabor2[i] = -i;
		}
		this._n = n;
	}

	assign(dl) {
		if (dl == this) return;
		if (dl.n > this.capacity) this.reset(dl.n);
		else { this.clear(); this._n = dl.n; }
		for (let i = 1; i <= this.n; i++) {
			this.#nabor1[i] = dl.#nabor1[i]; this.#nabor2[i] = dl.#nabor2[i];
		}
	}

	xfer(dl) {
		if (dl == this) return;
		this._n = dl.n;
		this.#nabor1 = dl.#nabor1; this.#nabor2 = dl.#nabor2;
		dl.#nabor1 = dl.#nabor2 = null;
	}
	
	/** Clear the data structure, moving all items into singletons.
	*/
	clear() {
		for (let i = 1; i <= this.n; i++) {
			this.#nabor1[i] = 0; this.#nabor2[i] = -i;
		}
	}

	isFirst(i) { return this.#nabor1[i] < 0 || this.#nabor2[i] < 0; }

	isLast(i) { return this.#nabor1[i] == 0 || this.#nabor2[i] == 0; }
	
	/** Get the last item in a list.
	 *  @param f is the first item in a list
	 *  @return the last item in the list
	 */
	last(f) {
		assert(this.valid(f) && this.isFirst(f));
		return this.#nabor1[f] < 0 ? -this.#nabor1[f] : -this.#nabor2[f];
	}

	/** Get the next list item.
	 *  @param i is a list item
	 *  @param j is the list item preceding i, or 0 if i is the first item.
	 *  @return the pair [next(i), i] where next(i) is next list item or 0.
	 */
	next(i, j) {
		assert(this.valid(i) && i != 0 && this.valid(j));
		let n1 = this.#nabor1[i]; let n2 = this.#nabor2[i];
		return [j == 0 ? (n1 >= 0 ? n1 : n2) :
			   			 (j == n1 ? n2 : n1), i];
	}
	
	/** Get the previous list item.
	 *  @param i is a list item
	 *  @param j is the list item following i, or 0 if i is the last item.
	 *  @return the item that precedes j on the list, or 0 if j is the first
	 *  item.
	 */
	prev(i, j) {
		assert(this.valid(i));
		if (this.isFirst(i)) return [0, i];
		let n1 = this.#nabor1[i]; let n2 = this.#nabor2[i];
		return [j == 0 ? (n1 != 0 ? n1 : n2) :
					     (j == n1 ? n2 : n1), i];
	}

	/** Determine if an item is in a singleton list.
	 *  @param i is the index of an item
	 *  @return true if it is the only item in its list, else false
	 */
	singleton(i) {
		assert(this.valid(i));
		return this.#nabor1[i] == -i || this.#nabor2[i] == -i;
	}
	
	/** Remove the first item from a list.
	 *  @param f is the first item in a list
	 *  @return the first item of the modified list, or 0 if it was a singleton
	 */
	pop(f) {
		assert(this.valid(f) && this.isFirst(f));
		if (this.singleton(f)) return 0;
		let s;
		if (this.#nabor1[f] < 0) {
			s = this.#nabor2[f];
			if (f == this.#nabor1[s]) this.#nabor1[s] = this.#nabor1[f];
			else this.#nabor2[s] = this.#nabor1[f];
		} else { // this.#nabor2[f] < 0
			s = this.#nabor1[f];
			if (f == this.#nabor1[s]) this.#nabor1[s] = this.#nabor2[f];
			else this.#nabor2[s] = this.#nabor2[f];
		}
		this.#nabor1[f] = 0; this.#nabor2[f] = -f;
		return s;
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

	/** Determine if two ReverseLists objects are equal.
	 *  @param dl is a second ReverseLists object or a string representing one
	 *  @return true if the two objects contain identical lists.
	 */
	equals(dl) {
		if (this === dl) return true;
		if (typeof dl == 'string') {
			let s = dl; dl = new ReverseLists(this.n); dl.fromString(s);
		} else if (!(dl instanceof ReverseLists))
			return false;
		if (this.n != dl.n) return false;
		for (let i = 1; i < this.n; i++) {
			if (this.isFirst(i) != dl.isFirst(i)) return false;
			if (!this.isFirst(i)) continue;
			let j1 = i; let k1 = 0; let j2 = i; let k2 = 0;
			do {
				[j1, k1] = this.next(j1, k1);
				[j2, k2] = this.next(j2, k2);
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
			for (let i = l; i != 0; [i, j] = this.next(i,j)) {
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
			if (!sc.verify(',')) break;
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
