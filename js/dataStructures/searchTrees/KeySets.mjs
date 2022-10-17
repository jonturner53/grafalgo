/** @file KeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import ListSet from '../basic/ListSet.mjs';
import BalancedForest from './BalancedForest.mjs';

/** This class implements a balanced binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class KeySets extends BalancedForest {
	#key;

	/** Constructor for KeySets object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n=10, capacity=n) {
		super(n,capacity);
		this.#key = new Float32Array(capacity+1);
	}

	/** Assign a new value by copying from another KeySets object.
	 *  @param ks is another KeySets object
	 */
	assign(ks) {
		if (ks == this || !(ks instanceof KeySets)) return;
		super.assign(ks);
		for (u = 1; u <= ks.n; u++) this.key(u, ks.key(u));
		this.clearStats();
	}
	
	/** Assign a new value by transferring from another KeySets.
	 *  @param ks is another KeySets object.
	 */
	xfer(ks) {
		if (ks == this || !(ks instanceof this.constructor)) return;
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
	search(k, t) { return super.search(k, t, this.#key);
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
	 *  @param prebal is an optional function that is called
	 *  after u is inserted into the tree but before the tree is rebalanced
	 *  @return the id of the set following insertion
	 */
	insert(u, t, prebal=0) {
		return super.insertByKey(u, t, this.#key, prebal);
	}
	
	/** Determine if two KeySets objects are equal.
	 *  @param other is a KeySets object to be compared to this
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
	
	/** Produce a string representation of the KeySets object.
	 *  @param fmt is an integer with low order bits specifying format options.
	 *    0b0001 specifies newlines between sets
	 *    0b0010 specifies that singletons be shown
	 *    0b0100 specifies that the underlying tree structure be shown
	 *    0b1000 specifies that the ranks be shown
	 *  default for fmt is 0b010
	 *  @param label is a function that is used to insert one or more
	 *  additional node fields following the key
	 *  numerical values, not letters.
	 */
	toString(fmt=0b010, label=0) {
		if (!label) {
			label = (x => this.x2s(x) + ':' + this.key(x) +
					 (fmt&0x8 ? ':' + this.rank(x) : ''));
		}
		return super.toString(fmt,label);
	}
	
	/** Initialize this KeySets object from a string.
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
