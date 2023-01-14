/** @file PathSet.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { fassert } from '../../common/Errors.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';
import SplayForest from '../trees/SplayForest.mjs';

/** Data structure representing a collection of paths.
 *
 *  Paths can be split apart or joined together and each path node
 *  has a cost. Supports efficient search for the last mincost node.
 *  in a path.
 */
export default class PathSet extends SplayForest {
	#dcost;		// #dcost[u] = cost(u)-mincost(u)
	#dmin;		// #dmin[u] = mincost(u)-mincost(p(u)) 

	/** Constructor for List object.
	 *  @param n is the range for the list
	 *  @param capacity is the max range to allocate space for
	 */
	constructor(n=10, capacity=n) {
		super(n,capacity);
		this.#dcost = new Float32Array(capacity+1).fill(0);
		this.#dmin = new Float32Array(capacity+1).fill(0);
		this.#dcost[0] = this.#dmin[0] = Infinity;
	}

	/** Assign new value to PathSet from another. 
	 *  @paran ps is a PathSet whose value is to be assigned to this
	 */
	assign(ps) {
		fassert(ps == this || !(ps instanceof PathSet));
		if (ps == this || !(ps instanceof PathSet)) return;
		super.assign(ps);
		for (let u = 1; u <= this.n; u++) {
			this.#dcost[u] = ps.#dcost[u];
			this.#dmin[u] = ps.#dmin[u];
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param ps is a PathSet whose contents are to be transferred to this
	 */
	xfer(ps) {
		if (ps == this || !(ps instanceof PathSet)) return;
		super.xfer(ps);
		this.#dcost = ps.#dcost; ps.#dcost = null;
		this.#dmin = ps.#dmin; ps.#dmin = null;
	}
	
	/** Return to initial state */
	clear() {
		super.clear(); this.#dcost.fill(0); this.#dmin.fill(0);
	}

	/** Get/set the deltaCost of a node.
	 *  @param u is a node in a path.
	 *  @return the deltaCost of u in the tree representing the path
	 */
	dcost(u, c=-1) {
		if (c != -1) this.#dcost[u] = c;
		return this.#dcost[u];
	}
	
	/** Get/set the deltaMin of a node.
	 *  @param u is a node in a path.
	 *  @return the deltaMin of u in the tree representing the path
	 */
	dmin(u, c=-1) {
		if (c != -1) this.#dmin[u] = c;
		return this.#dmin[u];
	}
	
	/** Get/set the successor of a path.
	 *  @param p is the id of a path.
	 *  @param s is an optional new value for the successor.
	 *  @return the successor
	 */
	succ(p, s=-1) {
		if (s >= 0) this.property(p, s);
		return this.property(p);
	}
	
	/** Get the mincost of a subtree.
	 *  @param u is a node in a path.
	 *  @return the minimum cost of all nodes in subtree at u.
	 */
	mincost(u) {
		let mc = 0;
		for (let v = u; v > 0; v = this.p(v)) mc += this.dmin(v);
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
		let dmx = this.dmin(x);
		let dma = this.dmin(a); let dmb = this.dmin(b); let dmc = this.dmin(c);
			// note: if a=0, dma = Infinity; same for b,c

		this.dcost(x, this.dcost(x) + dmx);
		this.dmin(x, this.dmin(y));

		this.dmin(y, Math.min(this.dcost(y), dmb+dmx, dmc));
		this.dcost(y, this.dcost(y) - this.dmin(y))

		this.dmin(a, dma + dmx);
		this.dmin(b, dmb + dmx - this.dmin(y));
		this.dmin(c, dmc       - this.dmin(y));
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
			if (this.right(q) != 0 && this.dmin(this.right(q)) == 0)
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
	 *  @param u is an isolated node (equivalently, it is in a length 1 path)
	 *  @param q is the canonical element of some path
	 *  @return the new path formed by combining r,u and q (so r is the first
	 *  part of the resultant path, then u, then q); this new path replaces
	 *  the original paths; note: the new path inherits its successor from q
	 */
	join(r, u, q) {
		let dmin_u = this.dmin(u);
		let sq = (q ? this.succ(q) : 0);
		super.join(r,u,q);
		if (r == 0 && q == 0) {
			; // do nothing
		} else if (r == 0) {
			this.dmin(u, Math.min(this.dmin(u), this.dmin(q)));
			this.dmin(q, this.dmin(q) - this.dmin(u));
		} else if (q == 0) {
			this.dmin(u, Math.min(this.dmin(u), this.dmin(r)));
			this.dmin(r, this.dmin(r) - this.dmin(u));
		} else {
			this.dmin(u, Math.min(this.dmin(r), this.dmin(u), this.dmin(q)));
			this.dmin(r, this.dmin(r) - this.dmin(u));
			this.dmin(q, this.dmin(q) - this.dmin(u));
		}
		this.dcost(u, dmin_u - this.dmin(u)); this.succ(u, sq);
		return u;
	}
	
	/** Divide a path at a node.
	 *  @param u is a node in some path; the operation splits path into three
	 *  parts, the original portion of the path that precedes u, u itself, and
	 *  the portion of the original path that follows u
	 *  @return the a pair consisting of the two new path segments
	 *  note: the first path segment acquires u as its successor and the
	 *  second segment inherits its successor from the original
	 *  path being split
	 */
	split(u) {
		let [p,q] = super.split(u);
		let su = this.succ(u);
		if (p != 0) { this.#dmin[p] += this.dmin(u); this.p(p,0); }
		if (q != 0) { this.#dmin[q] += this.dmin(u); this.succ(q,su); }
		this.#dmin[u] += this.dcost(u); this.#dcost[u] = 0;
		return [p,q];
	}
	
	/** Compare two PathSets for equality.
	 *  @param other is the PathSet to be compared to this one
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order);
	 *  they need not have the same storage capacity to be equal
	 */
	equals(other) {
		let ps = super.listEquals(other);
		if (typeof ps == 'boolean') return ps;

		let mc1 = this.getMincosts();
		let mc2 =   ps.getMincosts();
		for (let u = 1; u <= this.n; u++) {
			if (this.cost(u,mc1) != ps.cost(u,mc2)) return false;
		}
		return ps;
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
			mincost[r] = this.dmin(r);
			while (!q.empty()) {
				let u = q.deq();
				if (this.left(u)) {
					let lu = this.left(u);
					q.enq(lu);
					mincost[lu] = mincost[u] + this.dmin(lu);
				}
				if (this.right(u)) {
					let ru = this.right(u);
					q.enq(ru);
					mincost[ru] = mincost[u] + this.dmin(ru);
				}
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
	 *  @param label is an optional function used to generate the node label
	 *  @return the string
	 */
	toString(fmt=0x2, label=0) {
		let mc = this.getMincosts();
		let xlabel = (u => (label ?  this.label(u) : this.x2s(u)) +
				':' + (mc[u]+this.dcost(u)) +
				((fmt&0x8) ? `:${this.dmin(u)}:${this.dcost(u)}` : ''));
		let s = ''; let first = true;
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u)) continue;
			if (this.singleton(u) && !(fmt&0x2)) continue;
			if (first) first = false;
			else s += (fmt&0x1 ? '\n' : ' ');
			s += `${this.tree2string(u,fmt,xlabel)}` +
				  (this.succ(u) ? '->' + this.x2s(this.succ(u)) : '');
		}
		return fmt&0x1 ? '{\n' + s + '\n}' : '{' + s + '}';
	}

	/** Initialize this PathSets object from a string.
	 *  @param s is a string representing a PathSets object.
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let n = 0; let paths = []; let items = new Set();
		let cost = [];
		let prop = (u,sc) => {
						if (!sc.verify(':')) {
							cost[u] = 0; return true;
						}
						let p = sc.nextNumber();
						if (Number.isNaN(p)) return false;
						cost[u] = p;
						return true
					};
		for (let l = sc.nextIndexList('[',']',prop); l;
				 l = sc.nextIndexList('[',']',prop)) {
			for (let i of l) {
				n = Math.max(n,i);
				if (items.has(i)) return false;
				items.add(i);
			}
			let succ = 0;
			if (sc.verify('->')) {
				succ = sc.nextIndex();
				if (succ < 0) return false;
			}
			paths.push([l, succ]);
		}
		if (!sc.verify('}')) return false;
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let [l,succ] of paths) {
			let p = l[0];
			this.dcost(p,0); this.dmin(p,cost[p]);
			for (let i of l) {
				if (i == p) continue;
				this.dcost(i,0); this.dmin(i,cost[i]);
				p = this.findtail(p);
				let [t1,] = this.split(p);
				p = this.join(t1,p,i);
			}
			this.succ(p,succ);
		}
		return true;
	}
}
