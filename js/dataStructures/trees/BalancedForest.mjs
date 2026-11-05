/** @file BalancedForest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';
import BinaryForest from './BinaryForest.mjs';

/** This class implements a balanced version of the binary tree class. */
export default class BalancedForest extends BinaryForest {

	/** Constructor for BalancedForest object.
	 *  @param n is index range for object
	 *  @param property is an optional node property
	 */
	constructor(n=10, property=[]) {
		super(n);
		if (property[0]) this.addProperty(property);
		this.addProperty(['rank',1]); this.rank(0,0);
	}

	/** Clear trees converting them to singletons.
	 *  @param r is the root of a tree or sub-tree; if specified,
	 *  only the specified tree is cleared, otherwise all are
	 */
	clear(r=0) {
		if (r) {
			for (let u = this.first(r); u; u = this.next(u))
				this.rank(u,1);
		} else {
			for (let u = 1; u <= this.n; u++)
				this.rank(u,1);
		}
		super.clear(r);
	}

	/** Insert a singleton immediately after a node in a tree.
	 *  @param u is a singleton
	 *  @param v is a node in t which defines the point where u is
	 *  to be inserted; if zero, u is inserted before all nodes in tree
	 *  @param t is the tree root
	 *  @param refresh(u) is an optional function that can be used to adjust
	 *  client data that is affected by the tree structure; it is called
	 *  just before the tree is rebalanced.
	 */
	insertAfter(u, v, t, refresh=0) {
		return super.insertAfter(u, v, t, u => { if (refresh) refresh(u);
												this.rerankUp(u);
												});
	}

	/** Insert a node based on a key value.
	 *  @param u is a singleton node
	 *  @param t is the root of the tree containing u
	 *  @param key is an array mapping nodes to key values;
	 *  @compare is an optional key comparison function
	 *  @param refresh(u) is an optional function, which is called
	 *  with argument u after u is inserted but before rebalancing.
	 *  @return the root of the modified tree
	 */
	insertByKey(u, t, compare, refresh=0) {
		return super.insertByKey(u, t, compare,
											u => { if (refresh) refresh(u);
												 this.rerankUp(u);
												 });
	}

	/** Delete a node from a tree.
	 *  @param u is a non-singleton tree node.
	 *  @param t is the tree containing u
	 *  @param refresh(pu) is an optional function that can be used to adjust
	 *  client data that is affected by the tree structure; it is called
	 *  just before the tree is rebalanced and its argument is u's parent
	 *  just before the rebalancing takes place.
	 *  @return the modified tree
	 */
	delete(u, t=0, refresh=0) {
		t = super.delete(u, t, (cu,pu) => { if (refresh) refresh(pu);
										 	this.rerankDown(cu,pu);
											});
		this.rank(u,1);
		return t;
	}

	swap(u, v) {
		super.swap(u,v);
		let ru = this.rank(u); this.rank(u, this.rank(v)); this.rank(v, ru);
	}

	/** Join two trees (or subtrees) at a node.
	 *  @param t1 is a tree
	 *  @param u is a node
	 *  @param t2 is a second tree (likewise)
	 *  @param refresh is an optional function 
	 *  @param refresh(pu) is an optional function that can be used to adjust
	 *  client data that is affected by the tree structure; it is called
	 *  just before the tree is rebalanced and its argument is u's parent
	 *  just before the rebalancing takes place.
	 *  @return root of new tree (or subtree) formed by joining t1, u and t2.
	 */
	join(t1, u, t2, refresh=0) {
		let r1 = this.rank(t1); let r2 = this.rank(t2);
		if (r1 == r2) {
			let t = super.join(t1,u,t2);
			if (refresh) refresh(u);
			this.rank(t, r1+1);
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
			this.parent(t1,0);
			if (refresh) refresh(u);
			this.rerankUp(u);
			let t =  this.root(t1);
			return t;
		} else { // (r1 < r2)  mirror of first case
			let v = t2; let pv = 0;		// track parent in case t1==0
			while (this.rank(v) > r1) {
				pv = v; v = this.left(v); this.steps++;
			}
			super.join(t1, u, v);
			this.link(u,pv,-1); this.rank(u,r1+1)
			this.parent(t2,0);
			if (refresh) refresh(u);
			this.rerankUp(u);
			let t = this.root(t2);
			return t;
		}
	}

	split(u, refresh=0) {
		let pair = super.split(u, refresh); this.rank(u,1); return pair;
	}

	/** Adjust ranks after a node rank increases, leading to a violation
	 *  of the rank invariant; may do up to two rotations, as well;
	 *  assumes that other nodes satisfy the invariant.
	 *  @param x is a node whose rank may equal that of its grandparent, 
	 *  in violation of the rank invariant for balanced trees.
	 */ 
	rerankUp(x) {
		let rx = this.rank(x);
		while (this.gparent(x) != 0 && this.rank(this.gparent(x)) == rx &&
								  this.rank(this.aunt(x)) == rx) {
			x = this.gparent(x); rx = this.rank(x,rx+1); this.steps++;
		}
		if (this.gparent(x) == 0 || rx != this.rank(this.gparent(x)))
			return;
		if (this.outerGrandchild(x)) this.rotate(this.parent(x));
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
				// also, rank(p(x)) == rank(gparent(x)) == r+2
			} else { // rank(sx) == r+1
				if (this.rank(nefu) == r && this.rank(nece) == r) {
					x = px; px = this.parent(x); r = this.rank(x,r+1);
				} else { // rank(nefu) = r+1 or rank(nece) = r+1
					if (this.rank(nefu) == r+1) this.rotate(sx);
					else			  			this.rotate2(nece);
					this.rank(px, r+1); this.rank(this.parent(px), r+2);
					return;
				}
			}
		}
	}

	/** Compare another BalancedForest to this. Compares the left-to-right
	 *  order of the vertices, not the tree structure.
	 *  @param that is another BalancedForest or a string representing one
	 *  @return true if the trees in both have the same set of vertices
	 *  and they appear in the same left-to-right order.
	 */
	equals(that,...args) {
		that = super.listEquals(that, ...(args.length ? args :
										[this.n,this.property(0)]));;
		if (typeof that == 'boolean') return that;

		for (let u = 1; u <= this.n; u++) {
			if (this.parent(u)) continue;
			let r1 = u; let r2 = that.root(u);
			let v1 = this.first(r1); let v2 = that.first(r2);
			while (v1 && v1 == v2) {
				v1 = this.next(v1,r1); v2 = that.next(v2,r2);
			}
			if (v1 != v2) return false;
		}
		return that;
	}

	/** Return a string representation of this object.
	 *  @param u is a node in a tree
	 *  @param fmt is an integer; its lower bits control the format
     *    0b0001 specifies newlines between trees
     *    0b0010 specifies that singletons are shown
     *    0b0100 specifies that the tree structure is shown
	 *	  0b1000 specifies that the node ranks are shown
	 *  @param nodeLabel(u) is an optional function used to produce node label
	 *  @param treeLabel(t) is an optional function used to produce tree label
	 *  @return a string
	 */
	toString(fmt=0x0, nodeLabel=0, treeLabel=0) {
		if (!nodeLabel) {
			nodeLabel = (u => this.x2c(u) + 
					  		(this.key ? ':'+Top.d2s(this.key(u)) : '') +
					  		((fmt&0x8 && this.rank(u) > 1) ?
								':' + this.rank(u) : ''));
		}
		return super.toString(fmt, nodeLabel, treeLabel);
	}

	/** Initialize this from a string.
	 *  @param s is a string representing a set of lists;
	 *  since this data structure restructures the trees to maintain balance,
	 *  it's really just the lists that are significant
	 *  @return true on success
	 */
	static fromString(s, n=10, property=[], scan4prop=0, treeProp=0) {
		let ls = ListSet.fromString(s, n,0,property, scan4prop,0,treeProp);
		if (!ls) return null;
		let bf = new BalancedForest(ls.n, ls.property(0));
		let [pname] = ls.property(0);
		if (pname) {
			for (let l = 1; l <= ls.n; l++) bf[pname](l,ls[pname](l));
		}
		for (let l = 1; l <= ls.n; l++) {
			if (!ls.isfirst(l)) continue;
			let t = l;
			for (let u = ls.next(t); u; u = ls.next(u)) {
				t = bf.insertAfter(u,ls.prev(u),t);
			}
		}
		return bf;
	}

	/** Determine if this object is self-consistent.
	 *  In addition to verifying the tree structure, checks that the
	 *  rank invariant is satisfied.
	 */
	verify() {
		let s = super.verify();
		if (s) return s;
		for (let u = 1; u <= this.n; u++) {
			let pu = this.parent(u); let gpu = this.parent(pu);
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
