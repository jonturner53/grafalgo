/** @file DynamicTrees.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { fassert } from '../../common/Errors.mjs';
import Forest from '../graphs/Forest.mjs';
import PathSet from './PathSet.mjs';

/** Data structure representing a collection of paths.
 *
 *  Paths can be split apart or joined together and each path node
 *  has a cost. Supports efficient search for the first mincost node.
 */
export default class DynamicTrees extends PathSet {
	exposeCount;
	spliceCount;
	
	/** Constructor for DynamicTrees object.
	 *  @param n is the range for the list
	 *  @param capacity is the max range to allocate space for
	 */
	constructor(n=10, capacity=n) {
		super(n); this.exposeCount = this.spliceCount = 0;
	}

	/** Expose a path in a tree.
	 *  @param u is a node in a tree
	 *  @return a path from u to the root of its tree
	 *  Restructures underlying path set, so the path from u to the root is
	 *  a single path.
	 */
	expose(u) {
		this.exposeCount++;
		fassert(this.valid(u));
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
		this.spliceCount++;
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
		fassert(this.valid(u));
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
		fassert(this.valid(u));
		this.addpathcost(this.expose(u), c);
	}
	
	/** Graft one tree onto another.
	 *  @param t is the root of some tree
	 *  @param u is a node in some other tree
	 *  on return, t is a child of u, making the original tree containing t
	 *  a subtree of u
	 */
	graft(t, u) {
		fassert(this.valid(t) && this.valid(u));
		let p = this.expose(u); // id of path from u to tree root
		let sp = this.succ(p);
		this.succ(this.join(0, this.expose(t), p), sp);
	}
	
	/** Divide a tree into two subtrees.
	 *  @param u is a node in some tree.
	 *  The operation removes the edge from u to its parent.
	 */
	prune(u) {
		fassert(this.valid(u));
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
	 *  same contents (in the same order);
	 *  they need not have the same storage capacity to be equal
	 */
	equals(dt) {
		if (this == dt) return true;
		if (typeof dt == 'string') {
			let s = dt; dt = new DynamicTrees(this.n); dt.fromString(s);
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
		f.fromString(s, (u,sc) => {
							dmin[u] = 0;
							if (!sc.verify(':')) return;
							let cost = sc.nextNumber();
							if (Number.isNaN(cost)) return;
							dmin[u] = cost;
						});
		if (this.n != f.n) this.reset(f.n);
		else this.clear();
		for (let u = 1; u <= this.n; u++) {
			if (f.p(u)) this.succ(u,f.p(u));
			this.dmin(u, dmin[u]);
		}
		return true;
	}


	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	fromString(s) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let n = 0; let props = []; let vertices = new Set();
		let k = this.nextSubtree(sc, 0, props, vertices);
		while (k > 0) {
			n = Math.max(n, k);
			k = this.nextSubtree(sc, 0, props, vertices);
		}
		if (k == -1 || !sc.verify('}')) return false;
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let [u,c,p] of props) {
			this.addcost(u,c); this.succ(u,p);
		}
		return true;
	}
	 */

	/** Get the next subtree from a scanner.
	 *  @param sc is a Scanner
	 *  @param parent is the parent of the subtree root or 0 for tree roots
	 *  @param props is an array of triples [u,c,p] where c is cost of u
	 *  and p is parent of u.
	 *  @param vertices is a Set representing vertices seen so far
	 *  @return n on success, where n is the largest vertex number in the
	 *  subtree; return 0 if no subtree to be scanned and -1 on error.
	nextSubtree(sc, parent, props, vertices) {
		let u = sc.nextIndex(); if (u < 0) return 0;
		if (vertices.has(u) || !sc.verify(':')) return -1;
		vertices.add(u);
		let c = sc.nextNumber();
		if (isNaN(c)) return -1;
		props.push([u,c,parent]);
		let n = u;	// largest vertex number seen in subtree
		if (!sc.verify('(')) return n;
		let k = this.nextSubtree(sc, u, props, vertices);
		if (k <= 0) return -1;
		while (k > 0) {
			n = Math.max(n, k);
			k = this.nextSubtree(sc, u, props, vertices);
		}
		if (k < 0 || !sc.verify(')')) return -1;
		return n;
	}
	 */

	clearStats() {
		super.clearStats();this.exposeCount = this.spliceCount = 0;
	}

	getStats() {
		return { 'exposeCount' : this.exposeCount,
				 'spliceCount' : this.spliceCount,
				 'splayCount'  : this.splayCount,
				 'splaySteps'  : this.splaySteps};
	}
}
