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
import PathSet from './PathSet.mjs';
import Scanner from '../basic/Scanner.mjs';

/** Data structure representing a collection of paths.
 *
 *  Paths can be split apart or joined together and each path node
 *  has a cost. Supports efficient search for the first mincost node.
 */
export default class DynamicTrees extends Top {
	#paths;		///< PathSet object implementing tree paths`
	#succ;		///< #succ[p] is successor of the path p
	
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
		this.#succ = new Array(capacity+1).fill(0, 0, this.n+1);
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
						 	  Math.max(n, Math.floor(1.25 * this.capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this.#succ.fill(0, this.n+1, n+1);
		this.#paths.expand(n);
		this._n = n;
	}

	/** Assign new value to DynamicTrees from another. 
	 *  @paran ps is a DynamicTrees whose value is to be assigned to this
	 */
	assign(ps) {
		if (ps == this) return;
		if (ps.n > this.capacity) this.reset(ps.n);
		else { this.clear(); this._n = ps.n; }
		this.#paths.assign(ps.#paths);
		for (let i = 1; i <= this.n; i++) {
			this.#succ[i] = ps.#succ[i];
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param ps is a DynamicTrees whose contents are to be transferred to this
	 */
	xfer(ps) {
		if (ps == this) return;
		this._n = ps.n;
		this.#succ = ps.#succ; ps.#succ = null;
		this.#paths = ps.#paths; ps.#paths = null;
	}
	
	/** Return to initial state */
	clear() { this.reset(this.n, this.capacity); }

	/** Get the capacity of the list (max number of items it has space for). */
	get capacity() { return this.#succ.length - 1; }

	succ(p) { return this.#succ[p]; }

	/** Expose a path in a tree.
	 *  @param u is a node in a tree
	 *  @return a path from u to the root of its tree
	 *  Restructures underlying path set, so the path from u to the root is
	 *  a single path.
	 */
	expose(u) {
		assert(this.valid(u));
		let [p,s] = [0,u];
		while (s != 0) [p,s] = this.#splice([p,s]);
		this.#succ[p] = 0;
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
		let next_s = this.succ[this.#paths.findpath(s)];
		let [p1,p2] = this.#paths.split(s);
		if (p1 != 0) this.#succ[p1] = s;
		return [this.#paths.join(p,s,p2), next_s];
	}
	
	/** Return the root of a tree.
	 *  @param u is a node in some tree
	 *  @return the root of the tree containing u
	 */
	findroot(u) {
		assert(this.valid(u));
		let x = this.#paths.findtail(this.expose(u));
		this.#succ[x] = 0; // works because x is now both tail and path id
		return x;
	}
	
	/** Find the last min cost node on the path to the root.
	 *  @param u is a node in some tree
	 *  @return a pair consisting of the last min cost node on the path from
	 *  u to the root and its cost
	 */
	findcost(u) {
		let [v,c] = this.#paths.findpathcost(this.expose(u));
		this.#succ[v] = 0; // works because v is also now path id
		return cp;
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
		this.#succ[this.#paths.findpath(t)] = u;
	}
	
	/** Divide a tree into two subtrees.
	 *  @param u is a node in some tree.
	 *  The operation removes the edge from u to its parent.
	 */
	cut(u) {
		assert(this.valid(u));
		let v = this.succ(this.#paths.findpath(u));
		let [p,q] = this.#paths.split(u);
		if (p != 0) this.#succ[p] = u;
		if (q != 0) this.#succ[q] = v;
		this.#succ[u] = 0;
	}
	
	/** Create a string representing a path.
	 *  @param q is a path in some tree
	 *  @return the string
	 */
	string Dtrees::path2string(path q) const {
		string s = ps->path2string(q);
		s += " succ(" + Adt::index2string(q);
		s += ")=" + Adt::index2string(succ(q)) + "\n";
		return s;
	}
	
	/** Create a string representing all the trees in this Dtrees object.
	 *  @return the string
	 */
	string Dtrees::toString() const {
		string s;
		for (index i = 1; i <= n(); i++) {
			index j = ps->findtreeroot(i);
			if (i == j) s += path2string(i);
		}
		return s;
	}


	
	/** Compare two DynamicTrees for equality.
	 *
	 *  @param ps is the DynamicTrees to be compared to this one
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order);
	 *  they need not have the same storage capacity to be equal
	 */
	equals(ps) {
		if (this == ps) return true;
		if (typeof ps == 'string') {
			let s = ps; ps = new DynamicTrees(this.n); ps.fromString(s);
		} else if (!(ps instanceof DynamicTrees)) {
			return false;
		}
		if (this.n != ps.n) return false;
		let [paths1, cost1] = getPaths(this);
		let [paths2, cost2] = getPaths(ps);
		for (let u = 1; u <= this.n; u++)
			if (cost1[u] != cost2[u]) return false;
		return paths1.equals(paths2);
	}

	/** Create a string representation of a given list.
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(details, pretty, label) {
		let s = '{' + (pretty ? '\n' : '');
		let first = true;
		for (let i = 1; i <= this.n; i++) {
			if (this.p(i) == 0) {
				if (first) first = false;
				else if (!pretty) s += ' ';
				else first = false;
				s += this.path2string(i, this.dmin(i), details, label);
				if (pretty) s += '\n';
			}
		}
		s += '}' + (pretty ? '\n' : '');
		return s;
	}

	/** Create a string representation of a path.
	 *  @param q is the root of some subtree
	 *  @param mc is the mincost of q's parent
	 *  @param details is a flag, which if true produces a more detailed
	 *  view of the data structure
	 *  @param is a function used to produce a label from a node index
	 *  @return the string
	 */
	path2string(q, mc, details, label) {
		if (q == 0) return '';
		let s = (this.p(q) == 0 ? '[' : '');
		mc += this.dmin(q);
		let leaf = (this.left(q) == 0 && this.right(q) == 0);
		let showParens = details && this.p(q) != 0 && !leaf;
		if (showParens) s += '(';
		if (this.left(q) != 0)
			s += this.path2string(this.left(q), mc, details, label) + ' ';
		s += this.index2string(q, label) + (details && leaf ? '.' : ':');
		s += (details ? this.dmin(q) + ':' + this.dcost(q) :
						mc + this.dcost(q));
		if (this.right(q) != 0)
			s += ' ' + this.path2string(this.right(q), mc, details, label);
		if (showParens) s += ')';
		s += (this.p(q) == 0 ? ']' : '');
		return s;
	}
	
	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		if (!sc.verify('{')) return false;
		let items = new Set(); let path = new List();
		while (sc.verify('[')) {
			let u = sc.nextIndex(); let p = u;
			path.clear(); let mc = Infinity;
			for (let v = u; v != 0; v = sc.nextIndex()) {
				if (items.has(v)) { this.clear(); return false; }
				if (v > this.n) this.expand(v);
				if (!sc.verify(':')) { this.clear(); return false; }
				let cost = sc.nextNumber();
				if (isNaN(cost)) { this.clear(); return false; }
				mc = Math.min(mc, cost);
				path.enq(v, [mc,cost]);
				if (v != u) p = this.join(p,v,0);
			}
			// second pass to compute differential costs
			for (let v = path.first(); v != 0; v = path.next(v)) {
				let val = path.value(v);
				this.#dcost[v] = val[1] - val[0];
				if (this.p(v) == 0) {
					this.#dmin[v] = val[0];
				} else {
					let pmc = path.value(this.p(v))[0];
					this.#dmin[v] = val[0] - pmc;
				}
			}
			if (!sc.verify(']')) { this.clear(); return false; }
		}
		if (!sc.verify('}')) { this.clear(); return false; }
		return true;
	}
}

/** Extract an alternate representation of a DynamicTrees.
 *  @param ps is a DynamicTrees object
 *  @return a pair [paths, cost] where paths is a ListSet object that
 *  represents the paths in ps as lists and cost is an array, where
 *  cost[u] is the cost of the node u.
 */
function getPaths(ps) {
	let paths = new ListSet(ps.n);
	let cost = new Array(ps.n+1);
	for (let u = 1; u <= ps.n; u++) {
		if (ps.p(u) == 0)
			getPathsHelper(ps, u, 0, paths, cost);
	}
	return [paths, cost];
}
	
/** Recursive helper function for getPaths.
 *  Constructs path for a subtree and computes subtree costs
 *  @param ps is a DynamicTrees object
 *  @param u is a node in a tree representing a path
 *  @param mc is the mincost of the parent of u in the tree (or 0)
 *  @param paths is a ListSet object in which paths are returned
 *  @param cost is an array in which cost info is returned
 *  @return the first node of the path segment represented by the
 *  subtree with root u
 */
function getPathsHelper(ps, u, mc, paths, cost) {
	if (u == 0) return 0;
	mc += ps.dmin(u);
	cost[u] = mc + ps.dcost(u);
	let a = getPathsHelper(ps, ps.left(u), mc, paths, cost);
	let b = getPathsHelper(ps, ps.right(u), mc, paths, cost);
	return paths.join(paths.join(a,u),b);
}
