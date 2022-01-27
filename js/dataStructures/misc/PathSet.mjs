/** @file PathSet.mjs
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
import Scanner from '../basic/Scanner.mjs';

/** Data structure representing a collection of paths.
 *
 *  Paths can be split apart or joined together and each path node
 *  has a cost. Supports efficient search for the last mincost node.
 *  in a path. Paths may have successors (which are nodes in other paths)
 *  allowing the set of paths to define a set of trees.
 */
export default class PathSet extends Top {
	#left;		///< left child in tree representing a path
	#right;		///< right child in tree representing a path
	#p			///< parent in tree or the successor of a path
	#dcost;		///< #dcost[u] = cost(u)-mincost(u)
	#dmin;		///< #dmin[u] = mincost(u)-mincost(p(u)) 

	#splayCount;	///< number of splay operations
	#splaySteps;	///< number of splay steps
	
	/** Constructor for List object.
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
		this.#left = new Array(capacity+1).fill(0, 0, this.n+1);
		this.#right = new Array(capacity+1).fill(0, 0, this.n+1);
		this.#p = new Array(capacity+1).fill(0, 0, this.n+1);
		this.#dcost = new Array(capacity+1).fill(0, 0, this.n+1);
		this.#dmin = new Array(capacity+1).fill(0, 0, this.n+1);
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
			let nu = new PathSet(this.n, 
						 	  Math.max(n, Math.floor(1.25 * this.capacity)));
			nu.assign(this);
			this.xfer(nu);
		}
		this.#left.fill(0, this.n+1, n+1);
		this.#right.fill(0, this.n+1, n+1);
		this.#p.fill(0, this.n+1, n+1);
		this.#dcost.fill(0, this.n+1, n+1);
		this.#dmin.fill(0, this.n+1, n+1);
		this._n = n;
	}

	/** Assign new value to PathSet from another. 
	 *  @paran ps is a PathSet whose value is to be assigned to this
	 */
	assign(ps) {
		if (ps == this) return;
		if (ps.n > this.capacity) this.reset(ps.n);
		else { this.clear(); this._n = ps.n; }
		for (let i = 1; i <= this.n; i++) {
			this.#left[i] = ps.#left[i];
			this.#right[i] = ps.#right[i];
			this.#p[i] = ps.#p[i];
			this.#dcost[i] = ps.#dcost[i];
			this.#dmin[i] = ps.#dmin[i];
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param ps is a PathSet whose contents are to be transferred to this
	 */
	xfer(ps) {
		if (ps == this) return;
		this._n = ps.n;
		this.#left = ps.#left; ps.#left = null;
		this.#right = ps.#right; ps.#right = null;
		this.#p = ps.#p; ps.#p = null;
		this.#dcost = ps.#dcost; ps.#dcost = null;
		this.#dmin = ps.#dmin; ps.#dmin = null;
		this.clearStats();
	}
	
	/** Return to initial state */
	clear() {
		this.#left.fill(0, 0, this.n+1); this.#right.fill(0, 0, this.n+1);
		this.#p.fill(0, 0, this.n+1);
		this.#dcost.fill(0, 0, this.n+1); this.#dmin.fill(0, 0, this.n+1);
		this.clearStats();
	}

	/** Get the capacity of the list (max number of items it has space for). */
	get capacity() { return this.#left.length - 1; }
	
	/** Get the left child of a node.
	 *  @param u is a node in a path.
	 *  @return the left child of u in the tree representing the path
	 */
	left(u) { return this.#left[u]; }
	
	/** Get the right child of a node.
	 *  @param u is a node in a path.
	 *  @return the right child of u in the tree representing the path
	 */
	right(u) { return this.#right[u]; }
	
	/** Get the parent of a node.
	 *  @param u is a node in a path.
	 *  @return the parent of u in the tree representing the path
	 */
	p(u) { return this.#p[u]; }

	/** Get the successor of a path.
	 *  @param p is a path id
	 *  @return the successor vertex of p (or 0 if none)
	 */
	succ(p) { return -this.p(p); }

	/** Set the successor of a path.
	 *  @param p is a path id
	 *  @param u is a vertex in some other path that on return,
	 *  is the successor of p
	 */
	setSucc(p, u) { this.#p[p] = -u; }
	
	/** Get the deltaCost of a node.
	 *  @param u is a node in a path.
	 *  @return the deltaCost of u in the tree representing the path
	 */
	dcost(u) { return this.#dcost[u]; }
	
	/** Get the deltaMin of a node.
	 *  @param u is a node in a path.
	 *  @return the deltaMin of u in the tree representing the path
	 */
	dmin(u) { return this.#dmin[u]; }
	
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
	 *  @return the cost of u.
	 */
	cost(u) { return this.dcost(u) + this.mincost(u); }

	/** Perform a splay operation on the tree representing a path.
	 *  @param x is a node in some path; the operation does a splay operation
	 *  that moves x to the root of the search tree that represents the path
	 *  containing x
	 */
	splay(x) {
		this.#splayCount++;
		while (this.p(x) > 0) this.splaystep(x);
		return x;
	}
	
	/** Perform a single splay step.
	 *  @param x is a node in some path
	 */
	splaystep(x) {
		this.#splaySteps++;
		let y = this.p(x);
		if (y <= 0) return;
		let z = this.p(y);
		if (z <= 0) { this.rotate(x); return; }
		if (x == this.left(this.left(z)) || x == this.right(this.right(z)))
			this.rotate(y);
		else // x is "inner grandchild"
			this.rotate(x);
		this.rotate(x);
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
	
		// do the rotation
			 if (z > 0 && y == this.left(z))  this.#left[z] = x;
		else if (z > 0 && y == this.right(z)) this.#right[z] = x;
		this.#p[x] = z; this.#p[y] = x;
		if (x == this.left(y)) {
			this.#right[x] = y; this.#left[y] = b;
		} else {
			this.#left[x] = y; this.#right[y] = b;
		}
		if (b > 0) this.#p[b] = y;
	
		// update dmin, dcost values
		this.#dmin[a] += this.dmin(x); this.#dmin[b] += this.dmin(x);
	
		this.#dcost[x] = this.dcost(x) + this.dmin(x);
		let dmx = this.dmin(x);
		this.#dmin[x] = this.dmin(y);

		this.#dmin[y] = this.dcost(y);
		if (b > 0) this.#dmin[y] = Math.min(this.dmin(y),this.dmin(b)+dmx);
		if (c > 0) this.#dmin[y] = Math.min(this.dmin(y),this.dmin(c));
		this.#dcost[y] = this.dcost(y) - this.dmin(y);

		this.#dmin[b] -= this.dmin(y); this.#dmin[c] -= this.dmin(y);
	}
	
	/** Return the canonical element of some path.
	 *  @param u is a node in some path
	 *  @param nosplay is an optional flag that prevents the normal
	 *  restructuring of the tree
	 *  @return the node that is the canonical element of the path at the
	 *  start of the operation; the operation performs a splay at u,
	 *  so after the operation u is the path id.
	 */
	findpath(u, nosplay=false) {
		if (!nosplay) return this.splay(u);
		while (this.p(u) > 0) u = this.p(u);
		return u;
	}
	
	/** Return the last node in a path.
	 *  @param q is the id of some path
	 *  @return the last node in the path containing q; the returned
	 *  node is also the new path id
	 */
	findtail(q) {
		if (q == 0) return 0;
		while (this.right(q) != 0) q = this.right(q);
		return this.splay(q);
	}
	
	/** Add to the cost of every node in a path.
	 *  @param q is the canonical element of some path
	 *  @param x is the amount to be added to the costs of the nodes in
	 *  the path
	 */
	addpathcost(q, x) { this.#dmin[q] += x; }
	
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
		let dmin_u = this.dmin(u); let sq = this.p(q); // successor of path
		this.#left[u] = r; this.#right[u] = q;
		if (r == 0 && q == 0) {
			; // do nothing
		} else if (r == 0) {
			this.#dmin[u] = Math.min(this.dmin(u), this.dmin(q));
			this.#dmin[q] -= this.dmin(u);
			this.#p[q] = u;
		} else if (q == 0) {
			this.#dmin[u] = Math.min(this.dmin(u), this.dmin(r));
			this.#dmin[r] -= this.dmin(u);
			this.#p[r] = u;
		} else {
			this.#dmin[u] = Math.min(this.dmin(r), this.dmin(u), this.dmin(q));
			this.#dmin[r] -= this.dmin(u); this.#dmin[q] -= this.dmin(u);
			this.#p[r] = this.#p[q] = u;
		}
		this.#dcost[u] = dmin_u - this.dmin(u); this.#p[u] = sq;
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
		this.splay(u); let su = this.p(u); // successor of path
		let p = this.left(u); let q = this.right(u);
		this.#left[u] = this.#right[u] = this.#p[u] = 0;
		if (p != 0) { this.#dmin[p] += this.dmin(u); this.#p[p] = 0; }
		if (q != 0) { this.#dmin[q] += this.dmin(u); this.#p[q] = su; }
		this.#dmin[u] += this.dcost(u); this.#dcost[u] = 0;
		return [p,q];
	}
	
	/** Compare two PathSets for equality.
	 *
	 *  @param ps is the PathSet to be compared to this one
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order);
	 *  they need not have the same storage capacity to be equal
	 */
	equals(ps) {
		if (this == ps) return true;
		if (typeof ps == 'string') {
			let s = ps; ps = new PathSet(this.n); ps.fromString(s);
		} else if (!(ps instanceof PathSet)) {
			return false;
		}
		if (this.n != ps.n) return false;
		let [paths1, cost1] = this.getPaths();
		let [paths2, cost2] = ps.getPaths();
		for (let u = 1; u <= this.n; u++)
			if (cost1[u] != cost2[u]) return false;
		return paths1.equals(paths2);
	}

	/** Extract an alternate representation.
	 *  @return a pair [paths, cost] where paths is a ListSet object that
	 *  represents the paths in this as lists and cost is an array, where
	 *  cost[u] is the cost of the node u.
	 */
	getPaths() {
		let paths = new ListSet(this.n);
		let cost = new Array(this.n+1);
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) <= 0)
				this.getPathsHelper(u, 0, paths, cost);
		}
		return [paths, cost];
	}
		
	/** Recursive helper function for getPaths.
	 *  Constructs path for a subtree and computes subtree costs
	 *  @param u is a node in a tree representing a path
	 *  @param mc is the mincost of the parent of u in the tree (or 0)
	 *  @param paths is a ListSet object in which paths are returned
	 *  @param cost is an array in which cost info is returned
	 *  @return the first node of the path segment represented by the
	 *  subtree with root u
	 */
	getPathsHelper(u, mc, paths, cost) {
		if (u == 0) return 0;
		mc += this.dmin(u);
		cost[u] = mc + this.dcost(u);
		let a = this.getPathsHelper(this.left(u), mc, paths, cost);
		let b = this.getPathsHelper(this.right(u), mc, paths, cost);
		return paths.join(paths.join(a,u),b);
	}

	/** Create a string representation of a given list.
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(details=0, pretty=0, label=null) {
		let s = '{' + (pretty ? '\n' : '');
		let first = true;
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) <= 0) {
				if (first) first = false;
				else if (!pretty) s += ' ';
				else first = false;
				s += this.path2string(u, 0, details, label);
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
	path2string(q, mc=0, details=0, label=null) {
		if (q == 0) return '';
		let s = (this.p(q) <= 0 ? '[' : '');
		mc += this.dmin(q);
		let leaf = (this.left(q) == 0 && this.right(q) == 0);
		let showParens = details && this.p(q) > 0 && !leaf;
		if (showParens) s += '(';
		if (this.left(q) != 0)
			s += this.path2string(this.left(q), mc, details, label) + ' ';
		s += this.index2string(q, label) + (details && leaf ? '.' : ':');
		s += (details ? this.dmin(q) + ':' + this.dcost(q) :
						mc + this.dcost(q));
		if (this.right(q) != 0)
			s += ' ' + this.path2string(this.right(q), mc, details, label);
		if (showParens) s += ')';
		let pq = this.p(q);
		if (pq <= 0) s += ']';
		if (pq < 0) s += '->' + this.index2string(-pq);
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
		let items = new Set();
		let p = this.nextPath(sc, items);
		while (p > 0) p = this.nextPath(sc, items);
		if (p == -1 || !sc.verify('}')) { this.clear(); return false; }
		return true;
	}

	/** Get the next path from scanner.
	  * @param sc is a Scanner
	  * @param items is a Set of items already seen
	  * @return the path id on success, 0 if no new path in input stream,
	  * if parse of path failed
	  */
	nextPath(sc, items) {
		let path = new List();
		if (!sc.verify('[')) return 0
		let u = sc.nextIndex(); let p = u;
		let mc = Infinity;
		for (let v = u; v != 0; v = sc.nextIndex()) {
			if (items.has(v)) return -1;
			if (v > this.n) this.expand(v);
			if (!sc.verify(':')) return -1;
			let cost = sc.nextNumber();
			if (isNaN(cost)) return -1;
			mc = Math.min(mc, cost);
			path.enq(v, [mc,cost]);
			if (v != u) p = this.join(p,v,0);
		}
		// second pass to compute differential costs
		for (let v = path.first(); v != 0; v = path.next(v)) {
			let val = path.value(v);
			this.#dcost[v] = val[1] - val[0];
			if (this.p(v) <= 0) {
				this.#dmin[v] = val[0];
			} else {
				let pmc = path.value(this.p(v))[0];
				this.#dmin[v] = val[0] - pmc;
			}
		}
		if (!sc.verify(']')) return -1;
		if (sc.verify('->')) {
			let v = sc.nextIndex();
			if (v == 0) return -1;
			this.setSucc(p, v);
		} else {
			this.setSucc(p, 0);
		}
		return p;
	}

	clearStats() { this.#splayCount = this.#splaySteps = 0; }

    /** Return statistics object. */
    getStats() {
        return {
            'splayCount' : this.#splayCount, 'splaySteps' : this.#splaySteps
        };
    }
}
