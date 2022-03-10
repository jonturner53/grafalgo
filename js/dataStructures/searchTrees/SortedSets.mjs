/** @file SortedSets.mjs
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

/** This class implements a generic binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class SortedSets extends Top {
	#left;		 ///< #left[u] is left child of u
	#right;		///< #right[u] is right child of u
	#p;			///< #p[u] is parent of u
	#key;		  ///< #key[u] is key of u

	_insertSteps;		// steps for insert method
	_deleteSteps;		// steps for delete method
	_splitSteps;		// steps for split method
	_accessSteps;		// steps for access method
	_findSteps;			// steps for find method

	/** Constructor for SortedSets object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, capacity=n) { super(n); this.#init(capacity); }
	
	/** Allocate space and initialize SortedSets object.
	 *  @param capacity is the maximum range
	 */
	#init(capacity) {
		this.#left = new Int32Array(capacity+1);
		this.#right = new Int32Array(capacity+1);
		this.#p = new Int32Array(capacity+1);
		this.#key = new Float32Array(capacity+1);
		this.clearStats();
	}

	/** Reset the tree discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=n) {
		assert(capacity >= n); this._n = n; this.#init(capacity);
	}
	
	/** Assign a new value by copying from another SortedSets.
	 *  @param b is another SortedSets
	 */
	assign(b) {
		if (b == this) return;
		if (b.n > this.n) { reset(b.n, b.d); }
		else { clear(); this._n = b.n; }

		for (u = 1; u <= b.n; u++) {
			this.left(u, b.left(u)); this.right(u, b.right(u));
				this.p(u, b.p(u)); this.key(u, b.key(u));
			}
			this.clearStats();
		}

		/** Assign a new value by transferring from another SortedSets.
		 *  @param b is another SortedSets
		 */
		xfer(b) {
			if (b == this) return;
			if (!(b instanceof SortedSets)) return;
			this.#left = b.#left; this.#right = b.#right;
			this.#p = b.#p; this.#key = b.#key;
			b.#left = b.#right = b.#p = b.#key = null;
			this.clearStats();
		}
		
		/** Expand the space available for this SortedSets.
		 *  Rebuilds old value in new space.
		 *  @param size is the size of the resized object.
		 */
		expand(n) {
			if (n <= this.n) return;
			if (n > this.capacity) {
				let nu = new SortedSets(this.n,
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
			this._insertSteps = this._deleteSteps = this._splitSteps = 0;
			this._accessSteps = this._findSteps = 0;
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

		/* Get the key of a node. */
		key(u) { return this.#key[u]; }

		/* Set the key of a node. */
		setkey(u, k) { this.#key[u] = k; }

		/* Get the sibling of a node. */
		sibling(u) {
			let p = this.p(u);
			return (u == this.left(p) ? this.right(p) : this.left(p));
		}

		/** Get grandparent of a node. */
		gp(x) { return this.p(this.p(x)); }

		/** Get uncle of a node */
		uncle(x) { return this.sibling(this.p(x)); }

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

		// Methods for iteration. Note, iterating through a set of
		// of k items takes time proportional to k, although individual
		// steps may take more than constant time.

		/** Get the item with smallest key. */
		first(u) {
			while (this.left(u)) u = this.left(u);
			return u;
		}

		/** Get the item with the largest key. */
		last(u) {
			while (this.right(u)) u = this.right(u);
			return u;
		}

		/** Get the item with the next larger key. */
		next(u) {
			if (this.right(u) != 0) {
				for (u = this.right(u); this.left(u) != 0; u = this.left(u)) {}
			} else {
				let c = u; u = this.p(u);
				while (u != 0 && this.right(u) == c) { c = u; u = this.p(u); }
			}
			return u;
		}

		/** Get the item with the next smaller key. */
		prev(u) {
			if (this.left(u) != 0) {
				for (u = this.left(u); this.right(u) != 0; u = this.right(u)) {}
			} else {
				let c = u; u = this.p(u);
				while (u != 0 && this.left(u) == c) { c = u; u = this.p(u); }
			}
			return u;
		}

		/** Perform a rotation in a search tree.
		 *  @param x is a node in some search tree; this method
		 *  moves x up into its parent's position
		 */
		rotate(x) {
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
		
		/** Perform a double-rotation on a search tree.
		 *  @param x is a node in the search tree; the operation moves x into
		 *  its grandparent's position.
		 */
		rotate2(x) {
			if (this.outer(x))      { this.rotate(this.p(x)); this.rotate(x); }
	    else if (this.inner(x)) { this.rotate(x); this.rotate(x); }
	}


	/** Find the id of the set containing u. */
	find(u) {
		while (this.p(u) != 0) {
			u = this.p(u); this._findSteps++;
		}
		return u;
	}

	/** Find an item with a specified key
	 *  @param k is key to be found
	 *  @param t is id (root) of bst
	 *  @return node u where key(u)==k or 0 if there is no such node
	 */
	access(k, t) {
		let u = t;
		while (u != 0 && this.key(u) != k) {
			this._accessSteps++;
			if (k < this.key(u)) u = this.left(u);
			else				 u = this.right(u);
		}
		return u;
	}

	/** Insert an item into a set.
	 *  @param u is an item to be inserted
	 *  @param t is the id for a set (the root of the bst)
	 *  @return the id of the set following insertion
	 */
	insert(u, t) {
		assert(this.valid(u) && this.singleton(u) && (t == 0 || this.valid(t)));
		if (t == 0 || t == u) return u;
		let v = t; let pv = 0;
		while (v != 0) {
			pv = v; this._insertSteps++;
			if (this.key(u) <= this.key(v)) v = this.left(v);
			else							v = this.right(v);
		}
		if (this.key(u) <= this.key(pv)) this.left(pv, u);
		else							 this.right(pv, u);
		this.p(u, pv);
		return t;
	}

	/** Swap the positions of two nodes in same tree.
	 *  Helper function used by delete.
	 */
	swap(u, v) {
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

	/** Delete an item from a set.
	 *  @param u is an item in a set
	 */
	delete(u) {
		assert(this.valid(u));
		if (this.left(u) != 0 && this.right(u) != 0) {
			let pu; // find prev(u) and count steps
			for (pu = this.left(u); this.right(pu) != 0; pu = this.right(pu)) {
				this._deleteSteps++;
			}
			swap(u, pu);
		}
		// now, u has at most one child
		let c = (this.left(u) != 0 ? this.left(u) : this.right(u));
		// c is now the only child that could be non-null
		let pu = this.p(u);
		if (c != 0) this.p(c, pu);
		if (pu != 0) {
				 if (u ==  this.left(pu))  this.left(pu, c);
			else if (u == this.right(pu)) this.right(pu, c);
		}
		this.p(u,0); this.left(u,0); this.right(u,0);
	}

	/** Join two trees a node.
	 *  @param t1 is a search tree
	 *  @param t2 is a second search tree
	 *  @param u is a node with key >= all keys in t1
	 *  and <= all keys in t2
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
	 *  @return a pair [t1, t2] where t1 has keys <= key(u) and t2 has
	 *  keys >= key(u)
	 */
	split(u) {
		assert(this.valid(u));
		let v = u; let w = this.p(v);
		let [l,r] = [this.left(u), this.right(u)];
		while (w != 0) {
			this._splitSteps++;
			let pw = this.p(w); // get this now, since join may change it
			if (v == this.left(w))  r = this.join(r, w, this.right(w));
			else			  		l = this.join(this.left(w), w, l);
			v = w; w = pw;
		}
		this.left(u,0); this.right(u,0); this.p(u,0);
		this.p(l,0); this.p(r,0);
		return [l, r];
	}

	/** Determine if two SortedSets objects are equal.
	 *  @param bst is a SortedSets object to be compared to this
	 *  @return true if both represent the same sets and the
	 *  keys match; otherwise return false
	 */
	equals(bst) {
		if (this === bst) return true;
		if (typeof bst == 'string') {
			let s = bst; bst = new SortedSets(this.n); bst.fromString(s);
		}
		if (!(bst instanceof SortedSets) || bst.n != this.n)
			return false;
		let s1 = new Sets(this.n); let s2 = new Sets(this.n);
		for (let u = 1; u <= this.n; u++) {
			if (this.key(u) != bst.key(u)) return false;
			if (this.p(u) != 0) {
				let fu = s1.find(u); let fp = s1.find(this.p(u));
				if (fu != fp) s1.link(fu, fp);
			}
			if (bst.p(u) != 0) {
				let fu = s2.find(u); let fp = s2.find(bst.p(u));
				if (fu != fp) s2.link(fu, fp);
			}
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
	tree2string(u, details=false, pretty=false, label, isroot=true) {
		if (u == 0) return '';
		let s = '';
		if (this.left(u) == 0 && this.right(u) == 0) {
			s += this.index2string(u, label) + ":" + this.key(u);
			return (details || isroot && s.length > 0) ? '(' + s + ')' : s;
		}
		let ls = this.tree2string(this.left(u), details,pretty,label,false);
		let rs = this.tree2string(this.right(u), details,pretty,label,false);
		let cs = this.index2string(u, label) + ":" + this.key(u);
		if (details && isroot) cs = '*' + cs;
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

	/** Initialize this SortedSets object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let n = 0; let sets = []; let items = new Set();
		for (let l= sc.nextPairList('(',')'); l; l= sc.nextPairList('(',')')) {
			for (let [i,k] of l) {
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
			let s = l[0][0];
			for (let [i,k] of l) {
				this.setkey(i, k); s = this.insert(i, s, k);
			}
		}
		return true;
	}

	/** Return statistics object. */
	getStats() {
		return {
			'insert' : this._insertSteps, 'delete' : this._deleteSteps,
			'splitSteps' : this._splitSteps,
			'access' : this._accessSteps, 'find': this._findSteps
		};
	}
}
