/** @file DualkeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../common/Errors.mjs';
import Top from '../Top.mjs';
import Sets from '../basic/Sets.mjs';
import Scanner from '../basic/Scanner.mjs';
import BalancedSets from './BalancedSets.mjs';

/** This class implements a balanced binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class DualkeySets extends BalancedSets {
	#key2;		 ///< #key2[u] is second key value
	#min2;		 ///< #min2[u] is the smallest key2 value in the subtree at u

	_findminSteps;	///< number of steps in findmin method
	_fixupSteps;		///< number of steps in fixup method
	
	/** Constructor for DualkeySets object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, capacity=n) { super(n); this.#init(capacity); }
	
	/** Allocate space and initialize DualkeySets object.
	 *  @param capacity is the maximum range
	 */
	#init(capacity) {
		this.#key2 = new Float32Array(capacity+1);
		this.#min2 = new Float32Array(capacity+1);
	}

	/** Reset the tree discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=n) {
		super.reset(n, capacity); this.#init(capacity);
	}
	
	/** Assign a new value by copying from another DualkeySets.
	 *  @param b is another DualkeySets
	 */
	assign(b) {
		if (b == this) return;
		if (b.n > this.n) { reset(b.n, b.d); }
		else { clear(); this._n = b.n; }

		super.assign(b);
		for (u = 1; u <= b.n; u++) {
			this.key2(u, b.key2(u)); this.min2(u, b.min2(u));
		}
	}

	/** Assign a new value by transferring from another DualkeySets.
	 *  @param b is another DualkeySets
	 */
	xfer(b) {
		if (b == this) return;
		if (!(b instanceof DualkeySets)) return;
		super.xfer(b);
		this.#key2 = b.#key2; b.#key2 = null;
		this.#min2 = b.#min2; b.#min2 = null;
	}
	
	/** Expand the space available for this DualkeySets.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this.capacity) {
			let nu = new DualkeySets(this.n,
									  Math.max(n, ~~(1.5 * this.capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this._n = n;
	}

	clearStats() {
		super.clearStats(); this._findminSteps = this._fixupSteps = 0;
	}

	/** Get key2 value. */
	key2(u) { return this.#key2[u]; }

	/* Set key2 value */
	setkey2(u, k) {
		this.#key2[u] = k; this.fixup(u);
	}

	/* Get/set min2 value */
	min2(u, k=null) {
		if (k != null) this.#min2[u] = k;
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
		
	/** Perform a rotation in a search tree.
	 *  @param x is a node in some search tree; this method
	 *  moves x up into its parent's position
	 */
	rotate(x) {
		let y = this.p(x);
		if (y == 0) return;
		super.rotate(x);
		this.min2(x, this.min2(y));
		let m2 = this.key2(y);
		if (this.left(y) != 0)  m2 = Math.min(m2, this.min2(this.left(y)));
		if (this.right(y) != 0) m2 = Math.min(m2, this.min2(this.right(y)));
	}
		
	/** Insert an item into a set.
	 *  @param u is an item to be inserted
	 *  @param t is the id for a set (the root of the bst)
	 *  @return the id of the set following insertion
	 */
	insert(u, t) {
		t = this._insert(u, t);
		this.fixup(u);
		this.rebalance1(u);
		return this.find(t);
	}

	/** Update min2 values along path to root.
	 *  @param u is a node defining a path to the root;
	 *  min2 values are updated along this path
	 */
	fixup(u) {;
		while (u != 0) {
			this._fixupSteps++;
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
	delete(u) {
		let [c,pc] = this._delete(u);
		this.fixup(pc);
		if (c != 0) this.rebalance2(c, pc);
	}

	/** Swap positions of two nodes in a bst. */
	swap(u, v) {
		super.swap(u, v);
		let k2 = this.key2(u);
		this.setkey2(u, this.key2(v)); this.setkey2(v, k2);
	}

	/** Join two trees at a node.
	 *  @param t1 is a search tree
	 *  @param t2 is a second search tree
	 *  @param u is a node with key >= all keys in t1
	 *  and <= all keys in t2
	 *  @return root of new tree formed by joining t1, u and t2.
	 */
	join(t1, u, t2) {
		super.join(t1, u, t2); this.fixup(u);
	}

	/** Determine if two DualkeySets objects are equal.
	 *  @param bst is a DualkeySets object to be compared to this
	 *  @return true if both represent the same sets and the
	 *  keys match; otherwise return false
	 */
	equals(bst) {
		if (this === bst) return true;
		if (typeof bst == 'string') {
			let s = bst; bst = new DualkeySets(this.n); bst.fromString(s);
		}
		if (!(bst instanceof DualkeySets) || bst.n != this.n)
			return false;
		let s1 = new Sets(this.n); let s2 = new Sets(this.n);
		for (let u = 1; u <= this.n; u++) {
			if (this.key(u) != bst.key(u)) return false;
			if (this.key2(u) != bst.key2(u)) return false;
			if (this.p(u) != 0) {
				let fu = s1.find(u); let fp = s1.find(this.p(u));
				if (fu != fp) s1.link(fu, fp);
			}
			if (bst.p(u) != 0) {
				let fu = s2.find(u); let fp = s2.find(bst.p(u));
				if (fu != fp) s2.link(fu, fp);
			}
		}
		return s1.equals(s2);
	}
	
	/** Recursive helper for constructing a string representation of a tree.
	 *  @param u is a node in one of the trees of the heap
	 *  @param isroot is true if h is the canonical element of the heap
	 *  @return the string
	 */
	tree2string(u, details=false, pretty=false, label, isroot=true) {
		if (u == 0) return '';
		let s = '';
		if (this.left(u) == 0 && this.right(u) == 0) {
			s += this.index2string(u, label) + ':' + this.key(u) +
				 ':' + this.key2(u) + (details ? ':' + this.min2(u) : ''); 
			return (details || isroot && s.length > 0) ? '(' + s + ')' : s;
		}
		let ls = this.tree2string(this.left(u), details,pretty,label,false);
		let rs = this.tree2string(this.right(u), details,pretty,label,false);
		let cs = this.index2string(u, label) + ":" + this.key(u) +
				 ':' + this.key2(u) + (details ? ':' + this.min2(u) : '');
		if (details && isroot) cs = '*' + cs;
		if (ls.length > 0) {
			s += ls;
		} if (cs.length > 0) {
			if (ls.length > 0) s += ' ';
			s += cs;
		}
		if (rs.length > 0) {
			if (ls.length > 0 || cs.length > 0) s += ' ';
			s += rs;
		}
		return (isroot || details) ? '(' + s + ')' : s;
	}

	/** Initialize this DualkeySets object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let n = 0; let sets = []; let items = new Set();
		for (let l= sc.nextIndexList('(',')',2); l;
				 l= sc.nextIndexList('(',')',2)) {
			for (let [i,k1,k2] of l) {
				n = Math.max(n,i);
				if (items.has(i)) return null;
				items.add(i);
			}
			sets.push(l);
		}
		if (!sc.verify('}')) return false;
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let l of sets) {
			let s = l[0][0];
			for (let [i,k1,k2] of l) {
				this.setkey(i, k1); this.setkey2(i,k2); s = this.insert(i, s);
			}
		}
		return true;
	}

	/** Return statistics object. */
	getStats() {
		let stats = super.getStats();
		stats.findminSteps = this._findminSteps;
		stats.fixupSteps = this._fixupSteps;
		return stats;
	}
}
