/** @file DynamicTrees.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { assert } from '../../common/Errors.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Digraph from '../graphs/Digraph.mjs';
import PathSet from './PathSet.mjs';
import Scanner from '../basic/Scanner.mjs';

/** Data structure representing a collection of paths.
 *
 *  Paths can be split apart or joined together and each path node
 *  has a cost. Supports efficient search for the first mincost node.
 */
export default class DynamicTrees extends Top {
	#paths;		///< PathSet object implementing tree paths`

	#exposeCount;
	#spliceCount;
	
	/** Constructor for DynamicTrees object.
	 *  @param n is the range for the list
	 *  @param capacity is the max range to allocate space for
	 */
	constructor(n, capacity=n) {
		super(n);
		if (!capacity) capacity = this.n;
		this.#init(capacity);
	}

	#init(capacity) {
		assert(capacity >= this.n);
		this.#paths = new PathSet(this.n, capacity);
		this.clearStats();
	}

	/** Reset the range and max range of the list; discard value. 
	 *  @param n is the range of the index set
	 *  @param capacity the max range for which space is to be allocated
	 */
	reset(n, capacity=n) {
		assert(capacity >= n); this._n = n; this.#init(capacity);
	}

	expand(n) {
		if (n <= this.n) return;
		if (n > this.capacity) {
			let nu = new DynamicTrees(this.n, 
						 	  Math.max(n, ~~(1.5 * this.capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this.#paths.expand(n);
	}

	/** Assign new value to DynamicTrees from another. 
	 *  @paran dt is a DynamicTrees whose value is to be assigned to this
	 */
	assign(dt) {
		if (dt == this) return;
		if (dt.n > this.capacity) this.reset(dt.n);
		else { this.clear(); this._n = dt.n; }
		this.#paths.assign(dt.#paths);
		for (let u = 1; u <= this.n; u++) {
			this.succ(u, dt.succ(u));
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param dt is a DynamicTrees whose contents are to be transferred to this
	 */
	xfer(dt) {
		if (dt == this) return;
		this._n = dt.n;
		//this.#succ = dt.#succ; dt.#succ = null;
		this.#paths = dt.#paths; dt.#paths = null;
		this.clearStats();
	}
	
	/** Return to initial state */
	clear() {
		//this.#succ.fill(0, 0, this.n+1);
		this.#paths.clear(); this.clearStats();
	}

	/** Get the capacity of the list (max number of items it has space for). */
	get capacity() { return this.#paths.capacity; }

	/** Get/set the successor of a path.
	 *  @param q is a path id
	 *  @param u is an optional argument; if present, successor is set to u
	 *  @return the successor vertex of q (or 0 if none)
	 */
	succ(q, u=-1) {
		// rather than provide separate successor array, share the parent
		// array in the PathSet
		if (u != -1) this.#paths.p(q, -u);
		return -this.#paths.p(q);
	}

	/** Expose a path in a tree.
	 *  @param u is a node in a tree
	 *  @return a path from u to the root of its tree
	 *  Restructures underlying path set, so the path from u to the root is
	 *  a single path.
	 */
	expose(u) {
		this.#exposeCount++;
		assert(this.valid(u));
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
		this.#spliceCount++;
		let next_s = this.succ(this.#paths.findpath(s));
		let [p1,p2] = this.#paths.split(s);
		if (p1 != 0) this.succ(p1, s);
		return [this.#paths.join(p,s,p2), next_s];
	}
	
	/** Return the root of a tree.
	 *  @param u is a node in some tree
	 *  @return the root of the tree containing u
	 */
	findroot(u) {
		assert(this.valid(u));
		let p = this.expose(u);
		let x = this.#paths.findtail(p);
		this.succ(x, 0); // works because x is now both tail and path id
		return x;
	}
	
	/** Find the last min cost node on the path to the root.
	 *  @param u is a node in some tree
	 *  @return a pair consisting of the last min cost node on the path from
	 *  u to the root and its cost
	 */
	findcost(u) {
		let [v,c] = this.#paths.findpathcost(this.expose(u));
		this.succ(v, 0); // works because v is also now path id
		return [v,c];
	}
	
	/** Add to the cost of every node on the path from a node to its tree root.
	 *  @param u is a node in some tree
	 *  @param c is an increment to be added to the costs of the nodes on the
	 *  path from u to the tree root
	 */
	addcost(u, c) {
		assert(this.valid(u));
		this.#paths.addpathcost(this.expose(u), c);
	}
	
	/** Link two trees.
	 *  @param t is the root of some tree
	 *  @param u is a node in some other tree
	 *  on return, t is a child of u, making the original tree containing t
	 *  a subtree of u
	 */
	link(t, u) {
		assert(this.valid(t) && this.valid(u));
		this.succ(this.#paths.findpath(t), u);
	}
	
	/** Divide a tree into two subtrees.
	 *  @param u is a node in some tree.
	 *  The operation removes the edge from u to its parent.
	 */
	cut(u) {
		assert(this.valid(u));
		let v = this.succ(this.#paths.findpath(u));
		let [p,q] = this.#paths.split(u);
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
		} else if (!(dt instanceof DynamicTrees)) {
			return false;
		}
		if (this.n != dt.n) return false;
		let [f1, cost1] = this.getForest();
		let [f2, cost2] = dt.getForest();
		for (let u = 1; u <= this.n; u++)
			if (cost1[u] != cost2[u]) return false;
		return f1.equals(f2);
	}

	/** Get an alternate representation of the data structure
	 *  @return a pair [f,cost] where f is directed graph defining
	 *  a forest of directed trees and cost is an array of vertex costs.
	 */
	getForest() {
		let f = new Digraph(this.n);
		let [paths, cost] = this.#paths.getPaths();
		for (let u = 1; u <= this.n; u++) {
			if (!paths.isfirst(u)) continue;
			for (let v = paths.next(u); v != 0; v = paths.next(v))
				f.join(v, paths.prev(v));
			let p = this.succ(this.#paths.findpath(u, true));
			if (p != 0) {
				f.join(p, paths.last(u));
			}
		}
		return [f, cost];
	}

	/** Create a string representation of a given list.
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(details, pretty, label) {
		let s = '{'; if (pretty) s += '\n';
		if (!details) {
			let [f, cost] = this.getForest();
			let firstTree = true;
			for (let u = 1; u <= f.n; u++) {
				if (f.firstIn(u) != 0) continue;
				if (firstTree) firstTree = false;
				else if (!pretty) s += ' ';
				s += this.subtree2string(u, f, cost, label);
				if (pretty) s += '\n';
			}
			return s + '}';
		}
				
		// make list of paths and list of paths containing tree roots
		// also array mapping every path to its root path
		let paths = new List(this.n);
		let rootPaths = new List(this.n);
		let rpMap = new Array(this.n+1);
		for (let u = 1; u <= this.n; u++) {
			let p = this.#paths.findpath(u, true);
			if (!paths.contains(p)) {
				let rp = this.getRootPath(p); rpMap[p] = rp;
				paths.enq(p); if (!rootPaths.contains(rp)) rootPaths.enq(rp);
			}
		}

		// group paths that belong to the same tree
		let treePaths = new ListSet(this.n);
		for (let p = paths.first(); p != 0; p = paths.next(p)) {
			if (p != rpMap[p]) treePaths.join(rpMap[p], p);
		}

		// now print paths for each tree
		for (let rp = rootPaths.first(); rp != 0; rp = rootPaths.next(rp)) {
			s += (pretty ? '{\n' : ' {');
			s += this.treepath2string(rp, label);
			if (pretty) s += '\n';
			for (let p = treePaths.next(rp); p != 0; p = treePaths.next(p)) {
				if (!pretty) s += ' ';
				s += this.treepath2string(p, label);
				if (pretty) s += '\n';
			}
			s += (pretty ? '}\n' : '}');
		}
		s += (pretty ? '}\n' : ' }');
		return s;
	}

	treepath2string(u, label) {
		let q = this.#paths.findpath(u, false);
		let s = this.#paths.path2string(q, 0, 0, label);
		if (this.#paths.p(q) < 0)
			s += '->' + this.index2string(-this.#paths.p(q));
		return s;
	}

	/** Produce string representation of a subtree.
	 *  @param u is a vertex in a tree
	 *  @param f is a digraph representing a forest of trees
	 *  @cost is an array of vertex costs
	 *  @label is a function used to compute a label
	 *  @return a string representing the tree with each vertex
	 *  labeled with its cost
	 */
	subtree2string(u, f, cost, label) {
		if (u == 0) return '';
		let s = f.index2string(u, label) + ':' + cost[u];
		if (f.firstOut(u) == 0) return s;
		s += '(';
		for (let e = f.firstOut(u); e != 0; e = f.nextOut(u, e)) {
			let v = f.head(e);
			if (e != f.firstOut(u)) s += ' ';
			s += this.subtree2string(v, f, cost, label);
		}
		return s + ')';
	}

	/** Get the path containing the root of the tree containing a given vertex.
	 *  @param u is a node in the tree
	 *  @return the path containing the root of the tree containing u
	 */
	getRootPath(u) {
		let p = this.#paths.findpath(u,true); let v = this.succ(p);
		while (v != 0) {
			p = this.#paths.findpath(v,true); v = this.succ(p);
		}
		return p;
	}

	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
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

	/** Get the next subtree from a scanner.
	 *  @param sc is a Scanner
	 *  @param parent is the parent of the subtree root or 0 for tree roots
	 *  @param props is an array of triples [u,c,p] where c is cost of u
	 *  and p is parent of u.
	 *  @param vertices is a Set representing vertices seen so far
	 *  @return n on success, where n is the largest vertex number in the
	 *  subtree; return 0 if no subtree to be scanned and -1 on error.
	 */
	nextSubtree(sc, parent, props, vertices) {
		let u = sc.nextIndex(); if (u == 0) return 0;
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

	clearStats() { this.#exposeCount = this.#spliceCount = 0; }

	getStats() {
		let pathStats = this.#paths.getStats();
		return { 'exposeCount' : this.#exposeCount,
				 'spliceCount' : this.#spliceCount,
				 'splayCount'  : pathStats.splayCount,
				 'splaySteps'  : pathStats.splaySteps};
	}
}
