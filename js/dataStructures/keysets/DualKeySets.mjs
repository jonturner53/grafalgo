/** @file DualKeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import Top from '../Top.mjs';
import ListSet from '../basic/ListSet.mjs';
import BalancedKeySets from './BalancedKeySets.mjs';

/** This class implements a balanced binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class DualKeySets extends BalancedKeySets {
	#key2;		 // #key2[u] is second key value
	#min2;		 // #min2[u] is the smallest key2 value in the subtree at u

	findminSteps;   // number of steps in findmin method
	renewSteps;    // number of steps in renew method
	
	/** Constructor for DualKeySets object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n=10, capacity=n) {
		super(n,capacity);
		this.#key2 = new Float32Array(capacity+1);
		this.#min2 = new Float32Array(capacity+1);
	}

	/** Assign a new value by copying from another DualKeySets.
	 *  @param b is another DualKeySets
	 */
	assign(b) {
		if (b == this || !(f instanceof DualKeySets)) return false;
		super.assign(b);
		for (u = 1; u <= b.n; u++) {
			this.key2(u, b.key2(u)); this.min2(u, b.min2(u));
		}
	}

	/** Assign a new value by transferring from another DualKeySets.
	 *  @param b is another DualKeySets
	 */
	xfer(b) {
		if (b == this) return;
		if (!(b instanceof DualKeySets)) return;
		super.xfer(b);
		this.#key2 = b.#key2; b.#key2 = null;
		this.#min2 = b.#min2; b.#min2 = null;
	}
	
	clearStats() {
		super.clearStats(); this.findminSteps = this.renewSteps = 0;
	}

	/** Get/set key2 value. */
	key2(u, k=false) {
		if (k !== false) {
			this.#key2[u] = k; this.renew(u);
		}
		return this.#key2[u];
	}

	/* Get/set min2 value */
	min2(u, k=false) {
		if (k !== false) this.#min2[u] = k;
		return this.#min2[u];
	}

	/** Find node with smallest key2 value among those with bounded primary key.
	 *  @param limit is a primary key value
	 *  @param t is the id of a set to search
	 *  @return item with smallest key2 value that has a key1 value <=limit.
	 */
	findmin(limit, t) {
		// first, find eligible subtrees on boundary and identify best one
		let u = t; let best = 0; let bestMin = 0;
		while (u != 0) {
			if (this.key(u) > limit) {
				u = this.left(u); continue;
			}
			// so, u defines an eligible subtree
			let l = this.left(u);
			if (best == 0 || bestMin > this.key2(u) ||
				(l != 0 && bestMin > this.min2(l))) {
				best = u; bestMin = Math.min(this.key2(u), this.min2(l));
			}
			u = this.right(u); // right subtree may contain eligible subtrees
		}
		if (best == 0) return 0;
		if (this.key2(best) == bestMin) return best;
		// target is in left subtree of best
		u = this.left(best);
		while (this.key2(u) != bestMin) {
			let l = this.left(u); let r = this.right(u);
				 if (l != 0 && this.min2(l) == bestMin) u = l;
			else if (r != 0 && this.min2(r) == bestMin) u = r;
		}
		return u;
	}
		
	/** Extend rotation operation to maintain min2 field. */
	rotate(x) {
		let y = this.p(x);
		if (y == 0) return;
		super.rotate(x);
		this.min2(x, this.min2(y));
		let m2 = this.key2(y);
		if (this.left(y) != 0)  m2 = Math.min(m2, this.min2(this.left(y)));
		if (this.right(y) != 0) m2 = Math.min(m2, this.min2(this.right(y)));
		this.min2(y, m2);
	}
		
	/** Insert an item into a set.
	 *  @param u is an item to be inserted
	 *  @param t is the id for a set (the root of the bst)
	 *  @return the id of the set following insertion
	 */
	insert(u, t) {
		return super.insert(u, t, u => this.renew(u));
	}

	/** Update min2 values along path to root.
	 *  @param u is a node defining a path to the root;
	 *  min2 values are renewed along this path
	 */
	renew(u) {
		while (u != 0) {
			this.renewSteps++;
			let m2 = this.key2(u);
			if (this.left(u) != 0)
				m2 = Math.min(m2, this.min2(this.left(u)));
			if (this.right(u) != 0)
				m2 = Math.min(m2, this.min2(this.right(u)));
			this.min2(u, m2);
			u = this.p(u);
		}
	}

	/** Delete an item from a set.
	 *  @param u is an item in a set
	 */
	delete(u) { super.delete(u, 0, pu => this.renew(pu)); }

	/** Extend swap operation to maintain key2, min2 fields. */
	swap(u, v) {
		super.swap(u, v);
		let k2 = this.key2(u);
		this.setkey2(u, this.key2(v)); this.setkey2(v, k2);
	}

	/** Extend join operation to maintain min2 field. */
	join(t1, u, t2) {
		return super.join(t1, u, t2, u => this.renew(u));
	}

	/** Determine if two DualKeySets objects are equal.
	 *  @param other is a DualKeySets object to be compared to this
	 *  @return true if both represent the same sets and the
	 *  keys match; otherwise return false
	 */
	equals(other) {
		let dk = super.equals(other);
		if (typeof dk == 'boolean') return dk;
		for (let u = 1; u <= this.n; u++) {
			if (this.key2(u) != dk.key2(u)) return false;
		}
		return dk;
	}

	/** Create a string representation of object.
	 *  @param fmt is an integer; its lower order bits define format options
	 *		000001 specifies newlines between sets
	 *		000010 specifies that singletons be shown
	 *		000100 specifies that the tree structure be shown
	 *		001000 specifies that the rank be shown
	 *      010000 specifies that min2 be shown
	 *  @param label is an optional function used to extend node labels
	 */
	toString(fmt=0x00, label=0) {
		if (!label) {
			label = (u => this.x2s(u)  + ':' + this.key(u) +
							':' + this.key2(u) +  
                            (fmt & 0b01000 ? ':' + this.min2(u) : '') +
                            (fmt & 0b10000 ? ':' + this.rank(u) : ''));
		}
		return super.toString(fmt,label);
	}

	/** Initialize this DualKeySets object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let ls = new ListSet();
		let key = []; let key2 = [];
		ls.fromString(s, (u,sc) => {
							if (!sc.verify(':')) return;
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return;
							key[u] = p;
							if (!sc.verify(':')) return;
							p = sc.nextNumber();
							if (Number.isNaN(p)) return;
							key2[u] = p;
						});
		if (ls.n != this.n) this.reset(ls.n);
		else this.clear();
		for (let u = 1; u <= ls.n; u++) {
			if (!ls.isfirst(u)) continue;
			this.key(u, key[u]); this.key2(u, key2[u]);
			let s = u;
			for (let i = ls.next(u); i; i = ls.next(i)) {
				this.key(i, key[i]); this.key2(i, key2[i]);
				s = this.insert(i,s);
			}
		}
		return true;
	}

	/** Return statistics object. */
	getStats() {
		let stats = super.getStats();
		stats.findminSteps = this.findminSteps;
		stats.renew = this.renewSteps;
		return stats;
	}

	verify() {
		for (let u = 1; u <= this.n; u++) {
			let m = this.key2(u);
			if (this.left(u)) m = Math.min(m,this.min2(this.left(u)));
			if (this.right(u)) m = Math.min(m,this.min2(this.right(u)));
			if (this.min2(u) != m) {
				return (
					`min2(${this.x2s(u)})=${this.min2(u)} but should be ` +
		    		`${m} (${this.left(u) ? this.min2(this.left(u)) : '-'}, ` +
				  	`${this.key2(u)}, ` +
				  	`${this.right(u) ? this.min2(this.right(u)) : '-'})`);
			}
			
		}
		return '';
	}
}
