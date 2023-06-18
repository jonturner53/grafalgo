/** @file DynamicTrees.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import Forest from '../trees/Forest.mjs';
import PathSet from './PathSet.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

let spliceTime;

/** Data structure representing a collection of paths.
 *
 *  Paths can be split apart or joined together and each path node
 *  has a cost. Supports efficient search for the first mincost node.
 */
export default class DynamicTrees extends PathSet {
	exposes;
	splices;
	
	/** Constructor for DynamicTrees object.
	 *  @param n is the range for the list
	 */
	constructor(n=10) {
		super(n); this.exposes = this.splices = 0;
this.spliceTime = 0;
	}

	/** Expose a path in a tree.
	 *  @param u is a node in a tree
	 *  @return a path from u to the root of its tree
	 *  Restructures underlying path set, so the path from u to the root is
	 *  a single path.
	 */
	expose(u) {
		ea && assert(this.valid(u));
		this.exposes++;
		let [p,s] = [0,u];
		while (s != 0) {
			[p,s] = this.#splice([p,s]);
		}
		this.succ(p, 0);
		return p;
	}
	
	/** Combine two path segments.
	 *  Splice is a private method used by the expose method.
	 *  @param pair is a pair [p,s] p is a path and s is its successor.
	 *  @return a new pair that can be used in next step of expose operation
	 *  The operation splits the path containing s and then joins p to
	 *  the last part of the path originally containing s, effectively
	 *  extending p further up the tree.
	 */ 
	#splice([p,s]) {
		this.splices++;
		let next_s = this.succ(super.findpath(s));
		let [p1,p2] = this.split(s);
		if (p1 != 0) this.succ(p1, s);
		let [a,b] = [this.join(p,s,p2), next_s];
		return [a,b];
	}
	
	/** Return the root of a tree.
	 *  @param u is a node in some tree
	 *  @return the root of the tree containing u
	 */
	findroot(u) {
		ea && assert(this.valid(u));
		let p = this.expose(u);
		let x = this.findtail(p);
		this.succ(x, 0); // works because x is now both tail and path id
		return x;
	}
	
	/** Find the last min cost node on the path to the root.
	 *  @param u is a node in some tree
	 *  @return a pair [v,c] where v is the last min cost node on the path
	 *  from u to the root and c is its cost; on return, v is also the id
	 *  of the path
	 */
	findcost(u) {
		let [v,c] = super.findpathcost(this.expose(u));
		this.succ(v, 0); // works because v is also now path id
		return [v,c];
	}
	
	/** Add to the cost of every node on the path from a node to its tree root.
	 *  @param u is a node in some tree
	 *  @param c is an increment to be added to the costs of the nodes on the
	 *  path from u to the tree root
	 */
	addcost(u, c) {
		ea && assert(this.valid(u));
		this.addpathcost(this.expose(u), c);
	}
	
	/** Graft one tree onto another.
	 *  @param t is the root of some tree
	 *  @param u is a node in some other tree
	 *  on return, t is a child of u, making the original tree containing t
	 *  a subtree of u
	 */
	graft(t, u) {
		ea && assert(this.valid(t) && this.valid(u));
		let p = this.expose(u); // id of path from u to tree root
		let sp = this.succ(p);
		this.succ(this.join(0, this.expose(t), p), sp);
	}
	
	/** Divide a tree into two subtrees.
	 *  @param u is a node in some tree.
	 *  The operation removes the edge from u to its parent.
	 */
	prune(u) {
		ea && assert(this.valid(u));
		let v = this.succ(this.findpath(u));
		let [p,q] = this.split(u);
		if (p != 0) this.succ(p, u);
		if (q != 0) this.succ(q, v);
		this.succ(u, 0);
	}
	
	/** Compare two DynamicTrees for equality.
	 *
	 *  @param dt is the DynamicTrees to be compared to this one
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order)
	 */
	equals(dt) {
		if (this == dt) return true;
		if (typeof dt == 'string') {
			let s = dt; dt = new DynamicTrees(this.n);
			if (!dt.fromString(s)) return s == this.toString();
		} else if (!(dt instanceof DynamicTrees) || this.n != dt.n) {
			return false;
		}
		let f1 = this.explicitForest(); let f2 = dt.explicitForest();
		if (!f1.equals(f2)) return;

		let mc1 = this.getMincosts(); let mc2 = dt.getMincosts();
		for (let u = 1; u <= this.n; u++) {
			if (this.cost(u,mc1) != dt.cost(u,mc2)) return false;
		}
		return dt;
	}

	/** Get an explicit representation of the forest represented by
	 *  the data structure.
	 *  @return a pair [f,cost] where f is directed graph defining
	 *  a forest of directed trees and cost is an array of vertex costs.
	 */
	explicitForest() {
		let f = new Forest(this.n)
		for (let t = 1; t <= this.n; t++) {
			if (this.p(t)) continue;
			let succ = this.succ(t);
			for (let u = this.first(t); u; u = this.next(u)) {
				if (this.next(u)) f.link(u, this.next(u));
				else if (succ)    f.link(u, succ);
			}
		}
		return f;
	}

	/** Construct a string representation of this object.
	 *  @param fmt is an integer in which low bits are format options
	 *		10000 specifies that the underlying implementation is shown
	 *			  otherwise shows the explicit/abstract forest
	 *		00001 specifies that explicit trees or paths are on separate lines
	 *		00010 specifies that singleton trees/paths are shown
	 *		00100 specifies that paths are shown as trees
	 *		01000 specifies that dmin and dcost values are shown
	 *  @param label is an optional function used to generate the node label
	 *  @return the string
	 */
	toString(fmt=0x2, label=0, selectTree=0) {
		if (fmt&0x10) {
			return super.toString(fmt&0xf, label);
		} else {
			let f = this.explicitForest();
			let mc = this.getMincosts();
			return f.toString(0x6|(fmt&1),
						u => (label ? label(u) : this.x2s(u)) +
							 ':' + (mc[u]+this.dcost(u)));
		}
	}

	/** Construct a path from a node to its tree root.
	 *  @param u is a vertex.
	 *  @return an array listing the vertices in the path
	 *  from u to its tree root.
	 */
	treepath(u) {
		let path = [];
		while (u) {
			let p = super.findpath(u,true);
			for (let v = u; v; v = super.next(v)) path.push(v);
			u = super.succ(p);
		} 
		return path;
	}

	fromString(s) {
		let f = new Forest();
		let dmin = new Float32Array(f.n+1);
		if (!f.fromString(s, (u,sc) => {
							dmin[u] = 0;
							if (!sc.verify(':')) {
								dmin[u] = 0; return true;
							}
							let cost = sc.nextNumber();
							if (Number.isNaN(cost)) return false;
							dmin[u] = cost;
							return true
						}))
			return false;
		if (this.n != f.n) this.reset(f.n);
		else this.clear();
		for (let u = 1; u <= this.n; u++) {
			if (f.p(u)) this.succ(u,f.p(u));
			this.dmin(u, dmin[u]);
		}
		return true;
	}

	clearStats() {
		super.clearStats(); this.exposes = this.splices = 0;
	}

	getStats() {
		return { 'exposes' : this.exposes, 'splices' : this.splices, 'steps' : this.steps };
	}
}
