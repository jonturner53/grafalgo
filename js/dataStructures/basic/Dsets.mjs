/** @file Dsets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Adt from '../Adt.mjs';
import { assert } from '../../common/Errors.mjs';
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
	_p;			///< _p[i] is parent of i
	_rank;	 	///< _rank[i] is rank of i

	_linkCount;
	_findCount;
	_findSteps;
	
	constructor(n, capacity=n) {
		super(n); this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n <= capacity);
		this._p = new Array(capacity+1); 
		this._rank = new Array(capacity+1);
		this.clear();
	
		this._linkCount = 0;
		this._findCount = 0;
		this._findSteps = 0;
	}
	
	/** Allocate space and initialize Dsets object.
	 *  Any old value is discarded.
	 *  @param n is the defined range
	 *  @param capacity is the max number of elements that can be accommodated
	 */
	reset(n, capacity=n) {
		assert(0 < this.n && n <= capacity);
		this._n = n; this._init();
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
			this._p[i] = ds._p[i]; this._rank[i] = ds._rank[i];
		}
	}
	xfer(ds) {
		this._p = ds._p; this._rank = ds._rank; ds._p = ds._rank = null;
	}
	
	/** Clear all items in a given range.
	 *  @param lo is the low end of the range of items to be cleared
	 *  @param hi is the high end of the range; all items <hi are cleared
	 */
	clear(lo=0, hi=this.n+1) {
		for (let i = lo; i < hi; i++) { this._p[i] = i; this._rank[i] = 0; }
	}

	get _capacity() { return this._p.length - 1; }

	/** Return parent of a set element in the tree representation of the set.
	 *  @param i index of a set element
	 *  @return the parent of i
	 */
	p(i) { return this._p[i]; }

	/** Return rank of a set element in the tree representation of the set.
	 *  @param i index of a set element
	 *  @return the parent of i
	 */
	rank(i) { return this._rank[i]; }
	
	/** Find and return the canonical element of a set.
	 *  Performs path compression as side-effect.
	 *  @param i is an index in some set
	 *  @return the canonical element of the set containing i
	 */
	find(i) {
		this._findCount++;
		assert(this.valid(i));
		let root;
		for (root = i; this.p(root) != root; root = this.p(root)) {
			this._findSteps++;
		}
		while (i != root) { let pi = this.p(i); this._p[i] = root; i = pi; }
		return root;
	}
	
	/** Combine two sets.
	 *  @param i is the canonical element of some set.
	 *  @param j is the canonical element of another (distinct) set
	 *  @return the canonical element of the set obtained by combining
	 *  the given sets
	 */
	link(i, j) {
		this._linkCount++;
		assert(this.valid(i) && this.valid(j) &&
			   this.p(i) == i && this.p(j) == j && i != j);
		if (this.rank(i) < this.rank(j)) {
			let t = i; i = j; j = t;
		} else if (this.rank(i) == this.rank(j)) {
			this._rank[i]++;
		}
		this._p[j] = i;
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
			let ss = this._set2string(r, F, details, strict);
			s += (details ? ss : '{' + ss + '}');
			if (pretty) s += '\n';
		}
		return pretty ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Create a string representation of a non-singleton set.
	 *  @param r is an item that identifies a set with more than one element
	 *  @return a string that represents r
	 */
	_set2string(u, F, details=0, strict=0) {
		if (u == 0) return;
		let s = this.index2string(u, strict) +
				(details && this.rank(u) > 0 ? ':' + this.rank(u) : '');
		if (F.firstOut(u) == 0) return s;
		s += (details ? '(' : ' ');
		for (let e = F.firstOut(u); e != 0; e = F.nextOut(u, e)) { 
			let v = F.head(e);
			if (e != F.firstOut(u)) s += ' ';
			s += this._set2string(v, F, details, strict);
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
		let l = new Array(10); let items = new Set();
		while (sc.nextIndexList(l, '{', '}') != null) {
			let n = 0;
			for (let i of l) n = Math.max(i, n);
			if (n > this.n) this.expand(n);
            if (items.has(l[0])) { this.clear(); return false; }
            items.add(l[0]);
			for (let i = 1; i < l.length; i++) {
            	if (items.has(l[i])) { this.clear(); return false; }
             	items.add(l[i]); this.link(l[0], l[i]);
			}
		}
		if (sc.verify('}')) return true;
		this.clear(); return false;
	}

	getStats() {
		return { 'link' : this._linkCount,
				 'find'	: this._findCount,
				 'findSteps' : this._findSteps };
	}
}
