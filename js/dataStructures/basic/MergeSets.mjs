/** @file MergeSets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import ListSet from './ListSet.mjs';
import Scanner from './Scanner.mjs';
import Forest from '../trees/Forest.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Sets data structure maintains a collection of disjoint
 *  sets over the integers 1..N for some positive integer N. Allows
 *  one to quickly determine if two values are in the same set and
 *  supports constant-time union of two sets.
 */
export default class MergeSets extends Top {
	P;			// P[i] is parent of i
	Rank;	 	// Rank[i] is rank of i

	merges;
	finds;
	steps;
	
	constructor(n=10) {
		super(n);
		this.P = new Int32Array(this.n+1); 
		for (let i = 1; i <= this.n; i++) this.P[i] = i;
		this.Rank = new Int32Array(this.n+1);
	
		this.merges = this.finds = this.steps = 0;
	}
	
	/** Assign another MergeSets object to this one.
	 *  @param that is another MergeSets object.
	 */
	assign(that, relaxed=false) {
		super.assign(that, relaxed);
		for (let i = 0; i <= that.n; i++) {
			this.P[i] = that.P[i]; this.Rank[i] = that.Rank[i];
		}
	}

	/** Import a ListSets object into to this MergeSets object.
	 *  @param that is a ListSets object.
	 */
	importFrom(that) {
		ea && assert(that.constructor.name == 'ListSet');
		if (this.n != that.n) this.reset(that.n);
		else this.clear();
		for (let i = 0; i <= this.n; i++) {
			if (!that.isfirst(i)) continue;
			for (let j = that.next(i); j != 0; j = that.next(j))
				this.merge(this.find(i), j);
		}
	}

	xfer(that) {
		super.xfer(that);
		this.P = that.P; this.Rank = that.Rank;
		that.P = that.Rank = null;
	}
	
	/** Clear all items in a given range.
	 *  @param lo is the low end of the range of items to be cleared
	 *  @param hi is the high end of the range; all items <hi are cleared
	 */
	clear(lo=0, hi=this.n+1) {
		for (let i = lo; i < hi; i++) { this.P[i] = i; this.Rank[i] = 0; }
	}

	/** Return parent of a set element in the tree representation of the set.
	 *  @param i index of a set element
	 *  @return the parent of i
	 */
	p(i) { return this.P[i]; }

	/** Return rank of a set element in the tree representation of the set.
	 *  @param i index of a set element
	 *  @return the parent of i
	 */
	rank(i) { return this.Rank[i]; }

	/** Determine if an item is in a singleton set. */
	singleton(i) { return this.p(i) == i && this.rank(i) == 0; }
	
	/** Find and return the canonical element of a set.
	 *  Performs path compression as side-effect.
	 *  @param i is an index in some set
	 *  @return the canonical element of the set containing i
	 */
	find(i) {
		this.finds++;
		ea && assert(this.valid(i));
		let root;
		for (root = i; this.p(root) != root; root = this.p(root)) {
			this.steps++;
		}
		while (i != root) { let pi = this.p(i); this.P[i] = root; i = pi; }
		return root;
	}
	
	/** Combine two sets.
	 *  @param i is the canonical element of some set.
	 *  @param j is the canonical element of another (distinct) set
	 *  @return the canonical element of the set obtained by combining
	 *  the given sets
	 */
	merge(i, j) {
		this.merges++;
		ea && assert(this.valid(i) && this.valid(j) &&
			   this.p(i) == i && this.p(j) == j && i != j);
		if (this.rank(i) < this.rank(j)) {
			let t = i; i = j; j = t;
		} else if (this.rank(i) == this.rank(j)) {
			this.Rank[i]++;
		}
		this.P[j] = i;
		return i;
	}
	
	/** Get the canonical element of a set without restructuring the set.
	 *  @param i is an index in some set
	 *  @return the canonical element of the set containing i
	 */
	findroot(i) {
		ea && assert(this.valid(i),'xx'+i);
		if (i == this.p(i)) return(i);
		else return this.findroot(this.p(i));
	}

	/** Compare two MergeSets for equality.
	 *  @param that is another MergeSets object or a string
	 *  @return true if they represent the same collection of sets.
	 */
	equals(that) {
		that = super.equals(that);
		if (typeof that == 'boolean') return that;
		if (this.n != that.n) return false;

		// use smallest item in set as its 'id', store in set's root location
		let id1 = new Int32Array(this.n+1).fill(this.n+1);
		let id2 = new Int32Array(this.n+1).fill(this.n+1);

		for (let i = 1; i <= this.n; i++) {
			let r1 = this.findroot(i); id1[r1] = Math.min(i, id1[r1]);
			let r2 = that.findroot(i); id2[r2] = Math.min(i, id2[r2]);
		}
		for (let i = 1; i < this.n; i++) {
			if (id1[this.findroot(i)] != id2[that.findroot(i)]) {
				return false;
			}
		}
		return that;
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
	fromString(s, prop=0) {
		let ls = new ListSet(); 
		if (!ls.fromString(s, prop)) return false;
		this.importFrom(ls);
		return true;
	}

	getStats() {
		return { 'merge' : this.merges,
				 'find'	: this.finds,
				 'steps' : this.steps };
	}
}
