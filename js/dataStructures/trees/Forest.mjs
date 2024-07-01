/** @file Forest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Data structure for collection of undirected trees.
 */
export default class Forest extends Top {
	Sibs;		// lists of siblings (and tree roots)
	P;			// P[u] is parent of u or 0
	C;			// C[u] is first child of u or 0

	steps;		// number of steps

	/** Construct Forest with space for a specified # of nodes.
	 *  @param n is the number of nodes in the forest
	 */
	constructor(n=10) {
		super(n);
		this.Sibs= new ListSet(this.n);
		this.P = new Int32Array(this.n+1);
		this.C = new Int32Array(this.n+1);
		this.steps = 0;
	}

	/** Assign one Forest to another.
	 *  @param that is another Forest that is to replace this one.
	 */
	assign(that, relaxed=false) {
		super.assign(that, relaxed);
		for (let u = 1; u <= that.n; u++) {
			for (let c = that.firstChild(u); c; c = that.nextSibling(c)) {
				this.link(c,u);
			}
		}
	}

	/** Assign one Forest to another by transferring its contents.
	 *  @param that is another Forest that is to replace this one.
	 */
	xfer(that) {
		super.xfer(that);
		this.Sibs = that.Sibs; this.P = that.P; this.C = that.C;
		that.Sibs = that.P = that.C = null;
	}

	/** Convert all trees to singletons. */
	clear() {
		this.Sibs.clear(); this.P.fill(0); this.C.fill(0);
	}

	/** Get the parent of a node.
	 *  @param u is a node in the forest
	 *  @return the u's parent or 0.
	 */
	p(u) { return this.P[u]; }

	/** Get the first child of a node.
	 *  @param u is a node in the forest
	 *  @return the u's first child or 0.
	 */
	firstChild(u) { return this.C[u]; }

	/** Get the last child of a node.
	 *  @param u is a node in the forest
	 *  @return the u's last child or 0.
	 */
	lastChild(u) { return this.Sibs.last(this.C[u]); }
	
	/** Get the next sibling of a node.
	 *  @param u is a node in a tree
	 *  @return the next sibling of u, or 0
	 */
	nextSibling(u) { return this.Sibs.next(u); }
	
	/** Get the previous sibling of a node.
	 *  @param u is a node in a tree
	 *  @return the previous sibling of u, or 0
	 */
	prevSibling(u) { return this.Sibs.prev(u); }

	/** Get the root of a tree containing a node.
	 *  @param u is a node in some tree
	 *  @return the tree root
	 */
	root(u) {
		while (this.P[u])  { u = this.P[u]; this.steps++; }
		return u;
	}

	/** Return the first leaf descendant of a node */
	firstLeaf(u) {
		while (this.firstChild(u)) {
			u = this.firstChild(u); this.steps++;
		}
		return u;
	}

	/** Return the first node in the prefix ordering within a subtree. */
	first(u) { return u; }

	/** Return the next node within a tree or subtree (using prefix ordering).
	 *  @param u is a tree node
	 *  @param root is an optional argument which specifies an ancestor of u;
	 *  if root is included, iteration stops at last node in subtree of root;
	 *  otherwise, it continues through all trees in same grove as u
	 *  @return the next node in the subtree at root following u
	 */
	next(u,root=0) {
		if (this.firstChild(u)) return this.firstChild(u);
		do {
			this.steps++;
			if (this.nextSibling(u)) return this.nextSibling(u);
			u = this.P[u];
		} while (u != root);
		return 0;
	}

	/** Return the next leaf in a tree or subtree.
	 *  @param u is a leaf node
	 *  @param root is an ancestor of u
	 *  @return the next leaf following u in the prefix ordering,
	 *  within the subtree defined by root
	 */
	nextLeaf(u,root=0) {
		while (u != root) {
			this.steps++;
			if (this.nextSibling(u))
				return this.firstLeaf(this.nextSibling(u));
			u = this.P[u];
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
	
	/** Link one tree to another.
	 *  @param u is the root of a tree that is the only one in its grove;
	 *  (if necessary, the client must call remove before calling link)
	 *  @param v is a node in some other tree
	 */
	link(u, v) {
		ea && assert(u > 0 && this.P[u] == 0 && v > 0,
					 `Forest.link: bad arguments ${u} ${v}`);
		if (u > this.n || v > this.n) {
			this.expand(Math.max(u, v));
		}
		this.C[v] = this.Sibs.join(this.firstChild(v), u);
		this.P[u] = v;
	}

	/** Cut out a subtree.
	 *  @param u is a node in a tree; on return it is a tree root
	 */
	cut(u) {
		if (this.P[u] == 0) return;
		let p = this.P[u]; let firstSib = this.firstChild(p);
		this.C[p] = this.Sibs.delete(u, firstSib);
		this.P[u] = 0;
	}

	/** Merte two groves.
	 *  @param g1 is the identifier of some grove
	 *  @param g2 is the identifier of another grove
	 *  @return the identifier of the grove obtained by combining the two
	 */
	combineGroves(g1,g2) { return this.Sibs.join(g1,g2); }

	/** Remove a tree from a grove.
	 *  @param t is a tree
	 *  @param g is the grove containing t
	 *  @return the identifier of the modified grove (its first tree)
	 */
	remove(t,g) { return this.Sibs.delete(t,g); }

	/** Rotate the siblings within a tree.
	 *  @param f is the first child of its parent
	 *  @param c is a sibling  of u that becomes the first child in
	 *  the list following the rotation
	 *  @return the new first sibling
	 */
	rotate(f, c) {
		this.Sibs.rotate(f, c); 
		if (this.P[c]) this.C[this.P[c]] = c;
		return c;
	}
	
	/** Compare another Forest to this one.
	 *  @param that is a Forest object or a string representing a Forest
	 *  @return true if that is equal to this; note, the order of siblings
	 *  and the order of trees within groves does not affect equality
	 */
	equals(that) {
		that = super.equals(that);
		if (typeof that == 'boolean') return that;
		if (!this.Sibs.setEquals(that.Sibs)) return false;

		for (let u = 1; u <= this.n; u++) {
			if (this.P[u] != that.P[u]) return false;
		}
		return that;
	}

	/** Determine if two Forest objects represent the same sets.
	 *  @param that is a Forest object to be compared to this
	 *  @return true if the vertex sets of the trees in both are identical
	 */
	setEquals(that) {
		that = super.equals(that);
		if (typeof that == 'boolean') return that;
		// that is an object that can be compared to this
		let l = new List(this.n);
		for (let r = 1; r <= this.n; r++) {
			if (this.P[r]) continue;
			l.clear();
			for (let u = this.first(r); u; u = this.next(u)) l.enq(u);
			let len = 0;
			for (let u = that.first(that.root(r)); u; u = that.next(u)) {
				if (!l.contains(u)) return false;
				len++;
			}
			if (len != l.length) return false;
		}
		return that;
	}

	/** Determine if two Forest objects consist of
	 *  trees with nodes in the same left-to-right order (list equality).
	 *  @param that is a Forest object to be compared to this
	 *  @return true if the trees in both contain the same nodes
	 *  and in the same order (not necessarily matching tree structures);
	 *  otherwise return false
	 */
	listEquals(that) {
		that = super.equals(that);
		if (typeof that == 'boolean') return that;
		// that is now an object that can be compared to this
		for (let r1 = 1; r1 <= this.n; r1++) {
			if (this.P[r1]) continue;
			let r2 = that.root(r1);
			let v1 = this.first(r1); let v2 = that.first(r2);
			while (v1 == v2 && v1 != 0) {
				v1 = this.next(v1); v2 = that.next(v2);
			}
			if (v1 != v2) return false;
		}
		return that;
	}

	/** Create a ListSet that defines the same lists as those defined
	 *  by the trees/groves of this object.
	 *  @return the computed ListSet.
	 */
	toListSet() {
		let ls = new ListSet(this.n);
		for (let t = 1; t <= this.n; t++) {
			if (this.P[t] || !this.Sibs.isfirst(t)) continue;
			for (let u = this.first(t); u; u = this.next(u))
				ls.join(t,u);
		}
		return ls;
	}
	
	/** Construct a string representation of this forest.
	 *  @param fmt is an integer; its low order bits control the presentation
	 *		001 causes each tree to be shown on a separate line
	 *		010 causes singleton trees to be shown
	 *		100 causes tree structure to be shown
	 *  @param label is an optional function used to generate node labels
	 *  @param selectGrove specifies a single grove to be included
	 *  @return the string
	 */
	toString(fmt=0b100, label=0, selectGrove=0) {
		if (!(fmt&4)) return this.toListSet().toString(fmt&3);

		const newlines = fmt & 0b001;
		const singletons = fmt & 0b010;

		if (!label) label = (u => this.x2s(u));

		let s = ''; let first = true;
		for (let u = 1; u <= this.n; u++) {
			if (this.P[u] || !this.Sibs.isfirst(u)) continue;
			if (!singletons && !this.firstChild(u) && !this.nextSibling(u))
				continue;
			if (selectGrove && u != selectGrove) continue;
			s += ((first || newlines) ? '' : ' ');
			if (this.nextSibling(u)) s += '[';
			first = true;
			for (let t = u; t; t = this.nextSibling(t)) {
				if (first) first = false;
				else s += ' ';
				s += this.tree2string(t, label);
			}
			if (this.nextSibling(u)) s += ']';
			s += newlines ? '\n' : '';
		}
		return newlines ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Create a string representation of one tree.
	 *  @param t is a the root of a tree or subtree
	 *  when not set, the vertices in the tree are simply listed.
	 *  @param label is an optional function that returns a vertex label
	 *  @param treeRoot is a flag that is set to indicate that t is a tree root
	 *  @return a string that represents the tree
	 */
	tree2string(t, label=0, treeRoot=1) {
		let s = label(t);
		if (this.firstChild(t) == 0) return s;
		s += '(';
		for (let c = this.firstChild(t); c; c = this.nextSibling(c)) {
			if (c != this.firstChild(t) ) s += ' ';
			s += this.tree2string(c,label,0);
		}
		return s + ')';
	}
		
	/** Initialize this Forest object from a string.
	 *  @param s is a string representing a forest
	 *  @return true on success, else false
	 */
	fromString(s, prop=0) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let n = 0; let items = new Set();
		let pmap = new Array(); // pairs [u,p] where p is parent of u
		let smap = new Array(); // pairs [t,g] where g is grove containing t
		while (!sc.verify('}')) {
			if (!sc.verify('[')) {
				let pair = this.nextSubtree(sc, items, pmap, prop);
				if (pair == null) return false;
				let [t,nt] = pair;
				pmap.push([t,0]);
				n = Math.max(n, nt);
				smap.push([t,t]);
				continue;
			}
			// parsing non-trivial grove
			let firstTree = 0;
			while (!sc.verify(']')) {
				let pair = this.nextSubtree(sc, items, pmap, prop);
				if (pair == null) return false;
				let [t,nt] = pair;
				pmap.push([t,0]);
				n = Math.max(n, nt);
				if (!firstTree) firstTree = t;
				smap.push([t,firstTree]);
			}
		}
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let pair of pmap) {
			let [u,v] = pair;
			if (v) this.link(u,v);
		}
		for (let p of smap) {
			let [t,g] = p;
			if (t) this.combineGroves(g,t);
		}
		return true;
	}

	/** Scan the input for a subtree and compute node to parent map.
	 *  @param sc is a Scanner for the input string
	 *  @param items is a set of node indices seen so far.
	 *  @param pmap is an array of pairs [u,pu] where pu is the
	 *  parent of u.
	 *  @return pair [t,n] where t is the root of the next subtree
	 *  in the input and n is the maximum index in t
	 *  or null if no valid subtree in scanned string.
	 */
	nextSubtree(sc, items, pmap, prop=0) {
		let t = sc.nextIndex(prop);
		if (t < 0 || items.has(t)) return null;
		items.add(t);
		if (!sc.verify('(')) return [t,t];
		let n = t;
		while (!sc.verify(')')) {
			let pair = this.nextSubtree(sc, items, pmap, prop);
			if (pair == null) return null;
			let [v,nv] = pair;
			pmap.push([v,t]);
			n = Math.max(n, nv);
		}
		return [t,n];
	}

	getStats() {
		return { 'steps': this.steps };
	}

	verify() {
		for (let u = 1; u <= this.n; u++) {
			let sib = this.nextSibling(u);
			if (sib && this.P[sib] != this.P[u])
				return `siblings ${this.x2s(u)} and ${this.x2s(sib)} ` +
					   `have different parents`;
			if (this.firstChild(u)) {
				if (this.P[this.firstChild(u)] != u)
					return `first child ${this.x2s(this.firstChild(u))} of ` +
						   `${this.x2s(u)} has different parent`;
			}
		}
	}
}
