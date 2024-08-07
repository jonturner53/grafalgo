/** @file DualKeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import ListSet from '../basic/ListSet.mjs';
import KeySets from './KeySets.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** This class implements a key set with two integer keys.
 *  The primary key is the usual one. The data structure supports
 *  an efficient findmin operation on the secondary key, where
 *  the search is limited to those items with a primary key
 *  value less than or equal to a specified bound.
 */
export default class DualKeySets extends KeySets {
	Key2;		 // Key2[u] is second key value
	Min2;		 // Min2[u] is the smallest key2 value in the subtree at u

	/** Constructor for DualKeySets object.
	 *  @param n is index range for object
	 */
	constructor(n=10) {
		super(n);
		this.Key2 = new Array(this.n+1);
		this.Min2 = new Array(this.n+1);
	}

	/** Assign a new value by copying from another DualKeySets.
	 *  @param that is another DualKeySets
	 */
	assign(that) {
		if (that == this || !(f instanceof DualKeySets)) return false;
		super.assign(that);
		for (u = 1; u <= that.n; u++) {
			this.key2(u, that.key2(u)); this.min2(u, that.min2(u));
		}
	}

	/** Assign a new value by transferring from another DualKeySets.
	 *  @param that is another DualKeySets
	 */
	xfer(that) {
		if (that == this) return;
		if (!(that instanceof DualKeySets)) return;
		super.xfer(that);
		this.Key2 = that.Key2; that.Key2 = null;
		this.Min2 = that.Min2; b.Min2 = null;
	}
	
	clearStats() {
		super.clearStats(); this.findminSteps = this.refreshSteps = 0;
	}

	/** Get/set key2 value. */
	key2(u, k=false) {
		if (k !== false) {
			// assumes u is a singleton
			this.Key2[u] = k; this.Min2[u] = k;
		}
		return this.Key2[u];
	}

	/* Get/set min2 value */
	min2(u, k=false) {
		if (k !== false) this.Min2[u] = k;
		return this.Min2[u];
	}

	/** Find node with smallest key2 value among those with bounded primary key.
	 *  @param t is the id of a set to search
	 *  @param limit is a primary key value or Infinity
	 *  @return item with smallest key2 value that has a key1 value <=limit.
	 */
	findmin(t, limit=Infinity) {
		// first, find eligible subtrees on boundary and identify best one
		let u = t; let best = 0; let bestMin = 0;
		while (u) {
			let l = this.left(u); this.steps++;
			if (this.key(u) > limit) {
				u = l; continue;
			}
			// so, u and its left subtree are eligible
			let b = (l ? Math.min(this.key2(u), this.min2(l)) : this.key2(u));
			if (!best || b < bestMin) {
				best = u; bestMin = b;
			}
			u = this.right(u); // right subtree may contain boundary subtrees
		}
		if (!best) return 0;
		if (this.key2(best) == bestMin) return best;
		// target is in left subtree of best
		u = this.left(best);
		while (this.key2(u) != bestMin) {
			let l = this.left(u); let r = this.right(u);
				 if (l && this.min2(l) == bestMin) u = l;
			else if (r && this.min2(r) == bestMin) u = r;
			this.steps++;
		}
		return u;
	}
		
	/** Extend rotation operation to maintain min2 field. */
	rotate(x) {
		let y = this.p(x);
		if (y == 0) return;
		super.rotate(x);
		this.min2(x, this.min2(y));
		this.update2(y);
	}
		
	/** Insert an item into a set.
	 *  @param u is an item to be inserted
	 *  @param t is the id for a set (the root of the bst)
	 *  @return the id of the set following insertion
	 */
	insert(u, t) {
		return super.insert(u, t, u => this.refresh(u));
	}

	/** Update min2 values along path to root.
	 *  @param u is a node defining a path to the root;
	 *  min2 values are refreshed along this path
	 */
	refresh(u) {
		while (u != 0) {
			this.update2(u);
			u = this.p(u);
			this.steps++;
		}
	}

	update2(u) {
		let l = this.left(u); let r = this.right(u);
		let m2 = this.key2(u);
		if (l)
			m2 = (m2 <= this.min2(l) ?  m2 : this.min2(l));
		if (r)
			m2 = (m2 <= this.min2(r) ?  m2 : this.min2(r));
		this.min2(u, m2);
	}

	/** Delete an item from a set.
	 *  @param u is an item in a set
	 */
	delete(u) { super.delete(u, 0, pu => this.refresh(pu)); }

	/** Extend swap operation to maintain key2, min2 fields. */
	swap(u, v) {
		super.swap(u, v);
		let k2 = this.key2(u);
		this.key2(u, this.key2(v)); this.key2(v, k2);
	}

	/** Extend join operation to maintain min2 field. */
	join(t1, u, t2) {
		return super.join(t1, u, t2, u => this.refresh(u));
	}

	/** Determine if two DualKeySets objects are equal.
	 *  @param that is a DualKeySets object to be compared to this
	 *  @return true if both represent the same sets and the
	 *  keys match; otherwise return false
	 */
	equals(that) {
		that = super.listEquals(that);
		if (typeof that == 'boolean') return that;
		for (let u = 1; u <= this.n; u++) {
			if (this.key2(u) != that.key2(u)) return false;
		}
		return that;
	}

	/** Create a string representation of object.
	 *  @param fmt is an integer; its lower order bits define format options
	 *		000001 specifies newlines between sets
	 *		000010 specifies that singletons be shown
	 *		000100 specifies that the tree structure be shown
	 *		001000 specifies that min2 be shown
	 *  @param label is an optional function used to extend node labels
	 */
	toString(fmt=0x00, label=0) {
		if (!label) {
			label = (u => {
						let s = `${this.x2s(u)}:${this.key(u)}:${this.key2(u)}`;
						if ((fmt&8) && (fmt&4) && (this.min2(u)!=this.key2(u)))
							s += `:${this.min2(u)}`;
						return s;
					});
		}
		return super.toString(fmt&7,label);
	}

	/** Initialize this DualKeySets object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let ls = new ListSet();
		let key = []; let key2 = [];
		if (!ls.fromString(s, (u,sc) => {
							if (!sc.verify(':',0)) return false;
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return false;
							key[u] = p;
							if (!sc.verify(':',0)) return false;
							p = sc.nextNumber();
							if (Number.isNaN(p)) return false;
							key2[u] = p;
							return true;
						}))
			return false;
		if (ls.n != this.n) this.reset(ls.n);
		else this.clear();
		for (let u = 1; u <= ls.n; u++) {
			if (!ls.isfirst(u)) continue;
			this.key(u, key[u]);
			this.key2(u, key2[u]); this.min2(u, key2[u]);
			let s = u;
			for (let i = ls.next(s); i; i = ls.next(i)) {
				this.key(i, key[i]);
				this.key2(i, key2[i]); this.min2(i, key2[i]);
				s = this.insert(i,s);
			}
		}
		return true;
	}

	verify() {
		for (let u = 1; u <= this.n; u++) {
			let m = this.key2(u);
			if (this.left(u))
				m = (m < this.min2(this.left(u)) ?
						 m : this.min2(this.left(u)));
			if (this.right(u))
				m = (m < this.min2(this.right(u)) ?
						 m : this.min2(this.right(u)));
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
