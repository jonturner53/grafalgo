/** @file Matching.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../../dataStructures/Top.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Scanner from '../../dataStructures/basic/Scanner.mjs';

/** Data structure representing a matching of a graph.
 */
export default class Matching extends Top {
	g;			 // reference to graph
	elist;		 // list of edges in matching
	map;		 // array mapping vertex to matching edge
	
	/** Constructor for Matching.
	 *  @param g is the graph for the matching
	 */
	constructor(g) {
		super(g.n);
		this.g = g;
		this.elist = new List(this.g.edgeRange);
		this.elist.hasReverse = true;
		this.map = new Int32Array(this.g.n+1);
	}

	/** Assign new value to this from another. 
	 *  @paran that is another Matching object
	 */
	assign(that) {
		if (that == this) return;
		that.g = this.g; this._n = that.n
		this.elist.assign(that.elist);
		for (let u = 0; u <= this.g.n; u++)
			this.map[u] = that.map[u];
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param l is a list whose contents are to be transferred to this
	 */
	xfer(that) {
		if (that == this) return;
		this.g = that.g; this._n = that.n;
		this.elist = that.elist; this.map = that.map;
	}
	
	/** Restore to initial state. */
	clear() {
		for (let e = this.first(); e; e = this.next(e))
			this.map[g.left(e)] = this.map[g.right(e)] = 0;
		this.elist.clear();
	}

	/** Get the matching edge incident to a vertex */
	at(u) { return this.map[u]; }

	/** Get the first edge in matching. */
	first() { return this.elist.first(); }

	/** Get the next edge in matching. */
	next(e) { return this.elist.next(e); }

	/** Determine if edge is in matching. */
	contains(e) { return this.elist.contains(e); }

	/** Add an edge to matching.
	 *  This operation may make matching inconsistent
	 *  if either endpoint of e is already matched.
	 *  It is the client's responsibility to ensure
	 *  consistency.
	 */
	add(e) {
		if (this.elist.contains(e)) return;
		this.elist.enq(e);
		this.map[this.g.left(e)] = e;
		this.map[this.g.right(e)] = e;
	}

	/** Remove an edge from matching. */
	drop(e) {
		if (!this.elist.contains(e)) return;
		this.elist.delete(e);
		let u = this.g.left(e); let v = this.g.right(e);
		if (e == this.map[u]) this.map[u] = 0;
		if (e == this.map[v]) this.map[v] = 0;
	}

	/** Return the number of edges in a matching.
	 */
	size() { return this.elist.length; }
	
	/** Return the weight of a matching.  */
	weight() {
		let w = 0;
		for (let e = this.first(); e; e = this.next(e))
			w += this.g.weight(e);
		return w;
	}

	/** Compare two matchings for equality.
	 *  @param that is the matching to be compared to this one,
	 *  or a string representing a matching
	 *  @return true if they contain the same edges
	 */
	equals(that) {
		that = super.equals(that, [this.g]);
		if ((typeof that) == 'boolean') return that;
		if (this.n != that.n) return false;

		if (!this.elist.setEquals(that.elist)) return false;
		return that;
	}

	/** Create a string representation of the matching.
	 *  @param show is an optional function where show(e) returns
	 *  true if e should be included in the returned string;
	 *  if omitted, all edges are included
	 *  @return the string representation
	 */
	toString(show=0) {
		let showList = new List(this.g.edgeRange);
		for (let e = this.elist.first(); e; e = this.elist.next(e)) {
			if (!show || show(e)) showList.enq(e);
		}
		return showList.toString(e => this.g.e2s(e,0,1));
	}

	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		if (!sc.verify('[')) return false;
		let items = new Set();
		while (!sc.verify(']')) {
			let u = 0; let v = 0;
			if (sc.verify('{')) {
				u = sc.nextIndex();
				if (u == NaN) return false;
				if (!sc.verify(',')) return false;
				v = sc.nextIndex();
				if (v == NaN) return false;
				if (!sc.verify('}')) return false;
			} else if (this.g.n <= 26) {
				u = sc.nextIndex();
				if (u == NaN) return false;
				v = sc.nextIndex();
				if (v == NaN) return false;
			} else {
				return false;
			}
			if (!this.g.validVertex(u) || !this.g.validVertex(v))
				return false;
			let e = this.g.findEdge(u,v);
			if (!e || items.has(e)) return false;
			items.add(e);
		}
		for (let e of items) this.add(e);
		return true;
	}

	/** Verify that matching is consistent.
	 *  @param valid is a function that tests if an edge should be
	 *  checked for consistency in the matching; if omitted, all edges
	 *  are checked
	 */
	verify(valid=0) {
		for (let e = this.first(); e != 0; e = this.next(e)) {
			if (valid && !valid(e)) continue;
			if (this.at(this.g.left(e)) != e)
				return `left endpoint of matching edge ${this.g.e2s(e)} ` +
					   `does not match its defined matching edge ` +
					   `${this.g.e2s(this.at(this.g.left(e)))}`
			if (this.at(this.g.right(e)) != e)
				return `right endpoint of matching edge ${this.g.e2s(e)} ` +
					   `does not match its defined matching edge ` +
					   `${this.g.e2s(this.at(this.g.right(e)))}.`;
		}
	}
}
