/** @file SimpleKeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import ListSet from '../basic/ListSet.mjs'
import BinaryForest from '../graphs/BinaryForest.mjs';

/** This class implements a generic binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class SimpleKeySets extends BinaryForest {
	#key;

	/** Constructor for SimpleKeySets object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n=10, capacity=n) {
		super(n,capacity);
		this.#key = new Float32Array(this.capacity+1);
	}
	
	/** Assign a new value by copying from another SimpleKeySets object.
	 *  @param ks is another SimpleKeySets object
	 */
	assign(ks) {
		if (ks == this || !(ks instanceof SimpleKeySets)) return;
		super.assign(ks);
		for (u = 1; u <= ks.n; u++) this.key(u, ks.key(u));
		this.clearStats();
	}
	
	/** Assign a new value by transferring from another SimpleKeySets.
	 *  @param ks is another SimpleKeySets object.
	 */
	xfer(ks) {
		if (ks == this) return;
		if (!(ks instanceof this.constructor)) return;
		super.xfer(ks);
		this.#key = ks.#key; ks.#key = null;
		this.clearStats();
	}
	
	/** Get or set the key value of a node. */
	key(u, k=null) {
		if (k != null) this.#key[u] = k;
		return this.#key[u];
	}
	
	/** Find an item with a specified key
	 *  @param k is key to be found
	 *  @param t is id (root) of bst
	 *  @return node u where key(u)==k or 0 if there is no such node
	 */
	access(k, t) {
		let u = t;
		while (u != 0 && this.key(u) != k) {
			this.steps++;
			if (k < this.key(u)) u = this.left(u);
			else				 u = this.right(u);
		}
		return u;
	}
	
	/** Insert an item into a set.
	 *  @param u is an item to be inserted
	 *  @param t is the id for a set (the root of its tree)
	 *  @return the id of the set following insertion
	 */
	insert(u, t) {
		fassert(this.valid(u) && this.singleton(u) && (t == 0 || this.valid(t)));
		if (t == 0 || t == u) return u;
		let v = t; let pv = 0;
		while (v != 0) {
			pv = v; this.steps++;
			if (this.key(u) <= this.key(v)) v = this.left(v);
			else							v = this.right(v);
		}
		this.link(u, pv, this.key(u) <= this.key(pv) ? -1 : +1);
		return t;
	}
	
	/** Determine if two SimpleKeySets objects are equal.
	 *  @param other is a SimpleKeySets object to be compared to this
	 *  @return true if both represent the same sets and the
	 *  keys match; otherwise return false
	 */
	equals(other) {
		let ks = super.listEquals(other);
		if (typeof ks == 'boolean') return ks;
		for (let u = 1; u <= this.n; u++) {
			if (this.key(u) != ks.key(u)) return false;
		}
		return ks;
	}
	
	/** Produce a string representation of the SimpleKeySets object.
	 *  @param fmt is an integer with low order bits specifying format options.
	 *    0b001 specifies newlines between sets
	 *    0b010 specifies that singletons be shown
	 *    0b100 specifies that the underlying tree structure be shown
	 *  default for fmt is 0b010
	 *  @param label is a function that is used to label heap items
	 *  numerical values, not letters.
	 */
	toString(fmt=0b010, label=0) {
		if (!label) label = (x => this.x2s(x) + ':' + this.key(x));
		return super.toString(fmt, label);
	}
	
	/** Initialize this SimpleKeySets object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
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
			this.key(u, key[u]);
			let s = u;
			for (let i = ls.next(u); i; i = ls.next(i)) {
				this.key(i, key[i]); s = this.insert(i,s);
			}
		}
		return true;
	}
}
