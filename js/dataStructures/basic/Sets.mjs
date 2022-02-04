/** @file Sets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { assert } from '../../common/Errors.mjs';
import ListSet from './ListSet.mjs';
import Scanner from './Scanner.mjs';
import Digraph from '../graphs/Digraph.mjs';

/** Sets data structure maintains a collection of disjoint
 *  sets over the integers 1..N for some positive integer N. Allows
 *  one to quickly determine if two values are in the same set and
 *  supports constant-time union of two sets.
 */
export default class Sets extends Top {
	#p;			///< #p[i] is parent of i
	#rank;	 	///< #rank[i] is rank of i

	#linkCount;
	#findCount;
	#findSteps;
	
	constructor(n, capacity=n) {
		super(n);
		if (!capacity) capacity = this.n;
		this.#init(capacity);
	}

	#init(capacity) {
		assert(this.n <= capacity);
		this.#p = new Int32Array(capacity+1); 
		this.#rank = new Int32Array(capacity+1);
		this.clear();
	
		this.#linkCount = 0;
		this.#findCount = 0;
		this.#findSteps = 0;
	}
	
	/** Allocate space and initialize Sets object.
	 *  Any old value is discarded.
	 *  @param n is the defined range
	 *  @param capacity is the max number of elements that can be accommodated
	 */
	reset(n, capacity=n) {
		assert(0 < this.n && n <= capacity);
		this._n = n; this.#init(capacity);
	}

	/** Expand the space available for this object.
	 *  Rebuilds old value in new space.
	 *  @param n is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this.capacity) {
			let nu = new Sets(this.n, Math.max(n, ~~(1.5 * this.capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this.clear(this.n+1, n+1); this._n = n;
	}
	
	/** Copy another object to this one.
	 *  @param source is another Sets object or a ListSet object.
	 */
	assign(ds) {
		if (ds == this) return;
		if (ds.n > this.capacity) this.reset(ds.n);
		else { this.clear(); this._n = ds.n; }
		if (ds instanceof Sets) {
			for (let i = 0; i <= this.n; i++) {
				this.#p[i] = ds.#p[i]; this.#rank[i] = ds.#rank[i];
			}
		} else if (ds instanceof ListSet) {
			for (let i = 0; i <= this.n; i++) {
				if (!ds.isfirst(i)) continue;
				for (let j = ds.next(i); j != 0; j = ds.next(j))
					this.link(this.find(i), j);
			}
		}
	}

	xfer(ds) {
		if (ds == this) return;
		this._n = ds.n;
		this.#p = ds.#p; this.#rank = ds.#rank; ds.#p = ds.#rank = null;
	}
	
	/** Clear all items in a given range.
	 *  @param lo is the low end of the range of items to be cleared
	 *  @param hi is the high end of the range; all items <hi are cleared
	 */
	clear(lo=0, hi=this.n+1) {
		for (let i = lo; i < hi; i++) { this.#p[i] = i; this.#rank[i] = 0; }
	}

	get capacity() { return this.#p.length - 1; }

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
		this.#findCount++;
		assert(this.valid(i));
		let root;
		for (root = i; this.p(root) != root; root = this.p(root)) {
			this.#findSteps++;
		}
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
		this.#linkCount++;
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

	/** Compare two Sets for equality.
	 *  @param ds is another Sets to be compared to this, or a string
	 *  representing a Sets object
	 *  @return true if they represent the same collection of sets.
	 */
	equals(ds) {
		if (this === ds) return true;
		if (typeof ds == 'string') {
			let s = ds; ds = new Sets(this.n); ds.fromString(s);
		} else if (!(ds instanceof Sets))
			return false;
		if (this.n != ds.n) return false;
		// use smallest item in set as its 'id', store in set's root location
		let id1 = new Int32Array(this.n+1).fill(this.n+1);
		let id2 = new Int32Array(this.n+1).fill(this.n+1);
		for (let i = 1; i <= this.n; i++) {
			let r1 = this.findroot(i); id1[r1] = Math.min(i, id1[r1]);
			let r2 =   ds.findroot(i); id2[r2] = Math.min(i, id2[r2]);
		}
		for (let i = 1; i < this.n; i++)
			if (id1[this.findroot(i)] != id2[ds.findroot(i)])
				return false;
		return true;
	}

	toString(details=0, pretty=0, label=0) {
		// create a graph structure using parent info
		let F = new Digraph(this.n);
		for (let u = 1; u <= this.n; u++)
			if (this.p(u) != u) F.join(this.p(u), u);
		let s = '';
		for (let r = 1; r <= this.n; r++) {
			if (this.p(r) != r || F.firstOut(r) == 0)
				continue;
			if (s != '' && !pretty) s += ' ';
			let ss = this.set2string(r, F, details, label);
			s += (details ? ss : '{' + ss + '}');
			if (pretty) s += '\n';
		}
		return pretty ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Create a string representation of a non-singleton set.
	 *  @param r is an item that identifies a set with more than one element
	 *  @return a string that represents r
	 */
	set2string(u, F, details=0, label=0) {
		if (u == 0) return;
		let s = this.index2string(u, label) +
				(details && this.rank(u) > 0 ? ':' + this.rank(u) : '');
		if (F.firstOut(u) == 0) return s;
		s += (details ? '(' : ' ');
		for (let e = F.firstOut(u); e != 0; e = F.nextOut(u, e)) { 
			let v = F.head(e);
			if (e != F.firstOut(u)) s += ' ';
			s += this.set2string(v, F, details, label);
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

		if (!sc.verify('{')) return false;
		let lists = []; let n = 0; let items = new Set();
		let l = sc.nextIndexList('{', '}');
		while (l != null) {
			for (let i of l) {
				n = Math.max(i, n);
				if (items.has(i)) return false;
				items.add(i);
			}
			lists.push(l);
			l = sc.nextIndexList('{', '}');
		}
		if (!sc.verify('}')) return false;

		if (n > this.n) this.reset(n);
		else this.clear();
		for (l of lists) {
			for (let i of l) {
				if (i != l[0]) this.link(l[0], i);
			}
		}
		return true;
	}

	getStats() {
		return { 'link' : this.#linkCount,
				 'find'	: this.#findCount,
				 'findSteps' : this._findSteps };
	}
}
