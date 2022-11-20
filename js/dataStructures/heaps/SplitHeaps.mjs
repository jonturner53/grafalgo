/** @file SplitHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import BalancedForest from '../graphs/BalancedForest.mjs';
import Scanner from '../basic/Scanner.mjs';

/** This class implements a data structure consisting of a disjoint
 *  set of splittable heaps. The items in each heap have a key, but
 *  also have a total ordering that is independent of the keys.
 *  One can iterate through the items in the defined order and
 *  insert items relative to another in a heap.
 */
export default class SplitHeaps extends BalancedForest {
	#key;           // #key[i] is key of item i
	#minkey;        // #minkey[i] is smallest key within subtree at i 
	#offset;		// offset[h] is a key offset for heap h

	/** Constructor for SplitHeaps object.
	 *  @param n is index range for object
	 */
	constructor(n=10) {
		super(n);
		this.#key = new Float32Array(this.n+1)
		this.#minkey = new Float32Array(this.n+1)
		this.#offset = new Float32Array(this.n+1)
	}

	/** Assign a new value by copying from another heap.
	 *  @param lh is another SplitHeaps object
	 */
	assign(sh) {
		if (sh == this || (!sh instanceof SplitHeaps)) return;
		if (sh.n != this.n) this.reset(sh.n);
		else this.clear();

		for (let h = 1; h <= sh.n; h++) {
			if (sh.p(h)) continue;
			let hh = sh.first(h);
			for (let u = sh.next(hh); u; u = sh.next(u))
				hh = this.insertAfter(u, hh, sh.prev(u), sh.key(u,h));
		}
		this.clearStats();
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(sh) {
		if (sh == this) return;
		super.xfer(sh);
		this.#key = sh.#key; this.#minkey = sh.#minkey;
		this.#offset = sh.#offset;
		sh.#key = sh.#minkey = sh.#offset = null;
		this.clearStats();
	}

	/** Revert to initial state. */
	clear(h=0) {
		super.clear(h);
		if (!h) {
			this.#key.fill(0); this.#minkey.fill(0); this.#offset.fill(0);
		}
	}

	/** Get key of a heap item. */
	key(i, h=super.find(i)) {
		return this.#key[i] + this.#offset[h];
	}

	/** Return the item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @return the item in h that has the smallest key
	 */
	findmin(h) {
		let i = h;
		while (i) {
			let l = this.left(i); let r = this.right(i);
			if (this.#key[i] == this.#minkey[i]) return i;
			i = (!l ? r : (!r ? l :
					(this.#minkey[l] < this.#minkey[r] ? l : r)));
			this.steps++;
		}
		fassert(false, `program error in SplitHeaps.findmin(${this.x2s(h)})`);
	}

	/** Extend rotation operation to maintain minkey field. */
	rotate(x) {
		let y = this.p(x);
		if (y == 0) return;
		super.rotate(x);
		this.#minkey[x] = this.#minkey[y]; 
		let min = this.#key[y];
		let l = this.left(y); let r = this.right(y);
		if (l)  min = Math.min(min, this.#minkey[l]);
		if (r) min = Math.min(min, this.#minkey[r]);
		this.#minkey[y] = min;
		if (!this.p(x)) this.#offset[x] = this.#offset[y];
	}

	add2keys(delta, h) { this.#offset[h] += delta; }

	/** Update minkey fields, following a change to an item. */
	update(i) {
		while (i) {
			let min = this.#key[i];
			let l = this.left(i); let r = this.right(i);
			if (l) min = Math.min(min, this.#minkey[l]);
			if (r) min = Math.min(min, this.#minkey[r]);
			this.#minkey[i] = min;
			i = this.p(i);
			this.steps++;
		}
	}

	/** Insert item into a heap. 
	 *  @param i is a singleton
	 *  @param h is a heap into which i is to be inserted.
	 *  @param j is an item in h; item i is inserted immediately after j in the
	 *  linear ordering of the heap items; if j=0, i is inserted before the
	 *  first item in the heap.
	 *  @param k is the key under which i is inserted
	 *  @return the id of the modified heap
	 */
	insertAfter(i, j, k, h=this.find(j)) {
		fassert(this.valid(i) && this.valid(j) && this.valid(h));
		let offset = this.#offset[h]; this.#key[i] = k - offset;
		h = super.insertAfter(i, j, h, i => this.update(i));
		this.#offset[h] = offset;
		return h;
	}

	/** Delete a node from a heap.
	 *  @param u is a node in a heap
	 *  @param h is the heap containing u
	 *  @return
	delete(u, h=this.find(u)) {
		if (this.singleton(u)) return;
		let offset = this.#offset[h];
		// identify a node near the root that is not u
		let hh = (u != h ? h : (this.left(h) ? this.left(h) : this.right(h)));
		super.delete(u, pu => this.update(pu));
		hh = this.find(hh);
		this.#offset[hh] = this.#offset[u] = offset;
		return hh;
	}

	/** Divide a heap before a specified item.
	 *  @param i is an item
	 *  @param h is the heap containing i
	 *  @returns [h1,h2] where h1 is the heap consisting of the items
	 *  that come before i in h and h2 is the heap consisting
	 *  of i and the items that come after it
	 */
	splitHeap(i, h=this.find(i)) {
		let offset = this.#offset[h];
		let [h1,h2] = super.split(i);
		this.#minkey[i] = Math.min(this.#key[i], this.#minkey[h2]);
		h2 = super.join(0,i,h2);
		this.#offset[h1] = this.#offset[h2] = offset;
		return [h1,h2];
	}

	/** Determine if two SplitHeaps objects are equal.
	 *  @param other is another SplitHeaps to be compared to this,
	 *  or a string representing an SplitHeaps object.
	 *  @return true, false or an object
	 */
	equals(other) {
		let sh = super.listEquals(other);
        if (typeof sh == 'boolean') return sh;
		for (let i = 1; i <= this.n; i++) {
			if (this.key(i,this.find(i)) != sh.key(i,this.find(i)))
				return false;
		}
		return sh;
	}

	/** Produce a string representation of the SplitHeap object.
	 *  @param fmt is an integer with low order bits specifying format options.
	 *    0b0001 specifies newlines between sets
	 *    0b0010 specifies that singletons be shown
	 *    0b0100 specifies that the underlying tree structure be shown
	 *    0b1000 specifies that the ranks be shown
	 *  @param label is an optional function used to generate the label for
	 *  the heap item; if omitted x2s() is used
	 *  default for fmt is 0b010
	 */
	toString(fmt=0b010,label=0) {
		if (!label) {
			label = (x => this.x2s(x) + (':' + this.key(x)) +
						  ((fmt&0x8) ? ':'+this.rank(x) : ''));
		}
		return super.toString(fmt,label);
	}

	/** Initialize this SplitHeaps object from a string.
	 *  @param s is a string representing a heap.
	 *  @return true on success, else false
	 */
	fromString(s) {
		let ls = new ListSet(); let key = [];
		ls.fromString(s, (u,sc) => {
							if (!sc.verify(':')) return;
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return;
							key[u] = p;
						});
		if (ls.n != this.n) this.reset(ls.n);
		else this.clear();
		for (let u = 1; u <= ls.n; u++) {
			if (!ls.isfirst(u)) continue;
			this.#key[u] = key[u];
			this.#minkey[u] = key[u];
			let h = u; let pi = u;
			for (let i = ls.next(u); i; i = ls.next(i)) {
				h = this.insertAfter(i, pi, key[i], h);
				pi = i;
			}
		}
		return true;
	}
}
