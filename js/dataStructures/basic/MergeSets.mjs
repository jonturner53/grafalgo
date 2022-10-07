/** @file MergeSets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import { fassert } from '../../common/Errors.mjs';
import ListSet from './ListSet.mjs';
import Scanner from './Scanner.mjs';
import Forest from '../graphs/Forest.mjs';

/** Sets data structure maintains a collection of disjoint
 *  sets over the integers 1..N for some positive integer N. Allows
 *  one to quickly determine if two values are in the same set and
 *  supports constant-time union of two sets.
 */
export default class MergeSets extends Top {
	#p;			///< #p[i] is parent of i
	#rank;	 	///< #rank[i] is rank of i

	#mergeCount;
	#findCount;
	#findSteps;
	
	constructor(n=10, capacity=n) {
		super(n);
		this.#p = new Int32Array(capacity+1); 
		this.#rank = new Int32Array(capacity+1);
		this.clear();
	
		this.#mergeCount = 0;
		this.#findCount = 0;
		this.#findSteps = 0;
	}
	
	/** Copy another object to this one.
	 *  @param source is another MergeSets object or a ListSet object.
	 */
	assign(ds) {
		if (ds == this) return;
		if (ds.n > this.capacity) this.reset(ds.n);
		else { this.clear(); this._n = ds.n; }
		if (ds instanceof MergeSets) {
			for (let i = 0; i <= this.n; i++) {
				this.#p[i] = ds.#p[i]; this.#rank[i] = ds.#rank[i];
			}
		} else if (ds instanceof ListSet) {
			for (let i = 0; i <= this.n; i++) {
				if (!ds.isfirst(i)) continue;
				for (let j = ds.next(i); j != 0; j = ds.next(j))
					this.merge(this.find(i), j);
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
		fassert(this.valid(i));
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
	merge(i, j) {
		this.#mergeCount++;
		fassert(this.valid(i) && this.valid(j) &&
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
		fassert(this.valid(i));
		if (i == this.p(i)) return(i);
		else return this.findroot(this.p(i));
	}

	/** Compare two MergeSets for equality.
	 *  @param other is another MergeSets object or a string
	 *  @return true if they represent the same collection of sets.
	 */
	equals(other) {
		let ms = super.equals(other);
		if (typeof ms == 'boolean') return ms;
		// use smallest item in set as its 'id', store in set's root location
		let id1 = new Int32Array(this.n+1).fill(this.n+1);
		let id2 = new Int32Array(this.n+1).fill(this.n+1);

		for (let i = 1; i <= this.n; i++) {
			let r1 = this.findroot(i); id1[r1] = Math.min(i, id1[r1]);
			let r2 =   ms.findroot(i); id2[r2] = Math.min(i, id2[r2]);
		}
		for (let i = 1; i < this.n; i++) {
			if (id1[this.findroot(i)] != id2[ms.findroot(i)]) {
				return false;
			}
		}
		return ms;
	}

	/** Return a string representation of this object.
	 *  @param fmt is an integer; its low bits control the presentation
	 *		0001 causes each set to be shown on a separate line
	 *		0010 causes singletons to be shown
	 *		0100 causes the tree structure to be shown
	 *		1000 causes the rank to be shown
	 *	@param label is an optional function used to format set items
	 *  @return string
	 */
	toString(fmt=0, label=0) {
		if (!label) {
			label = (u => this.x2s(u) +
						  ((fmt&0x8) && this.rank(u) ?
								':' + this.rank(u) : ''));
		}
		let F = new Forest(this.n);
		for (let u = 1; u <= this.n; u++)
			if (this.p(u) != u) F.link(u,this.p(u));
		return F.toString(fmt,label);
	}

	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s) {
		let ls = new ListSet(); ls.fromString(s);
		if (this.n != ls.n) this.reset(ls.n);
		else this.clear();
		for (let i = 1; i <= this.n; i++) {
			if (!ls.isfirst(i)) continue;
			for (let j = ls.next(i); j; j = ls.next(j)) {
				this.merge(i,j);
			}
		}
		return true;
	}

	getStats() {
		return { 'merge' : this.#mergeCount,
				 'find'	: this.#findCount,
				 'findSteps' : this._findSteps };
	}
}
