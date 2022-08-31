/** @file Forest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs'
import Top from '../Top.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';

/** Data structure for collection of undirected trees.
 */
export default class Forest extends Top {
	#roots;		// is first root in root list
	#sibs;		// lists of siblings (and tree roots)
	#p;			// #p[u] is parent of u or 0
	#c;			// #c[u] is first child of u or 0

	steps;		// number of steps

	/** Construct Forest with space for a specified # of nodes.
	 *  @param n is the number of nodes in the forest
	 *  @param cap is the initial capacity (defaults to n)
	 */
	constructor(n, capacity) {
		super(n);
		if (!capacity) capacity = this.n;
		this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n > 0 && capacity >= this.n,`${this.n} ${capacity}`);
		this.#sibs= new ListSet(this.n, capacity);
		this.#roots = 1;
		for (let u = 2; u <= this.n; u++) 
			this.#roots = this.#sibs.join(this.#roots, u);
		this.#p = new Int32Array(capacity+1);
		this.#c = new Int32Array(capacity+1);
		this.steps = 0;
	}

	reset(n, capacity=n) {
		assert(n > 0 && capacity >= n);
		this._n = n; this.#init(capacity);
	}

	get capacity() { return this.#p.length-1; }

	expand(n) {
		if (n <= this.n) return;
		if (n > this.capacity) {
			let capacity = (n <= this.capacity ? this.capacity :
							 Math.max(n, ~~(1.5*this.capacity)));
			let nu = new Forest(this.n, capacity);
			nu.assign(this); this.xfer(nu);
		}
		this._n = n;
	}

	/** Assign one graph to another.
	 *  @param g is another graph that is to replace this one.
	 */
	assign(f) {
		assert(f instanceof Forest);
		if (f == this) return;
		if (f.n > this.capacity) {
			this.reset(f.n);
		} else {
			this.clear(); this._n = f.n;
		}
		for (let u = 1; u <= this.n; u++) {
			for (let c = f.firstChild(u); c != 0; c = f.nextSibling(c))
				this.link(c,u);
		}
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph that is to replace this one.
	 */
	xfer(f) {
		assert(f instanceof Forest);
		if (f == this) return;
		this._n = f.n; this.#roots = f.#roots;
		this.#sibs = f.#sibs; this.#p = f.#p; this.#c = f.#c;
		f.#sibs = f.#p = f.#c = null;
	}

	/** Convert all trees to singletons. */
	clear() {
		this.#sibs.clear();
		this.#roots = 1;
		for (let u = 2; u <= this.n; u++) 
			this.#roots = this.#sibs.join(this.#roots, u);
		this.#p.fill(0); this.#c.fill(0);
	}

	firstTree() { return this.#roots; }

	nextTree(u) { return this.#sibs.next(u); }

	/** Get the parent of a node.
	 *  @param u is a node in the forest
	 *  @return the u's parent or 0.
	 */
	parent(u) { return this.#p[u]; }

	/** Get the first child of a node.
	 *  @param u is a node in the forest
	 *  @return the u's first child or 0.
	 */
	firstChild(u) { return this.#c[u]; }

	/** Get the last child of a node.
	 *  @param u is a node in the forest
	 *  @return the u's last child or 0.
	 */
	lastChild(u) { return this.#sibs.last(this.#c[u]); }
	
	/** Get the sibling of a node.
	 *  @param u is a node in a tree
	 *  @return the next sibling of u, or 0
	 */
	nextSibling(u) { return this.#sibs.next(u); }

	/** Get the root of a tree containing a node.
	 *  @param u is a node in some tree
	 *  @return the tree root
	 */
	root(u) {
		while (this.parent(u) != 0)  {
			u = this.parent(u); this.steps++;
		}
		return u;
	}

	/** Return the first leaf descendant of a node */
	firstLeaf(u) {
		while (this.firstChild(u)) {
			u = this.firstChild(u); this.steps++;
		}
		return u;
	}

	/** Return the next leaf descendant of a node.
	 *  @param u is a tree node
	 *  @param v is a descendant of u that is also a leaf
	 *  @return the next leaf in the left-to-right ordering
	 */
	nextLeaf(u,v) {
		while (v != u) {
			this.steps++;
			if (this.nextSibling(v))
				return this.firstLeaf(this.nextSibling(v));
			v = this.parent(v);
		}
		return 0;
	}

	/** Return the last leaf descendant of a node */
	lastLeaf(u) {
		while (this.lastChild(u)) {
			u = this.lastChild(u); this.steps++;
		}
		return u;
	}

	/** Return the first descendant of a node in the prefix ordering. */
	firstDescendant(u) { return this.firstChild(u); }

	/** Return the next descendant of a node in prefix ordering.
	 *  @param u is a tree node
	 *  @param v is a proper descendant of u
	 *  @return the next descendant of u following v
	 */
	nextDescendant(u,v) {
		if (this.firstChild(v)) return this.firstChild(v);
		do {
			this.steps++;
			if (this.nextSibling(v)) return this.nextSibling(v);
			v = this.parent(v);
		} while (v != u);
		return 0;
	}
	
	/** Link one tree to another.
	 *  @param u is the root of a tree.
	 *  @param v is a node in some other tree
	 */
	link(u, v) {
		assert(u != v && u > 0 && v > 0);
		if (u > this.n || v > this.n) {
			this.expand(Math.max(this.n, u, v));
		}
		assert(this.valid(u) && this.valid(v), 'invalid argument');
		assert(this.parent(u) == 0, 'arg1 must be a tree root');

		this.#roots = this.#sibs.delete(u, this.#roots);
		this.#c[v] = this.#sibs.join(this.firstChild(v), u);
		this.#p[u] = v;
	}

	/** Remove a subtree.
	 *  @param u is a node in a tree; on return it is a tree root
	 */
	cut(u) {
		if (this.parent(u) == 0) return;
		let p = this.#p[u]; let firstSib = this.firstChild(p);
		this.#c[p] = this.#sibs.delete(u, firstSib);
		this.#roots = this.#sibs.join(this.#roots, u);
		this.#p[u] = 0;
	}

	/** Rotate the children of a node in the tree
	 *  @param u is a node in a tree
	 *  @param c is a child of u; on return c is the first child
	 *  in u's list of children
	 */
	rotate(u,c) {
		let f = this.firstChild(u);
		this.#sibs.rotate(f, c); this.#c[u] = c;
	}
	
	/** Compare another forest to this one.
	 *  @param f is a Forest object or a string representation of a Forest
	 *  @return true if f is equal to this; when f is a string, it is used
	 *  to construct a Forest for comparison.
	 */
	equals(f) {
		if (f == this) return true;
		if (typeof f == 'string') {
			let s = f; f = new Forest(this.n); f.fromString(s); 
		}
        if (!(f instanceof Forest)) return false;
		if (f.n != this.n) return false;

		for (let u = 1; u <= this.n; u++)
			if (this.parent(u) != f.parent(u)) return false;

		return true;
	}
	
	/** Construct a string representation of this forest.
	 *  @pretty is a flag that controls how the string is formatted
	 *  (false => all on one line, true => one tree per line)
	 *  @pretty details is an optional function used to generate
	 *  the node labels
	 *  @return the string
	 */
	toString(details=0, pretty=0, label=0) {
		let s = '';
		for (let t = this.firstTree(); t != 0; t = this.nextTree(t)) {
			if (!details && !this.firstChild(t)) continue;
			if (!pretty && s != '') s += ' ';
			s += this.tree2string(t, label);
			if (pretty) s += '\n'; // one tree per line
		}
		return pretty ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Create a string representation of one tree.
	 *  @param t is a the root of a tree or subtree
	 *  @return a string that represents the tree
	 */
	tree2string(t, label=0) {
		let s = this.index2string(t,label);
		if (this.firstChild(t) == 0) return s;
		s += '[';
		for (let c = this.firstChild(t); c != 0; c = this.nextSibling(c)) {
			if (c != this.firstChild(t)) s += ' ';
			s += this.tree2string(c,label);
		}
		return s + ']';
	}
		
	/** Initialize this Forest object from a string.
	 *  @param s is a string representing a forest
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let n = 0; let items = new Set(); let map = new Array();
		while (!sc.verify('}')) {
			let p = this.buildMap(sc, items, map);
			if (p == null) return null;
			let [v,nv] = p;
			map.push([v,0]);
			n = Math.max(n, nv);
		}
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let p of map) {
			let [u,v] = p;
			if (v) this.link(u,v);
		}
		return true;
	}

	/** Scan the input for a subtree and compute node to parent map.
	 *  @param sc is a Scanner for the input string
	 *  @param items is a set of node indices seen so far
	 *  @param map is an array of pairs [u,v] where v is the
	 *  parent of u
	 *  @return pair [u,n] where u is the root of the next subtree
	 *  in the input and n is the maximum index in the subtree at u
	 */
	buildMap(sc, items, map) {
		let u = sc.nextIndex();
		if (u == 0) return [0,0];
		if (items.has(u)) return null;
		items.add(u);
		let n = u;
		if (!sc.verify('[')) return [u,n];
		while (!sc.verify(']')) {
			let p = this.buildMap(sc, items, map);
			if (p == null) return null;
			let [v,nv] = p;
			map.push([v,u]);
			n = Math.max(n, nv);
		}
		return [u,n];
	}

	getStats() {
		return { 'steps': this.steps };
	}
}
