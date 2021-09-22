/** @file Dsets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Adt from '../Adt.mjs';
import { assert } from '../../Errors.mjs';
import Dlists from './Dlists.mjs';
import List from './List.mjs';
import Scanner from './Scanner.mjs';
import Digraph from '../graphs/Digraph.mjs';

/** Disjoint sets data structure maintains a collection of disjoint
 *  sets over the integers 1..N for some positive integer N. Allows
 *  one to quickly determine if two values are in the same set and
 *  supports constant-time union of two sets.
 */
export default class Dsets extends Adt {
	#p;			///< #p[i] is parent of i
	#rank;	 	///< #rank[i] is rank of i
	
	constructor(n, capacity=n) {
		super(n); this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n <= capacity);
		this.#p = new Array(capacity+1); 
		this.#rank = new Array(capacity+1);
		this.clear();
	}
	
	/** Allocate space and initialize Dsets object.
	 *  Any old value is discarded.
	 *  @param n is the defined range
	 *  @param capacity is the max number of elements that can be accommodated
	 */
	reset(n, capacity=n) {
		assert(0 < this.n && n <= capacity);
		this._n = n; this.#init();
	}

	/** Expand the space available for this object.
	 *  Rebuilds old value in new space.
	 *  @param n is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new Dsets(this.n, Math.max(n,
									   Math.floor(1.25 * this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this.clear(this.n+1, n+1); this._n = n;
	}
	
	/** Copy another Dsets object to this one.
	 *  @param source is another Dsets object
	 */
	assign(ds) {
		if (ds == this) return;
		if (ds.n > this._capacity) reset(ds.n);
		else this._n = ds.n;
		for (let i = 0; i <= this.n; i++) {
			this.#p[i] = ds.#p[i]; this.#rank[i] = ds.#rank[i];
		}
	}
	xfer(ds) {
		this.#p = ds.#p; this.#rank = ds.#rank; ds.#p = ds.#rank = null;
	}
	
	/** Clear all items in a given range.
	 *  @param lo is the low end of the range of items to be cleared
	 *  @param hi is the high end of the range; all items <hi are cleared
	 */
	clear(lo=0, hi=this.n+1) {
		for (let i = lo; i < hi; i++) { this.#p[i] = i; this.#rank[i] = 0; }
	}

	get _capacity() { return this.#p.length - 1; }

	/** Return parent of a set element in the tree representation of the set.
	 *  @param i index of a set element
	 *  @return the parent of i
	 */
	p(i) { return this.#p[i]; }

	/** Return rank of a set element in the tree representation of the set.
	 *  @param i index of a set element
	 *  @return the parent of i
	 */
	rank(i) { return this.#rank[i]; }
	
	/** Find and return the canonical element of a set.
	 *  Performs path compression as side-effect.
	 *  @param i is an index in some set
	 *  @return the canonical element of the set containing i
	 */
	find(i) {
		assert(this.valid(i));
		let root;
		for (root = i; this.p(root) != root; root = this.p(root)) {}
		while (i != root) { let pi = this.p(i); this.#p[i] = root; i = pi; }
		return root;
	}
	
	/** Combine two sets.
	 *  @param i is the canonical element of some set.
	 *  @param j is the canonical element of another (distinct) set
	 *  @return the canonical element of the set obtained by combining
	 *  the given sets
	 */
	link(i, j) {
		assert(this.valid(i) && this.valid(j) &&
			   this.p(i) == i && this.p(j) == j && i != j);
		if (this.rank(i) < this.rank(j)) {
			let t = i; i = j; j = t;
		} else if (this.rank(i) == this.rank(j)) {
			this.#rank[i]++;
		}
		this.#p[j] = i;
		return i;
	}
	
	/** Get the canonical element of a set without restructuring the set.
	 *  @param i is an index in some set
	 *  @return the canonical element of the set containing i
	 */
	findroot(i) {
		assert(this.valid(i));
		if (i == this.p(i)) return(i);
		else return this.findroot(this.p(i));
	}

	/** Compare two Dsets for equality.
	 *  @param ds is another Dsets to be compared to this, or a string
	 *  representing a Dsets
	 *  @return true if they represent the same collection of sets.
	 */
	equals(ds) {
		if (this === ds) return true;
		if (typeof ds == 'string') {
			let s = ds;
			ds = new Dsets(this.n);
			ds.fromString(s);
		} else if (!(ds instanceof Dsets))
			return false;
		if (this.n != ds.n) return false;
		let id1 = new Array(this.n+1).fill(this.n+1);
		let id2 = new Array(this.n+1).fill(this.n+1);
		for (let i = 1; i < this.n; i++) {
			let r1 = this.findroot(i); id1[r1] = Math.min(i, id1[r1]);
			let r2 =   ds.findroot(i); id2[r2] = Math.min(i, id2[r2]);
		}
		for (let i = 1; i < this.n; i++)
			if (id1[this.findroot(i)] != id2[ds.findroot(i)])
				return false;
		return true;
	}

	toString(details=0, pretty=0, strict=0) {
		// create a graph structure using parent info
		let F = new Digraph(this.n);
		for (let u = 1; u <= this.n; u++)
			if (this.p(u) != u) F.join(this.p(u), u);
		let s = '';
		for (let r = 1; r <= this.n; r++) {
			if (this.p(r) != r || F.firstOut(r) == 0)
				continue;
			if (s != '' && !pretty) s += ' ';
			let ss = this.#set2string(r, F, details, strict);
			s += (details ? ss : '{' + ss + '}');
			if (pretty) s += '\n';
		}
		return pretty ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Create a string representation of a non-singleton set.
	 *  @param r is an item that identifies a set with more than one element
	 *  @return a string that represents r
	 */
	#set2string(u, F, details=0, strict=0) {
		if (u == 0) return;
		let s = this.index2string(u, strict) +
				(details && this.rank(u) > 0 ? ':' + this.rank(u) : '');
		if (F.firstOut(u) == 0) return s;
		s += (details ? '(' : ' ');
		for (let e = F.firstOut(u); e != 0; e = F.nextOut(u, e)) { 
			let v = F.head(e);
			if (e != F.firstOut(u)) s += ' ';
			s += this.#set2string(v, F, details, strict);
		}
		if (details) s += ')';
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
		let l = new Array(10);
		while (sc.nextIndexList(l, '{', '}') != null) {
			let n = 0;
			for (let i of l) n = Math.max(i, n);
			if (n > this.n) this.expand(n);
			for (let i = 1; i < l.length; i++) {
				this.link(l[0], l[i]);
			}
		}
		if (sc.verify('}')) return true;
		this.clear(); return false;
	}

	/** Create a string representation of a non-singleton set.
	 *  @param r is an item that identifies a set with more than one element
	 *  @return a string that represents r
	#set2string(r, F, details=0, strict=0) {
		let s = '';
		let stk = new List(this.n);
		let next = new Array(this.n+1).fill(0);
	
		stk.push(r); next[r] = F.firstOut(r);
		s += this.index2string(r, strict)  +
             (details ? ':' + this.rank(r) : '');
		if (next[r] != 0) s += details ? '(' : ' ';
		while (!stk.empty()) {
			let u = stk.top(); let e = next[u];
			if (e == 0) {
				stk.pop(); let w = stk.top();
				if (w != 0) {
					next[w] = F.nextOut(w, next[w]);
					if (next[w] == 0 && details) s += ')';
				}
			} else {
				let v = F.head(e);
				stk.push(v); next[v] = F.firstOut(v);
				if (e != F.firstOut(u)) s += ' ';
				s += this.index2string(v, strict)  +
             		 (details ? ':' + this.rank(v) : '');
				if (next[v] != 0) s += details ? '(' : ' ';
			}
		}
		return '{' + s + '}';
	}
	 */
	
	/** Create a string representation of the disjoint sets.
	 *  @param s is a reference to a string in which the partition is returned.
	 *  @return a reference to s
	toString(details=false, strict=false, pretty=false) {
		let s = '';
		let size = new Array(this.n+1);
		let root = new Array(this.n+1);
		for (let i = 1; i <= this.n; i++) {
			root[i] = this.findroot(i); size[i] = 0;
		}
		for (let i = 1; i <= this.n; i++) size[root[i]]++;
		// for root nodes i, size[i] is number of nodes in tree
		let firstSet = true;
		for (let i = 1; i <= this.n; i++) {
			if (this.p(i) == i) { // i is a canonical element
				if (firstSet) firstSet = false;
				else s += ' ';
				if (size[i] == 1) {
					s += this.index2string(i); continue;
				}
				s += '(' + this.index2string(i);
				for (let j = 1; j <= this.n; j++) {
					if (j != i && root[j] == i)
						s += ' ' + this.index2string(j);
				}
				s += ')';
			}
		}
		return '{' + s + '}';
	}

	toLongString() {
		// for each tree node, identify a firstChild node
		let firstChild = new Array(this.n+1);
		for (let i = 0; i <= this.n; i++) firstChild[i] = 0;
		let firstRoot = 0;
		for (let i = 0; i <= this.n; i++) {
			if (this.p(i) == i && firstRoot == 0) firstRoot = i;
			if (this.p(i) != i && firstChild[this.p(i)] == 0)
				firstChild[this.p(i)] = i;
		}
		// create lists of siblings within the trees (treat roots as siblings)
		let sibs = new Dlists(this.n);
		for (let i = 0; i <= this.n; i++) {
			if (this.p(i) == i && i != firstRoot)
				sibs.join(firstRoot, i);
			if (this.p(i) != i && i != firstChild[this.p(i)])
				sibs.join(firstChild[this.p(i)], i);
		}
		// now, build string with recursive helper
		let s = '';
		if (firstRoot != 0) {
			for (let r = sibs.first(firstRoot); r != 0; r = sibs.next(r)) {
				if (r != sibs.first(firstRoot)) s += " ";
				s += this.subtree2string(r, firstChild, sibs);
			}
		}
		return '{' + s + '}';
	}

	subtree2string(u, firstChild, sibs) {
		let s = this.index2string(u);
		if (firstChild[u] == 0) return s;
		if (this.p(u) == u) s += "." + this.rank(u);
		s += "(";
		for (let c = sibs.first(firstChild[u]); c != 0; c = sibs.next(c)) {
			if (c != firstChild[u]) s += " ";
			s += this.subtree2string(c, firstChild, sibs);
		}
		s += ")";
		return s;
	}
	 */
}
