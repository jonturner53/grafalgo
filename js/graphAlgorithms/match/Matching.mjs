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
	#elist;		 // list of edges in matching
	#map;		 // array mapping vertex to matching edge
	
	/** Constructor for Matching.
	 *  @param g is the graph for the matching
	 */
	constructor(g) {
		super(g.n);
		this.g = g;
		this.#elist = new List(this.g.edgeCapacity);
		this.#elist.addPrev();
		this.#map = new Int32Array(this.g.n+1);
	}

	/** Assign new value to this from another. 
	 *  @paran match is another Matching object
	 */
	assign(match) {
		if (match == this) return;
		match.g = this.g; this._n = match.n
		this.#elist.assign(match.#elist);
		for (let u = 0; u <= this.g.n; u++)
			this.#map[u] = match.#map[u];
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param l is a list whose contents are to be transferred to this
	 */
	xfer(match) {
		if (match == this) return;
		this.g = match.g; this._n = match.n;
		this.#elist = match.elist; this.#map = match.map;
	}
	
	/** Restore to initial state. */
	clear() { this.#elist.clear(); this.#map.fill(0); }

	/** Get the matching edge incident to a vertex */
	at(u) { return this.#map[u]; }

	/** Get the first edge in matching. */
	first() { return this.#elist.first(); }

	/** Get the next edge in matching. */
	next(e) { return this.#elist.next(e); }

	/** Determine if edge is in matching. */
	contains(e) { return this.#elist.contains(e); }

	/** Add an edge to matching.
	 *  This operation may make matching inconsistent
	 *  if either endpoint of e is already matched.
	 *  It is the client's responsibility to ensure
	 *  consistency.
	 */
	add(e) {
		if (this.#elist.contains(e)) return;
		this.#elist.enq(e);
		this.#map[this.g.left(e)] = e;
		this.#map[this.g.right(e)] = e;
	}

	/** Remove an edge from matching. */
	drop(e) {
		if (!this.#elist.contains(e)) return;
		this.#elist.delete(e);
		let u = this.g.left(e); let v = this.g.right(e);
		if (e == this.#map[u]) this.#map[u] = 0;
		if (e == this.#map[v]) this.#map[v] = 0;
	}

	/** Return the number of edges in a matching.
	 */
	size() { return this.#elist.length; }
	
	/** Return the weight of a matching.
	 */
	weight() {
		let w = 0;
		for (let e = this.first(); e != 0; e = this.next(e))
			w += this.g.weight(e);
		return w;
	}

	/** Compare two matchings for equality.
	 *  @param other is the matching to be compared to this one,
	 *  or a string representing a matching
	 *  @return true if they contain the same edges
	 */
	equals(other) {
		if (this === other) return true;
        if (typeof other == 'string') {
			if (!('fromString' in this)) 
				return this.toString() == other.toString();
            let s = other;
			other = new this.constructor(this.g);
			other.fromString(s);
        }
		if (other.constructor.name != this.constructor.name ||
		    other.n != this.n) {
			return false;
		}
		if (!this.#elist.setEquals(other.#elist)) return false;
		return other;
	}

	/** Create a string representation of the matching.
	 *  @param show is an optional function where show(e) returns
	 *  true if e should be included in the returned string;
	 *  if omitted, all edges are included
	 *  @return the string representation
	 */
	toString(show=0) {
		let showList = new List(this.g.edgeRange);
		for (let e = this.#elist.first(); e; e = this.#elist.next(e)) {
			if (!show || show(e)) showList.enq(e);
		}
		let w = this.weight();
		return showList.toString(e =>
					(this.g.n <= 26 ?  this.g.e2s(e,0,1) : this.g.e2s(e))
					+ (this.g.weight(e) ? ':' + this.g.weight(e) : ''))
				+ (w != 0 ? ' ' + w : '');
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
			if (!sc.verify('{')) return false;
			let u = sc.nextIndex();
			if (Number.isNaN(u)) return false;
			if (!sc.verify(',')) return false;
			let v = sc.nextIndex();
			if (Number.isNaN(v)) return false;
			if (sc.verify(',')) {
				if (Number.isNaN(sc.nextNumber()))
					return false;
			}
			if (!sc.verify('}')) return false;
			if (!this.g.validVertex(u) || !this.g.validVertex(v))
				return false;
			let e = this.g.findEdge(u,v);
			if (!e || items.has(e)) return false;
			items.add(e);
		}
		for (let e of items) this.add(e);
		return true;
	}

	verify() {
		for (let e = this.first(); e != 0; e = this.next(e)) {
			if (this.at(this.g.left(e)) != e)
				return `left endpoint of matching edge ${this.g.e2s(e)} ` +
					   `does not match its defined matching edge.`;
			if (this.at(this.g.right(e)) != e)
				return `right endpoint of matching edge ${this.g.e2s(e)} ` +
					   `does not match its defined matching edge.`;
		}
	}
}
