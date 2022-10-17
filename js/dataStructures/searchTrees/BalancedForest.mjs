/** @file BalancedForest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import Scanner from '../basic/Scanner.mjs';
import BinaryForest from '../graphs/BinaryForest.mjs';

/** This class implements a balanced version of the binary tree class. */
export default class BalancedForest extends BinaryForest {
	#rank;		// #rank[u] is an optional field used to maintain tree balance

	/** Constructor for BinaryForest object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n=10, capacity=n) {
		super(n, capacity);
		this.#rank = new Int8Array(this.capacity+1).fill(1,1);
	}

	/** Assign a new value by copying from another BinaryForest.
	 *  @param f is another BinaryForest
	 */
	assign(f) {
		if (f == this) return;
		if (!(f instanceof BalancedForest)) return;
		super.assign(f);
		for (u = 1; u <= f.n; u++) this.rank(u, f.rank(u));
	}

	/** Assign a new value by transferring from another BinaryForest.
	 *  @param f is another BinaryForest
	 */
	xfer(f) {
		if (f == this) return;
		if (!(f instanceof BalancedForest)) return;
		super.xfer(f);
		this.#rank = f.#rank; f.#rank = null;
	}
	
	/** Convert all nodes to singleton trees. */
	clear() { super.clear(); this.#rank.fill(1,1); }

	/* Get or set the rank child of a node.
	 * @param u is a node
	 * @param r is an optional new rank for u
	 * @return the rank of u
	 */
	rank(u, r=-1) {
		if (r >= 0) this.#rank[u] = r;
		return this.#rank[u];
	}

	/** Insert a node based on a key value.
	 *  @param u is a singleton node
	 *  @param t is the root of the tree containing u
	 *  @param key is an array mapping nodes to key values;
	 *  @param prebal is an optional function, which is called
	 *  with argument u after u is inserted but before rebalancing.
	 *  @return the root of the modified tree
	 */
	insertByKey(u, t, key, prebal=0) {
		t = super.insertByKey(u, t, key);
		if (prebal) prebal(u);
		this.rerankUp(u);
		return this.find(t);
	}

	/** Delete a node from a tree.
	 *  @param u is a non-singleton tree node.
	 *  @param prebal is an optional function that is called before
	 *  reblancing, with argument pu, where pu is the parent of the
	 *  node that took u's place in the tree.
	 */
	delete(u, prebal=0) {
		let [c,pc] = super.delete(u);
		if (prebal) prebal(pc);
		this.rerankDown(c,pc);
	}

	/** Join two trees (or subtrees) at a node.
	 *  @param t1 is a tree
	 *  @param u is a node
	 *  @param t2 is a second tree (likewise)
	 *  @return root of new tree (or subtree) formed by joining t1, u and t2.
	 */
	join(t1, u, t2) {
		let r1 = this.rank(t1); let r2 = this.rank(t2);
		if (r1 == r2) {
			let t = super.join(t1,u,t2); this.rank(t, r1+1);
			return t;
		}
		if (r1 > r2) {
			let v = t1; let pv = 0;		// track parent in case t2==0
			while (this.rank(v) > r2) {
				pv = v; v = this.right(v); this.steps++;
			}
			// now, rank(v) == rank(t2)
			super.join(v, u, t2);
			this.link(u,pv,+1); this.rank(u, r2+1);
			this.p(t1,0);
			this.rerankUp(u);
			let t =  this.find(t1);
			return t;
		} else { // (r1 < r2)  mirror of first case
			let v = t2; let pv = 0;		// track parent in case t1==0
			while (this.rank(v) > r1) {
				pv = v; v = this.left(v); this.steps++;
			}
			super.join(t1, u, v);
			this.link(u,pv,-1); this.rank(u, r1+1)
			this.p(t2,0);
			this.rerankUp(u);
			let t = this.find(t2);
			return t;
		}
	}

	/** Adjust ranks after a node rank increases, leading to a violation
	 *  of the rank invariant; may do up to two rotations, as well;
	 *  assumes that other nodes satisfy the invariant.
	 *  @param x is a node whose rank may equal that of its grandparent, 
	 *  in violation of the rank invariant for balanced trees.
	 */ 
	rerankUp(x) {
		let rx = this.rank(x);
		while (this.gp(x) != 0 && this.rank(this.gp(x)) == rx &&
								  this.rank(this.aunt(x)) == rx) {
			x = this.gp(x); rx = this.rank(x,rx+1); this.steps++;
		}
		if (this.gp(x) == 0 || rx != this.rank(this.gp(x)))
			return;
		// rank(gp(x)) = rank(x) and rank(aunt(x)) = rank(x)-1
		if (this.outerGrandchild(x)) this.rotate(this.p(x));
		else this.rotate2(x);
	}

	/** Adjust ranks after the rank of a node decreases, leading to a
	 *  violation in the rank invariant; may do up to two rotations;
	 *  assumes that other nodes satisfy the invariant.
	 *  @param x is a node in a tree or 0; the rank at x may be too small
	 *  for its parent (by 1).
	 *  @param px is the parent of x, or a node with a null child, if x=0
	 */
	rerankDown(x, px) {
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
				this.rotate(sx);
				// rank(sibling(x)) is now r+1, so on next iteration,
				// next case applies;
				// also, rank(p(x)) == rank(gp(x)) == r+2
			} else { // rank(sx) == r+1
				if (this.rank(nefu) == r && this.rank(nece) == r) {
					x = px; px = this.p(x); r = this.rank(x,r+1);
				} else { // rank(nefu) = r+1 or rank(nece) = r+1
					if (this.rank(nefu) == r+1) this.rotate(sx);
					else			  			this.rotate2(nece);
					this.rank(px, r+1); this.rank(this.p(px), r+2);
					return;
				}
			}
		}
	}

	/** Compare another BalancedForest to this. Compares the left-to-right
	 *  order of the vertices, not the tree structure.
	 *  @other is another BalancedForest or a string representing one
	 *  @return true if the trees in both have the same set of vertices
	 *  and they appear in the same left-to-right order.
	 */
	equals(other) {
		let bf = super.listEquals(other);
		if (typeof bf == 'boolean') return bf;
		return bf;
	}

	/** Return a string representation of this object.
	 *  @param u is a node in a tree
	 *  @param fmt is an integer; its lower bits control the format
     *    0b0001 specifies newlines between trees
     *    0b0010 specifies that singletons are shown
     *    0b0100 specifies that the tree structure is shown
	 *	  0b1000 specifies that the node ranks are shown
	 *  @param label is an optional function used to produce node label
	 *  @return a string
	 */
	toString(fmt=0x0,label=0) {
		if (!label) {
			label = (u => this.x2s(u) + ((fmt&0x8) ? ':' + this.rank(u) : ''));
		}
		return super.toString(fmt, label);
	}

	/** Initialize this object from a string. */
	fromString(s) { return super.fromListString(s); }

	/** Determine if this object is self-consistent.
	 *  In addition to verifying the tree structure, checks that the
	 *  rank invariant is satisfied.
	 */
	verify() {
		let s = super.verify();
		if (s) return s;
		for (let u = 1; u <= this.n; u++) {
			let pu = this.p(u); let gpu = this.p(pu);
			if (pu && (this.rank(pu) < this.rank(u) ||
					   this.rank(pu) > this.rank(u)+1)) {
				return `node ${this.x2s(u)} has rank ${this.rank(u)} and ` +
					   `parent ${this.x2s(pu)} has rank ${this.rank(pu)}\n`;
			}
			if (gpu && this.rank(gpu) <= this.rank(u)) {
				return `node ${this.x2s(u)} has rank ${this.rank(u)} and ` +
					   `grandparent ${this.x2s(gpu)} has rank ` +
					   `${this.rank(gpu)}\n`;
			}
		}
		return '';
	}
}
