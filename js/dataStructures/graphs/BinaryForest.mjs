/** @file BinaryForest.mjs
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

/** This class implements a generic binary tree class.
 *  It partitions the index set into multiple trees.
 */
export default class BinaryForest extends Top {
	#left;		// #left[u] is left child of u
	#right;		// #right[u] is right child of u
	#p;			// #p[u] is parent of u

	steps;				// total steps

	/** Constructor for BinaryForest object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, capacity=n) { super(n); this.#init(capacity); }
	
	/** Allocate space and initialize BinaryForest object.
	 *  @param capacity is the maximum range
	 */
	#init(capacity) {
		this.#left = new Int32Array(capacity+1);
		this.#right = new Int32Array(capacity+1);
		this.#p = new Int32Array(capacity+1);
		this.clearStats();
	}

	/** Reset the tree discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=n) {
		assert(capacity >= n); this._n = n; this.#init(capacity);
	}
	
	/** Assign a new value by copying from another BinaryForest.
	 *  @param b is another BinaryForest
	 */
	assign(b) {
		if (b == this) return;
		if (b.n > this.n) { reset(b.n, b.d); }
		else { clear(); this._n = b.n; }

		for (u = 1; u <= b.n; u++) {
			this.left(u, b.left(u)); this.right(u, b.right(u));
			this.p(u, b.p(u));
		}
		this.clearStats();
	}

	/** Assign a new value by transferring from another BinaryForest.
	 *  @param b is another BinaryForest
	 */
	xfer(b) {
		if (b == this) return;
		if (!(b instanceof BinaryForest)) return;
		this.#left = b.#left; this.#right = b.#right; this.#p = b.#p;
		b.#left = b.#right = b.#p = null;
		this.clearStats();
	}
	
	/** Expand the space available for this BinaryForest.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this.capacity) {
			let nu = new BinaryForest(this.n,
							  Math.max(n, ~~(1.5 * this.capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this._n = n;
	}

	/** Convert all nodes to singleton trees. */
	clear() {
		for (let u = 1; u <= this.n; u++) {
			this.left(u,0); this.right(u,0); this.p(u,0);
		}
		this.clearStats();
	}

	clearStats() {
		this.steps = 0;
	}

	/** Get the capacity of the object. */
	get capacity() { return this.#left.length-1; }

	/* Get or set the left child of a node.
	 * @param u is a node
	 * @param v is an optional new left child for u
	 * @return the left child of u
	 */
	left(u, v=-1) {
		if (v >= 0) this.#left[u] = v;
		return this.#left[u];
	}

	/* Get or set the right child of a node. */
	right(u, v=-1) {
		if (v >= 0) this.#right[u] = v;
		return this.#right[u];
	}

	/* Get or set the parent of a node. */
	p(u, v=-1) {
		if (v >= 0) this.#p[u] = v;
		return this.#p[u];
	}

	/* Get the sibling of a node. */
	sibling(u) {
		let p = this.p(u);
		return (u == this.left(p) ? this.right(p) : this.left(p));
	}

	/** Get grandparent of a node. */
	gp(x) { return this.p(this.p(x)); }

	/** Get aunt of a node (parent's sibling) */
	aunt(x) { return this.sibling(this.p(x)); }

	/** Get nephew of a node (far child of sibling) */
	nephew(x) {
		let sib = this.sibling(x);
		return x == this.left(this.p(x)) ? this.right(sib) : this.left(sib);
	}

	/** Get neice of a node (near child of sibling) */
	neice(x) {
		let sib = this.sibling(x);
		return x == this.left(this.p(x)) ? this.left(sib) : this.right(sib);
	}

	/** Determine if node is an inner grandchild. */
	inner(x) {
		let gp = this.gp(x);
		return x != 0 && (x == this.left(this.right(gp)) ||
						  x == this.right(this.left(gp))); 
	}

	/** Determine if node is an outer grandchild. */
	outer(x) {
		let gp = this.gp(x);
		return x != 0 && (x == this.left(this.left(gp)) ||
						  x == this.right(this.right(gp))); 
	}

	/** Determine if node is a singleton. */
	singleton(u) {
		return this.p(u) == 0 && this.left(u) == 0 && this.right(u) == 0;
	}

	// Methods for iteration. Iterates through items in "infix" order,
	// (that is, left-to-right). Note, iterating through a subtree of
	// of k items takes time proportional to k, although individual
	// steps may take more than constant time.

	/** Get the item with leftmost item in a subtree. */
	first(u) {
		while (this.left(u)) { u = this.left(u); this.steps++; }
		return u;
	}

	/** Get the item with the rightmost item in a subtree. */
	last(u) {
		while (this.right(u)) { u = this.right(u); this.steps++; }
		return u;
	}

	/** Get the item with the next larger key within a subtree. */
	next(u,root=0) {
		if (this.right(u) != 0) {
			for (u = this.right(u); this.left(u); u = this.left(u)) {
				this.steps++;
			}
			return u;
		}
		let c = u; u = this.p(u);
		while (u != this.p(root) && c == this.right(u)) {
			c = u; u = this.p(u); this.steps++;
		}
		return u != this.p(root) ? u : 0;
	}

	/** Get the item with the next smaller key. */
	prev(u,root=-) {
		if (this.left(u) != 0) {
			for (u = this.left(u); this.right(u); u = this.right(u)) {
				this.steps++;
			}
			return u;
		}
		let c = u; u = this.p(u);
		while (u != this.p(root) && c == this.left(u)) {
			c = u; u = this.p(u); this.steps++;
		}
		return u != this.p(root) ? u : 0;
	}

	/** Perform a rotation in a tree.
	 *  @param x is a node in some tree; this method
	 *  moves x up into its parent's position
	 */
	rotate(x) {
		this.steps++;
		let px = this.p(x); let gpx = this.p(px);
		if (px == 0) return;
		let cx = 0;
		if (x == this.left(px)) {
			cx = this.right(x); this.left(px, cx); this.right(x, px);
		} else {
			cx = this.left(x); this.right(px, cx); this.left(x, px);
		}
		this.p(px, x); if (cx != 0) this.p(cx, px);
			 if (px == this.left(gpx)) this.left(gpx, x);
		else if (px == this.right(gpx)) this.right(gpx, x);
		this.p(x, gpx);
	}
	
	/** Perform a double-rotation on a tree.
	 *  @param x is a node in the tree; the operation moves x into
	 *  its grandparent's position.
	 */
	rotate2(x) {
			if (this.outer(x))  { this._rotate(this.p(x)); this._rotate(x); }
	    else if (this.inner(x)) { this._rotate(x); this._rotate(x); }
	}

	/** Find the root of the tree containing u. */
	find(u) {
		while (this.p(u) != 0) {
			u = this.p(u); this.steps++;
		}
		return u;
	}

	/** Remove a subtree. */
	cut(u) {
		let pu = this.p(u);
		if (pu && u == this.left(pu))  this.left(pu,0);
		if (pu && u == this.right(pu)) this.right(pu,0);
		this.p(u,0);
		return u;

	/** Link one tree to another. */
	link(u,v,side=-1) {
		assert(!this.p(u));
		this.p(u,v);
		if (side < 0) {
			assert(!this.left(v));
			this.left(v,u);
		} else {
			assert(!this.right(v));
			this.right(v,u);
		}
	}

	/** Swap the positions of two nodes in same tree. */
	_swap(u, v) {
		this.steps++;
		// save pointer fields for items u and v
		let lu = this.left(u); let ru = this.right(u); let pu = this.p(u);
		let lv = this.left(v); let rv = this.right(v); let pv = this.p(v);
	
		// fixup fields in u's neighbors
		if (lu != 0) this.p(lu, v);
		if (ru != 0) this.p(ru, v);
		if (pu != 0) {
			if (u == this.left(pu)) this.left(pu, v);
			else this.right(pu, v);
		}
		// fixup fields in j's neighbors
		if (lv != 0) this.p(lv, u);
		if (rv != 0) this.p(rv, u);
		if (pv != 0) {
			if (v == this.left(pv)) this.left(pv, u);
			else this.right(pv, u);
		}
	
		// update fields in nodes u and v
		this.left(u, lv); this.right(u, rv); this.p(u, pv);
		this.left(v, lu); this.right(v, ru); this.p(v, pu);
	
		// final fixup for the case that u was originally the parent of v
			 if (v == lu) { this.left(v, u); this.p(u, v); }
		else if (v == ru) { this.right(v, u); this.p(u, v); }
	}

	/** Join two trees at a node.
	 *  @param t1 is a tree
	 *  @param t2 is a second tree
	 *  @param u is a singleton tree
	 *  @return root of new tree formed by joining t1, u and t2.
	 */
	join(t1, u, t2) {
		assert( (t1 == 0 || this.valid(t1)) &&
				(t2 == 0 || this.valid(t2)) && this.valid(u));
		this.left(u,t1); this.right(u,t2);
		if (t1 != 0) this.p(t1,u);
		if (t2 != 0) this.p(t2,u);
		this.p(u,0);
		return u;
	}

	/** Split a tree on a node.
	 *  @param u is a node in a tree
	 *  @return a pair [t1,t2] where t1 has the nodes that were to the
	 *  the left of u and t2 has the nodes that were to the right of u
	 */
	split(u) {
		assert(this.valid(u));
		let v = u; let w = this.p(v);
		let [l,r] = [this.left(u), this.right(u)];
		while (w != 0) {
			this.steps++;
			let pw = this.p(w); // get this now, since join may change it
			if (v == this.left(w))  r = this.join(r, w, this.right(w));
			else			  		l = this.join(this.left(w), w, l);
			v = w; w = pw;
		}
		this.left(u,0); this.right(u,0); this.p(u,0);
		this.p(l,0); this.p(r,0);
		return [l, r];
	}

	/** Append one tree after another
	 *  @param u is the root of tree
	 *  @param v is the root of a second tree with key values >= those
	 *  in u's subtree
	 *  @return subtree formed by combining the two
	 */
	append(u,v) {
		let t = this.last(u);
		let [t1,t2] = this.split(t);
		return this.join(t1,t,v);
	}

	/** Determine if two BinaryForest are objects are equal.
	 */
	equals(bt) {
		if (this === bt) return true;
		if (typeof bt == 'string') {
			let s = bt; bt = new BinaryForest(this.n); bt.fromString(s);
		}
		if (!(bt instanceof BinaryForest) || bt.n != this.n)
			return false;
		for (let u = 1; u <= this.n; u++) {
			if (this.left(u) != bt.left(u) || this.right(u) != bt.right(u) ||
				this.p(u) != bt.p(u))
				return false;
		}
	}

	/** Determine if two BinaryForest objects represent the same sets.
	 *  @param bt is a BinaryForest object to be compared to this
	 *  @return true if both represent the same sets.
	 */
	matches(bt) {
		if (this === bt) return true;
		if (typeof bt == 'string') {
			let s = bt; bt = new BinaryForest(this.n); bt.fromString(s);
		}
		if (!(bt instanceof BinaryForest) || bt.n != this.n)
			return false;
		let l = new List(this.n);
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u)) continue;
			l.clear();
			for (let v = this.first(u); v; v = this.next(v)) l.enq(v);
			for (let v = bt.first(bt.find(u)); v; v = bt.next(v))
				if (!l.contains(v)) return false;
		}
		return true;
	}

	/** Determine if two BinaryForest objects consist of
	 *  trees with matching in-fix node orders (left-to-right).
	 *  @param bt is a BinaryForest object to be compared to this
	 *  @return true if the trees in both contain the same nodes
	 *  and in the same order (not necessarily matching tree structures);
	 *  otherwise return false
	 */
	matchesOrder(bt) {
		if (this === bt) return true;
		if (typeof bt == 'string') {
			let s = bt; bt = new BinaryForest(this.n); bt.fromString(s);
		}
		if (!(bt instanceof BinaryForest) || bt.n != this.n)
			return false;
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u)) continue;
			let r1 = u; let r2 = bt.find(u);
			let v1 = this.first(r1); let v2 = bt.first(r2);
			while (v1 == v2 && v1 != 0) {
				v1 = this.next(v1,r1); v2 = bt.next(v2,r2);
			}
			if (v1 != v2) return false;
		}
		return s1.equals(s2);
	}
	
	/** Produce a string representation of the heap.
	 *  @param details is a flag that (when true) causes implementation
	 *  details to be shown.
	 *  @param pretty is a flag that (when true) produces a more readable
	 *  representation
	 *  @param label is a function that is used to label heap items
	 *  numerical values, not letters.
	 *  @param u is intended only for recursive calls to toString; it
	 *  identifies a position in the heap structure
	 */
	toString(details=0, pretty=0, label=0, u=1) {
		let s = '';
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) != 0) continue;
			if (!details && this.singleton(u)) continue;
			let ss = this.tree2string(u, details, pretty, label);
			if (s.length > 0 && ss.length > 0)
				s += pretty ? '\n' : ' ';
			s += ss;
		}
		return pretty ? '{\n' + s + '\n}' : '{' + s + '}';
	}

	/** Recursive helper for constructing a string representation of a tree.
	 *  @param u is a node in one of the trees of the heap
	 *  @param isroot is true if h is the canonical element of the heap
	 *  @return the string
	 */
	tree2string(u, details=0, pretty=0, label, isroot=1) {
		if (u == 0) return '';
		if (!details && this.singleton(u)) return '';
		let s = '';
		if (this.left(u) == 0 && this.right(u) == 0) {
			if (details && isroot) s += '*';
			s += this.x2s(u, label);
			return (details || isroot) ? '(' + s + ')' : s;
		}
		let ls = this.tree2string(this.left(u), details,pretty,label,0);
		let rs = this.tree2string(this.right(u), details,pretty,label,0);
		let cs = this.x2s(u, label);
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

	/** Initialize this BinaryForest object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let n = 0; let sets = []; let items = new Set();
		for (let l = sc.nextIndexList('(',')'); l;
				 l = sc.nextIndexList('(',')')) {
			for (let i of l) {
				n = Math.max(n,i);
				if (items.has(i)) return null;
				items.add(i);
			}
			sets.push(l);
		}
		if (!sc.verify('}')) return false;
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let l of sets) {
			let s = l[0];
			for (let i of l) {
				s = this.insert(i, s);
			}
		}
		return true;
	}

	/** Return statistics object. */
	getStats() {
		return { 'steps' : this.steps };
	}
}
