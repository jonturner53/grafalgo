/** @file PathSet.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';
import SplayForest from '../trees/SplayForest.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Data structure representing a collection of paths.
 *
 *  Paths can be split apart or joined together and each path node
 *  has a cost. Supports efficient search for the last mincost node.
 *  in a path.
 */
export default class PathSet extends SplayForest {
	Dcost;		// Dcost[u] = cost(u)-mincost(u)
	Dmin;		// Dmin[u] = mincost(u)-mincost(p(u)) 

	/** Constructor for List object.
	 *  @param n is the range for the list
	 */
	constructor(n=10) {
		super(n);
		this.Dcost = new Float32Array(this.n+1).fill(0);
		this.Dmin = new Float32Array(this.n+1).fill(0);
		this.Dcost[0] = this.Dmin[0] = Infinity;
	}

	/** Assign new value to PathSet from another. 
	 *  @paran that is a PathSet whose value is to be assigned to this
	 */
	assign(that) {
		ea && assert(that == this || !(that instanceof PathSet));
		if (that == this || !(that instanceof PathSet)) return;
		super.assign(that);
		for (let u = 1; u <= this.n; u++) {
			this.Dcost[u] = that.Dcost[u];
			this.Dmin[u] = that.Dmin[u];
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param that is a PathSet whose contents are to be transferred to this
	 */
	xfer(that) {
		if (that == this || !(that instanceof PathSet)) return;
		super.xfer(that);
		this.Dcost = that.Dcost; that.Dcost = null;
		this.Dmin = that.Dmin; that.Dmin = null;
	}
	
	/** Return to initial state */
	clear() {
		super.clear(); this.Dcost.fill(0); this.Dmin.fill(0);
	}

	/** Get/set the deltaCost of a node.
	 *  @param u is a node in a path.
	 *  @return the deltaCost of u in the tree representing the path
	 */
	dcost(u, c=-1) {
		if (c != -1) this.Dcost[u] = c;
		return this.Dcost[u];
	}
	
	/** Get/set the deltaMin of a node.
	 *  @param u is a node in a path.
	 *  @return the deltaMin of u in the tree representing the path
	 */
	dmin(u, c=-1) {
		if (c != -1) this.Dmin[u] = c;
		return this.Dmin[u];
	}
	
	/** Get/set the successor of a path.
	 *  @param p is the id of a path.
	 *  @param s is an optional new value for the successor.
	 *  @return the successor
	 */
	succ(p, s=-1) {
		return super.property(p,s);
	}
	
	/** Get the mincost of a subtree.
	 *  @param u is a node in a path.
	 *  @return the minimum cost of all nodes in subtree at u.
	 */
	mincost(u) {
		let mc = 0;
		for (let v = u; v > 0; v = this.p(v)) {
			mc += this.dmin(v); this.steps++;
		}
		return mc;
	}
	
	/** Get the cost of a node.
	 *  @param u is a node in a path.
	 *  @param mc is an optional vector with mc[u] == mincost(u);
	 *  the utility method getMincosts returns such a vector
	 *  @return the cost of u.
	 */
	cost(u,mc=null) {
		return this.dcost(u) + (mc ? mc[u] : this.mincost(u));
	}

	/** Perform a rotation in a search tree representing a path.
	 *  @param x is a node in some path; the operation performs a rotation
	 *  at the parent of x, moving x up into its parent's position.
	 */
	rotate(x) {
		let y = this.p(x); if (y <= 0) return;
		let z = this.p(y);
		let a, b, c;
		if (x == this.left(y)) {
			a = this.left(x);  b = this.right(x); c = this.right(y);
		} else {
			a = this.right(x); b = this.left(x);  c = this.left(y); 
		}
		super.rotate(x);
	
		// update dmin, dcost values
		let dmin = this.Dmin; let dcost = this.Dcost;
		let dmx = dmin[x];
		let dma = dmin[a]; let dmb = dmin[b]; let dmc = dmin[c];
			// note: if a=0, dma = Infinity; same for b,c

		dcost[x] += dmx;
		dmin[x] = dmin[y];

		dmin[y] = Math.min(dcost[y], dmb+dmx, dmc);
		dcost[y] -= dmin[y];

		dmin[a] = dma + dmx;
		dmin[b] = dmb + dmx - dmin[y];
		dmin[c] = dmc       - dmin[y];
	}
	
	/** Return the id of the path containing a specified node.
	 *  @param u is a node in some path
	 *  @param nosplay is an optional flag that prevents the normal
	 *  restructuring of the underlying tree
	 *  @return the id of the path after the operation is performed
	 */
	findpath(u, nosplay=false) { return super.find(u,nosplay); }
	
	/** Return the last node in a path.
	 *  @param q is the id of some path
	 *  @return the last node in the path containing q; the returned
	 *  node is also the new path id
	 */
	findtail(q) { return this.splay(super.last(q)); }
	
	/** Add to the cost of every node in a path.
	 *  @param q is the canonical element of some path
	 *  @param x is the amount to be added to the costs of the nodes in
	 *  the path
	 */
	addpathcost(q, x) { this.dmin(q, this.dmin(q) + x); }
	
	/** Find the the last node on a path that has minimum cost.
	 *  @param q is a path id
	 *  @return a pair containing the last node on the path that has minimum
	 *  cost and its cost; the returned node is also the new path id
	 */
	findpathcost(q) {
		while (true) {
			if (this.right(q) && this.dmin(this.right(q)) == 0)
				q = this.right(q);
			else if (this.dcost(q) > 0)
				q = this.left(q);
			else
				break;
		}
		q = this.splay(q);
		return [q, this.dmin(q)];
	}
	
	/** Join two paths at a node.
	 *  @param r is the canonical element of some path
	 *  @param u is an isolated node (equivalently, it is a length 1 path)
	 *  @param q is the canonical element of some path
	 *  @return the new path formed by combining r,u and q (so r is the first
	 *  part of the resultant path, then u, then q); this new path replaces
	 *  the original paths; note: the new path inherits its successor from q
	 *  or possibly u
	 */
	join(r, u, q) {
		let dmin = this.Dmin; let dcost = this.Dcost;
		let dmin_u = dmin[u];
		let pathProp = (q ? this.property(q) : this.property(u));
		super.join(r,u,q);
		if (r == 0 && q == 0) {
			; // do nothing
		} else if (r == 0) {
			dmin[u] = Math.min(dmin[u], dmin[q]);
			dmin[q] -= dmin[u];
		} else if (q == 0) {
			dmin[u] = Math.min(dmin[u], dmin[r]);
			dmin[r] -= dmin[u];
		} else {
			dmin[u] = Math.min(dmin[r], dmin[u], dmin[q]);
			dmin[r] -= dmin[u];
			dmin[q] -= dmin[u];
		}
		dcost[u] = dmin_u - dmin[u]; this.property(u, pathProp);
		return u;
	}
	
	/** Divide a path at a node.
	 *  @param u is a node in some path; the operation splits path into three
	 *  parts, the original portion of the path that precedes u, u itself, and
	 *  the portion of the original path that follows u
	 *  @return the a pair consisting of the two new path segments
	 *  note: the first path segment acquires u as its property and the
	 *  second segment inherits its successor from the original
	 *  path being split
	 */
	split(u) {
		let [p,q] = super.split(u);
		let su = this.succ(u);
		if (p != 0) { this.Dmin[p] += this.dmin(u); this.p(p,0); }
		if (q != 0) { this.Dmin[q] += this.dmin(u); this.property(q,su); }
		this.Dmin[u] += this.dcost(u); this.Dcost[u] = 0;
		return [p,q];
	}

	/** Insert a node in a path at a specified position.
	 *  @param u is node to be inserted
	 *  @param v is the node after which u is to be inserted
	 */
	insertAfter(u, v) {
		let [t1,t2] = this.split(v);
		this.join(t1,v,0); this.join(v,u,t2);
	}
	
	/** Compare two PathSets for equality.
	 *  @param that is the PathSet to be compared to this one
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order).
	 */
	equals(that) {
		that = super.listEquals(that);
		if (typeof that == 'boolean') return that;

		let mc1 = this.getMincosts();
		let mc2 = that.getMincosts();
		for (let u = 1; u <= this.n; u++) {
			if (this.cost(u,mc1) != that.cost(u,mc2)) return false;
		}
		return that;
	}

	/** Compute the mincosts for all nodes and return an array mapping
	 *  each node to its mincost.
	 */
	getMincosts() {
		let mincost = new Float32Array(this.n+1);
		let q = new List(this.n);
		for (let r = 1; r <= this.n; r++) {
			if (this.p(r)) continue;
			q.enq(r);
			while (!q.empty()) {
				let u = q.deq();
				mincost[u] = (this.p(u) ? mincost[this.p(u)] : 0)
							 + this.Dmin[u];
				if (this.left(u))  q.enq(this.left(u));
				if (this.right(u)) q.enq(this.right(u));
			}
		}
		return mincost;
	}

	/** Construct a string representation of this object.
	 *  @param fmt is an integer in which low bits are format options
	 *		0001 specifies that paths appear on separate lines
	 *		0010 specifies that singleton paths are shown
	 *		0100 specifies that underlying tree structure is shown
	 *		1000 specifies that dmin and dcost values are shown
	 *  @return the string
	 */
	toString(fmt=0x2) {
		let mc = this.getMincosts();
		let label = (u => `${this.x2s(u)}:${mc[u]+this.dcost(u)}`);
		let pathLabel = (t => this.succ(t) ? this.x2s(this.succ(t)) : '');

		if (!(fmt&4)) return super.toString(fmt&3, label, pathLabel);

		let xlabel = (u => label(u) + (!(fmt&0x8) ? '' :
				`:${this.dmin(u)}` + (this.dcost(u) ? `:${this.dcost(u)}`:'')));
		return super.toString(fmt&7, xlabel, pathLabel);
	}

	/** Initialize this PathSets object from a string.
	 *  @param s is a string representing a PathSets object.
	 *  @return true on success, else false
	 */
	fromString(s) {
		let cost = []; let succ = [];
		let nodeProp = (u,sc) => {
						if (!sc.verify(':',0)) {
							cost[u] = 0; return true;
						}
						let p = sc.nextInt(0);
						if (Number.isNaN(p)) return false;
						cost[u] = p;
						return true
					};
		let pathProp = (p,sc) => {
						let q = sc.nextIndex();
						succ[p] = (q > 0 ? q : 0);
						return true;
						};

		let ls = new ListSet();
		if (!ls.fromString(s,nodeProp,pathProp))
			return false;
		this.reset(ls.n);

		// Initialize dmin, dcost and succ for as if all paths were
		// a single node
		for (let l = 1; l <= ls.n; l++) {
			if (!ls.isfirst(l)) continue;
			let p = l;
			for (let u = p; u; u = ls.next(u)) {
				this.Dmin[u] = cost[u]; this.Dcost[u] = 0;
				this.succ(u, ls.next(u) ? ls.next(u) : succ[p]);
			}
		}

		// now build trees representing paths, relying on this.insertAfter
		// to ensure dmin, dcost and succ are updated properly
		super.fromListSet(ls);

        return true;
	}
}
