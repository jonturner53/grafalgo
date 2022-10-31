/** @file Forest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs'
import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';

/** Data structure for collection of undirected trees.
 */
export default class Forest extends Top {
	#sibs;		// lists of siblings (and tree roots)
	#p;			// #p[u] is parent of u or 0
	#c;			// #c[u] is first child of u or 0

	steps;		// number of steps

	/** Construct Forest with space for a specified # of nodes.
	 *  @param n is the number of nodes in the forest
	 *  @param cap is the initial capacity (defaults to n)
	 */
	constructor(n=10, capacity=n) {
		super(n);
		this.#sibs= new ListSet(n,capacity);
		this.#p = new Int32Array(capacity+1);
		this.#c = new Int32Array(capacity+1);
		this.steps = 0;
	}

	get capacity() { return this.#p.length-1; }

	expand(n) {
		super.expand(n); this.#sibs.expand(n);
	}

	/** Assign one graph to another.
	 *  @param g is another graph that is to replace this one.
	 */
	assign(f) {
		if (f == this || !(f instanceof Forest)) return;
		if (f.n > this.capacity) this.reset(f.n);
		else { this.clear(); this._n = f.n; }
		for (let u = 1; u <= this.n; u++) {
			for (let c = f.firstChild(u); c != 0; c = f.nextSibling(c)) {
				this.link(c,u);
			}
		}
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph that is to replace this one.
	 */
	xfer(f) {
		if (f == this || !(f instanceof Forest)) return;
		this._n = f.n;
		this.#sibs = f.#sibs; this.#p = f.#p; this.#c = f.#c;
		f.#sibs = f.#p = f.#c = null;
	}

	/** Convert all trees to singletons. */
	clear() {
		this.#sibs.clear(); this.#p.fill(0); this.#c.fill(0);
	}

	/** Get the parent of a node.
	 *  @param u is a node in the forest
	 *  @return the u's parent or 0.
	 */
	p(u) { return this.#p[u]; }

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
	
	/** Get the next sibling of a node.
	 *  @param u is a node in a tree
	 *  @return the next sibling of u, or 0
	 */
	nextSibling(u) { return this.#sibs.next(u); }
	
	/** Get the previous sibling of a node.
	 *  @param u is a node in a tree
	 *  @return the previous sibling of u, or 0
	 */
	prevSibling(u) { return this.#sibs.prev(u); }

	/** Get the root of a tree containing a node.
	 *  @param u is a node in some tree
	 *  @return the tree root
	 */
	root(u) {
		while (this.p(u) != 0)  {
			u = this.p(u); this.steps++;
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
	 *  @return the next leaf in the prefix ordering
	 */
	nextLeaf(u,v) {
		while (v != u) {
			this.steps++;
			if (this.nextSibling(v))
				return this.firstLeaf(this.nextSibling(v));
			v = this.p(v);
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

	/** Return the first node in the prefix ordering within a subtree. */
	first(u) { return u; }

	/** Return the next descendant of a node in the prefix ordering.
	 *  @param u is a tree node
	 *  @param root is an ancestor of u; if root is included, iteration
	 *  stops at last node in subtree, otherwise, it continues through
	 *  all trees in same group as u
	 *  @return the next node in the subtree at root following u
	 */
	next(u,root=0) {
		if (this.firstChild(u)) return this.firstChild(u);
		do {
			this.steps++;
			if (this.nextSibling(u)) return this.nextSibling(u);
			u = this.p(u);
		} while (u != root);
		return 0;
	}
	
	/** Link one tree to another.
	 *  @param u is the root of a tree that is the only one in its group;
	 *  (if necessary, the client must call ungroup before calling link)
	 *  @param v is a node in some other tree
	 */
	link(u, v) {
		fassert(u > 0 && this.p(u) == 0 && v > 0,
				`Forest.link: bad arguments ${u} ${v}`);
		if (u > this.n || v > this.n) {
			this.expand(Math.max(u, v));
		}
		this.#c[v] = this.#sibs.join(this.firstChild(v), u);
		this.#p[u] = v;
	}

	/** Remove a subtree.
	 *  @param u is a node in a tree; on return it is a tree root
	 */
	cut(u) {
		if (this.p(u) == 0) return;
		let p = this.#p[u]; let firstSib = this.firstChild(p);
		this.#c[p] = this.#sibs.delete(u, firstSib);
		this.#p[u] = 0;
	}

	/** Join two tree groups.
	 *  @param r1 is the root of the first tree in some group
	 *  @param r2 is the root of the first tree in some other group
	 *  @return the root of the first tree in the resulting group
	 */
	joinGroups(r1,r2) { return this.#sibs.join(r1,r2); }

	/** Remove a tree from a tree group.
	 *  @param r is the root of a tree to be removed from its group
	 *  @param r0 is the first root in r's tree group
	 *  @return the first root in the modified group
	 */
	ungroup(r,r0) { return this.#sibs.delete(r,r0); }

	/** Rotate the siblings within a tree.
	 *  @param f is the first child of its parent
	 *  @param c is a sibling  of u that becomems the first child in
	 *  the list following the rotation
	 *  @return the new first sibling
	 */
	rotate(f, c) {
		this.#sibs.rotate(f, c); 
		if (this.p(c)) this.#c[this.p(c)] = c;
		return c;
	}
	
	/** Compare another Forest to this one.
	 *  @param other is a Forest object or a string representing a Forest
	 *  @return true if f is equal to this; note, the order of siblings
	 *  and the order of trees within groups does not affect equality
	 */
	equals(other) {
		let f = super.equals(other);
		if (typeof f == 'boolean') return f;

		// identify the first tree root in each group in this
		let firstRoot1 = new Int32Array(this.n+1);
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) || !this.#sibs.isfirst(u)) continue;
			for (let t = u; t; t = this.nextSibling(t))
				firstRoot1[t] = u;
		}
		// likewise in f
		let firstRoot2 = new Int32Array(this.n+1);
		for (let u = 1; u <= this.n; u++) {
			if (f.p(u) || !f.#sibs.isfirst(u)) continue;
			for (let t = u; t; t = f.nextSibling(t)) {
				firstRoot2[t] = u;
			}
		}

		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) != f.p(u)) return false;
			if (!this.p(u) && firstRoot1[u] != firstRoot2[u])
				return false;
		}
		return f;
	}

	/** Determine if two Forest objects represent the same sets.
	 *  @param other is a Forest object to be compared to this
	 *  @return true if the vertex sets of the trees in both are identical
	 */
	setEquals(other) {
		let f = super.equals(other);
		if (typeof f == 'boolean') return f;
		// f is an object that can be compared to this
		let l = new List(this.n);
		for (let r = 1; r <= this.n; r++) {
			if (this.p(r)) continue;
			l.clear();
			for (let u = this.first(r); u; u = this.next(u)) l.enq(u);
			let len = 0;
			for (let u = f.first(f.root(r)); u; u = f.next(u)) {
				if (!l.contains(u)) return false;
				len++;
			}
			if (len != l.length) return false;
		}
		return f;
	}

	/** Determine if two Forest objects consist of
	 *  trees with nodes in the same left-to-right order (list equality).
	 *  @param other is a Forest object to be compared to this
	 *  @return true if the trees in both contain the same nodes
	 *  and in the same order (not necessarily matching tree structures);
	 *  otherwise return false
	 */
	listEquals(other) {
		let f = super.equals(other);
		if (typeof f == 'boolean') return f;
		// f is an object that can be compared to this
		for (let r1 = 1; r1 <= this.n; r1++) {
			if (this.p(r1)) continue;
			let r2 = f.root(r1);
			let v1 = this.first(r1); let v2 = f.first(r2);
			while (v1 == v2 && v1 != 0) {
				v1 = this.next(v1); v2 = f.next(v2);
			}
			if (v1 != v2) return false;
		}
		return f;
	}
	
	/** Construct a string representation of this forest.
	 *  @param fmt is an integer; its low order bits control the presentation
	 *		001 causes each tree to be shown on a separate line
	 *		010 causes singleton trees to be shown
	 *		100 causes tree structure to be shown
	 *  @param label is an optional function used to generate node labels
	 *  @param selectGroup specifies a single group to be included
	 *  @return the string
	 */
	toString(fmt=0b100, label=0, selectGroup=0) {
		const newlines = fmt & 0b001;
		const singletons = fmt & 0b010;
		const trees = fmt & 0b100;

		if (!label) label = (u => this.x2s(u));

		let s = ''; let first = true;
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) || !this.#sibs.isfirst(u)) continue;
			if (!singletons && !this.firstChild(u) && !this.nextSibling(u))
				continue;
			if (selectGroup && u != selectGroup) continue;
			s += ((first || newlines) ? '[' : ' [');
			first = true;
			for (let t = u; t; t = this.nextSibling(t)) {
				if (first) first = false;
				else s += ' ';
				s += this.tree2string(t, trees, label);
			}
			s += newlines ? ']\n' : ']';
		}
		return newlines ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Create a string representation of one tree.
	 *  @param t is a the root of a tree or subtree
	 *  @param trees is a flag which causes the tree structure to be shown;
	 *  when not set, the vertices in the tree are simply listed.
	 *  @param label is an optional function that returns a vertex label
	 *  @param treeRoot is a flag that is set to indicate that t is a tree root
	 *  @return a string that represents the tree
	 */
	tree2string(t, trees=0, label=0, treeRoot=1) {
		let s = label(t);
		if (this.firstChild(t) == 0) {
			return s; // + (treeRoot && trees ? '()' : '');
		}
		if (trees) s += '(';
		for (let c = this.firstChild(t); c; c = this.nextSibling(c)) {
			if (c != this.firstChild(t) || !(trees)) s += ' ';
			s += this.tree2string(c,trees,label,0);
		}
		return s + (trees ? ')' : '');
	}
		
	/** Initialize this Forest object from a string.
	 *  @param s is a string representing a forest
	 *  @return true on success, else false
	 */
	fromString(s, prop=0) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let n = 0; let items = new Set();
		let pmap = new Array(); // map node to its parent
		let smap = new Array(); // map tree root to its next sibling
		while (!sc.verify('}')) {
			if (!sc.verify('[')) return false;
			let firstRoot = 0;
			while (!sc.verify(']')) {
				let pair = this.nextSubtree(sc, items, pmap, prop);
				if (pair == null) return false;
				let [v,nv] = pair;
				pmap.push([v,0]);
				n = Math.max(n, nv);
				if (!firstRoot) firstRoot = v;
				smap.push([firstRoot,v]);
			}
		}
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let pair of pmap) {
			let [u,v] = pair;
			if (v) this.link(u,v);
		}
		for (let p of smap) {
			let [u,v] = p;
			if (v) this.joinGroups(u,v);
		}
		return true;
	}

	/** Scan the input for a subtree and compute node to parent map.
	 *  @param sc is a Scanner for the input string
	 *  @param items is a set of node indices seen so far
	 *  @param map is an array of triples [u,v,pvec] where v is the
	 *  parent of u and pvec is a possible vector of properties for v
	 *  @return pair [u,n,pvec] where u is the root of the next subtree
	 *  in the input, n is the maximum index in the subtree at u and 
	 *  pvec is a possible vector of properties
	 *  the maximum index in the subtree at u
	 */
	nextSubtree(sc, items, map, prop=0) {
		let u = sc.nextIndex(prop);
		if (u < 0 || items.has(u)) return null;
		items.add(u);
		if (!sc.verify('(')) return [u,u];
		let n = u;
		while (!sc.verify(')')) {
			let pair = this.nextSubtree(sc, items, map, prop);
			if (pair == null) return null;
			let [v,nv] = pair;
			map.push([v,u]);
			n = Math.max(n, nv);
		}
		return [u,n];
	}

	getStats() {
		return { 'steps': this.steps };
	}

	verify() {
		for (let u = 1; u <= this.n; u++) {
			let sib = this.nextSibling(u);
			if (sib && this.p(sib) != this.p(u))
				return `siblings ${this.x2s(u)} and ${this.x2s(sib)} ` +
					   `have different parents`;
			if (this.firstChild(u)) {
				if (this.p(this.firstChild(u)) != u)
					return `first child ${this.x2s(this.firstChild(u))} of ` +
						   `${this.x2s(u)} has different parent`;
			}
		}
	}
}
