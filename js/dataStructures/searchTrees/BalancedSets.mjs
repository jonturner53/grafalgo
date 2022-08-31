/** @file BalancedSets.mjs
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
import SortedSets from './SortedSets.mjs';

/** This class implements a balanced binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class BalancedSets extends SortedSets {
	#rank;		 // #rank[u] is rank of u; used for balancing
	
	/** Constructor for BalancedSets object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, capacity=n) { super(n); this.#init(capacity); }
	
	/** Allocate space and initialize BalancedSets object.
	 *  @param capacity is the maximum range
	 */
	#init(capacity) {
		this.#rank = new Int8Array(capacity+1).fill(1);
		this.#rank[0] = 0;
	}

	/** Reset the tree discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=n) {
		super.reset(n, capacity); this.#init(capacity);
	}
	
	/** Assign a new value by copying from another BalancedSets.
	 *  @param b is another BalancedSets
	 */
	assign(b) {
		if (b == this) return;
		if (b.n > this.n) { reset(b.n, b.d); }
		else { clear(); this._n = b.n; }

		super.assign(b);
		for (u = 1; u <= b.n; u++)
			this.rank(u, b.rank(u));
	}

	/** Assign a new value by transferring from another BalancedSets.
	 *  @param b is another BalancedSets
	 */
	xfer(b) {
		if (b == this) return;
		if (!(b instanceof BalancedSets)) return;
		super.xfer(b);
		this.#rank = b.#rank; b.#rank = null;
	}
	
	/** Expand the space available for this BalancedSets.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this.capacity) {
			let nu = new BalancedSets(this.n,
									  Math.max(n, ~~(1.5 * this.capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this._n = n;
	}

	/** Convert all nodes to singleton trees. */
	clear() {
		super.clear(); this.#rank.fill(1); this.#rank[0] = 0;
	}

	clearStats() {
		super.clearStats();
		this._joinSteps = this._rebal1steps = this._rebal2steps = 0;
	}

	/** Get/set rank.
 	 *  @param u is a tree node
	 *  @param r is an optional argument; if present and !=0, it becomes
	 *  the new rank of u
	 *  @return the rank of u
	 */
	rank(u, r=-1) {
		if (r!=-1) this.#rank[u] = r;
		return this.#rank[u];
	}

	/** Insert an item into a set.
	 *  @param u is a singleton item to be inserted into a set
	 *  @param t is the id for a set (the root of the bst)
	 *  @return the id of the set following insertion
	 */
	insert(u, t) {
		this.rank(u,1);
		t = super.insert(u, t);
		this.rebalance1(u);
		return this.find(t);
	}

	/** Rebalance the tree after a node rank increases. 
	 *  @param x is a node whose rank may equal that of its grandparent, 
	 *  in violation of the rank invariant. 
	 */ 
	rebalance1(x) {
		let rx = this.rank(x);
		while (this.gp(x) != 0 && this.rank(this.gp(x)) == rx &&
								  this.rank(this.aunt(x)) == rx) {
			x = this.gp(x); rx = this.rank(x,rx+1); this.steps++;
		}
		if (rx != this.rank(this.gp(x))) return;
		if (this.outer(x)) this._rotate(this.p(x));
		else this._rotate2(x);
	}

	/** Delete an item from a set.
	 *  @param u is an item in a set
	 */
	delete(u) {
		let [c, pc] = super.delete(u);
		if (c != 0) this.rebalance2(c, pc);
	}

	_swap(u, v) {
		super._swap(u, v);
		let r = this.rank(u); this.rank(u, this.rank(v)); this.rank(v, r);
	}

	/** Rebalance the tree after a node rank decreases.
	 *  @param x is a node in a tree or 0
	 *  @param px is the parent of x, or a node with a null child, if x=0
	 *  in violation of the rank invariant.
	 */
	rebalance2(x, px) {
		let r = this.rank(x);
		while (this.rank(px) == r+2) {
			this.steps++;
			let sx, nefu, nece;
			if (x != 0) {
				sx = this.sibling(x); nefu= this.nephew(x); nece= this.niece(x);
			} else if (this.left(px) != 0) { // && x == 0
				sx = this.left(px); nefu = this.left(sx); nece = this.right(sx);
			} else { // x == 0 && right(px) != 0
				sx = this.right(px); nefu = this.right(sx); nece= this.left(sx);
			}
			if (this.rank(sx) == r+2) {
				this._rotate(sx);
				// rank(sibling(x) is now r+1, so on next iteration,
				// next case applies;
				// also, rank(p(x)) == rank(gp(x)) == r+2
			} else { // rank(sx) == r+1
				if (this.rank(nefu) == r && this.rank(nece) == r) {
					// if rank(px) == rank(gp(x)) == r+2, this is last step
					this.rank(px,r+1); x = px; px = this.p(x); r = this.rank(x);
				} else {
					if (this.rank(nefu) == r+1) this._rotate(sx);
					else			  			this._rotate2(nece);
					this.rank(px, r+1); this.rank(this.p(px), r+2);
					return;
				}
			}
		}
	}

	/** Join two trees a node.
	 *  @param t1 is a search tree
	 *  @param t2 is a second search tree
	 *  @param u is a node with key >= all keys in t1
	 *  and <= all keys in t2
	 *  @return root of new tree formed by joining t1, u and t2.
	 */
	join(t1, u, t2) {
		let r1 = this.rank(t1); let r2 = this.rank(t2);
		if (r1 == r2) {
			super.join(t1, u, t2); this.rank(u, r1+1);
			return u;
		} else if (r1 > r2) {
			let v = t1; let pv = 0;		// track parent in case t2==0
			while (this.rank(v) > r2) {
				pv = v; v = this.right(v); this.steps++;
			}
			// now, rank(v) == rank(t2)
			super.join(v, u, t2);
			this.right(pv, u); this.p(u, pv); this.rank(u, r2+1);
			this.p(t1,0);
			this.rebalance1(u);
			return this.find(t1);
		} else { // (r1 < r2)
			let v = t2; let pv = 0;		// track parent in case t1==0
			while (this.rank(v) > r1) {
				pv = v; v = this.left(v); this.steps++;
			}
			super.join(t1, u, v);
			this.left(pv, u); this.p(u, pv); this.rank(u, r1+1)
			this.p(t2,0);
			this.rebalance1(u);
			return this.find(t2);
		}
	}

	append(u,v) {
		if (this.rank(u) > this.rank(v)) {
			let z = this.last(u);
			let [t1,t2] = this.split(z);
			let x = this.join(t1,z,v);
			return x;
		} else {
			let a = this.first(v);
			let [t1,t2] = this.split(a);
			let x = this.join(u,a,t2);
			return x;
		}
	}

	/** Recursive helper for constructing a string representation of a tree.
	 *  @param u is a node in one of the trees of the heap
	 *  @param isroot is true if h is the canonical element of the heap
	 *  @return the string
	 */
	tree2string(u, details=0, pretty=0, label, isroot=1) {
		if (u == 0) return '';
		let s = '';
		if (this.left(u) == 0 && this.right(u) == 0) {
			s += this.index2string(u, label) + ':' + this.key(u) +
				 (details ? ':' + this.rank(u) : ''); 
			return (details || isroot && s.length > 0) ? '(' + s + ')' : s;
		}
		let ls = this.tree2string(this.left(u), details,pretty,label,0);
		let rs = this.tree2string(this.right(u), details,pretty,label,0);
		let cs = this.index2string(u, label) + ":" + this.key(u) +
				 (details ? ':' + this.rank(u) : '');
		if (isroot) cs = '*' + cs;
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
}
