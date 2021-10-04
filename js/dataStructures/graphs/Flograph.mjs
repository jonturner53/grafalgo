/** @file Flograph.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../Errors.mjs';
import Adt from '../Adt.mjs';
import Digraph from './Digraph.mjs';
import List from '../basic/List.mjs';
import Dlists from '../basic/Dlists.mjs';
import ListPair from '../basic/ListPair.mjs';

/** Data structure for weighted undirected graph.
 *  Extends Graph class and places incoming edges before outgoing edges
 *  in adjuacency lists.
 */
export default class Flograph extends Digraph {
	_f;				// _f[e] is flow on edge e
	_cap;			// _cap[e] is capacity of edge e
	_source;		// source vertex
	_sink;			// sink vertex

	/** Constructor for directed graph
	 *  @param n is the number of vertices
	 *  @param ecap is the max number of edges to provide space for
	 *  @param vcap is the max number of vertices to provide space for
	 */
	constructor(n, ecap, vcap) {
		super(n, ecap, vcap); this.#init_d();
	}
	
	#init_d() {
		this._f = new Array(this._ecap+1).fill(0);
		this._cap = new Array(this._ecap+1).fill(0);
		this._source = 1; this._sink = this.n;
	} 

	reset(n, ecap, vcap) {
		super.reset(n, ecap, vcap); this.#init_d();
	}

	expand(n, m) {
		if (n <= this.n && m <= this.m) return;
		if (n > this._vcap || m > this._ecap) {
			let vcap = (n <= this._vcap ? this._vcap :
							Math.max(n, Math.trunc(1.25*this._vcap)));
			let ecap = (m <= this._ecap ? this._ecap :
							Math.max(m, Math.trunc(1.25*this._ecap)));
			let nu = new Flograph(n, ecap, vcap);
			nu.assign(this); this.xfer(nu);
		}
		this._f.fill(0, this.m+1, m+1);
		this._cap.fill(0, this.m+1, m+1);
		super.expand(n, m);
	}

	/** Assign one Flograph to another (but not its flow).
	 *  @param g is another Flograph that is copied to this one
	 */
	assign(g) {
		this.reset(g.n, g.m);
		for (let e = g.first(); e !=0; e = g.next(e)) {
			let u = g.tail(e); let v = g.head(e);
			this.join(u, v);
			this.setCapacity(e, g.cap(u, e)); this.setFlow(e, 0);
		}
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph whose contents is traferred to this one
	 */
	xfer(g) {
		this._f = g._f; this._cap = g._cap;
		g._firstEpOut = g._cap = null;
		super.xfer(g);
	}

	setSource(s) { this._source = s; }
	setSink(t) { this._sink = t; }
	get source() { return this._source; }
	get sink() { return this._sink; }

	/** Get the flow on an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the flow on e, going from u to mate(u)
	 */
	f(u, e) { return (u == this.tail(e) ? this._f[e] : -this._f[e]); }

	/** Get the capacity of an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the capacity of e, going from u to mate(u)
	 */
	cap(u, e) { return (u == this.tail(e) ? this._cap[e] : 0); }

	/** Get the residual capacity of an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the unused capacity of e, going from u to mate(u)
	 */
	res(u, e) { return (u == this.tail(e) ? this._cap[e] - this._f[e]
										  : this._f[e]); }

	/** Change the flow on an edge.
	 *  @param e is an edge
	 *  @param f is the new flow on e from the tail to the head
	 */ 
	setFlow(e, f) {
		assert(0 <= f && f <= this._cap[e], 'edge capacity violation');
		this._f[e] = f; }
	
	/** Change the capacity of an edge.
	 *  @param e is an edge 
	 *  @param cap is the new edge capacity for e
	 */
	setCapacity(e, cap) { this._cap[e] = cap; }

	clearFlow() {
		for (let e = this.first(); e != 0; e = this.next(e))
			this.setFlow(3, 0);
	}

	totalFlow() {
		let flow = 0; let src = this.source;
		for (let e = this.firstOut(src); e != 0; e = this.nextOut(src, e)) {
			flow += this.f(src, e);
		}
		return flow;
	}

	addFlow(u, e, f) {
		assert(f + this.f(u, e) <= this.cap(u, e), 'edge capacity violation');
		if (u == this.tail(e)) this._f[e] += f;
		else 				   this._f[e] -= f;
	}

	/** Compare another flograph to this one.
	 *  @param g is a Flograph object or a string representing one.
	 *  @param includeFlow (when true) causes the comparison to include
	 *  flows on edges
	 *  @return true if g is equal to this; that is, it has the same
	 *  vertices, edges and capacities (and possibly flows);
	 *  endpoint lists are sorted as a side effect
	 */
	equals(g, includeFlow=false) {
		if (g == this) return true;
		if (typeof g == 'string') {
			let s = g; g = new Flograph(this.n, this.m); g.fromString(s);
		}
		if (!(g instanceof Flograph)) return false;
		if (!super.equals(g)) return false;
		// so we have same edges in same order, check capacities
		for (let u = 1; u <= this.n; u++) {
			let e = this.firstOut(u); let ge = g.firstOut(u);
			while (e != 0) {
				if (this._cap[e] != g._cap[ge]) return false;
				if (includeFlow && this._f[e] != g._f[ge]) return false;
				e = this.nextOut(u, e); ge = g.nextOut(u, ge);
			}
		}
		return true;
	}

	/** Compare two edges incident to the same endpoint u.
	 *  @return -1 if u's mate in e1 is less than u's mate in e2,
	 *  return +1 if u's mate in e1 is greater than than u's mate in e2,
	 *  return  0 if u's mate in e1 is equal to its mate in e2.
	 */
	ecmp(e1, e2, u) {
		assert(this.validVertex(u) && this.validEdge(e1) && this.validEdge(e2));
		let status = super.ecmp(e1, e2, u);
		if (status != 0) return status;
		// will not reach here so long as graph is simple
		let v1 = this.tail(e1); let v2 = this.tail(e2);
		return (this.cap(v1, e1) - this.cap(v1, e2));
	}

	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @return a string representing the edge
	 */
	edge2string(e) {
		let u = this.tail(e);
		return '(' + this.index2string(this.tail(e)) + ',' 
				   + this.index2string(this.head(e)) + ','
				   + this.cap(u, e) + ',' + this.f(u,e) + ')';
	}

	vertex2string(u, strict=0) {
		let s = '';
		if (u == this.sink) s += '->';
		s += this.index2string(u, strict);
		if (u == this.source) s += '->';
		return s;
	}

	/** Create a string representation of the neighbor of a vertex.
	 *  @param u is a vertex
	 *  @param e is an edge incident to u
	 *  @param details specifies that the edge number should be included
	 *  in the string
	 *  @return a string representing the mate(u,e), possibly followed by
	 *  an edge number, and definitely followed by the capacity and flow,
	 *  if e is an out-going edge of u; otherwise return empty string
	 */
	nabor2string(u, e, details=0, strict=0) {
		let s = super.nabor2string(u, e, details, strict);
		if (s.length == 0) return s;
		return s + ':' + this.cap(u, e) + ':' + this.f(u,e);
	}

    /** Get the next vertex (from the start of an alist) from a scanner.
     *  @param sc is a scanner for a string representation of a flow graph
     *  @return the vertex that is assumed to be the next thing in the 
     *  scanner string, or 0 if not successfule
     */
    nextVertex(sc) {
		let gotSink = sc.verify('->');
		let u = sc.nextIndex();
		if (u == 0) return 0;
		if (gotSink) this.setSink(u);
		if (sc.verify('->')) this.setSource(u);
		return u;
	}

	/** Get the neighbor of a given vertex from a scanner and add connecting
	 *  edge to this Graph.
	 *  @param u is a vertex in the graph.
	 *  @param sc is a scanner that has been initialized with a string
	 *  representing a Graph and the next index to be scanned represnets
	 *  a neighbor of u, possibly followed by an explicit edge number.
	 *  @return the edge number for the new edge, if the operation was
	 *  successful, else 0.
	 */
	nextNabor(u, sc) {
		let v = sc.nextIndex();
		if (v == 0) return 0;
		if (v > this.n) this.expand(v, this.m);
		let e = 0;
		if (!sc.verify('.')) {
			e = this.join(u, v);
		} else {
			e = sc.nextInt();
			if (isNaN(e)) return 0;
			if (e >= this.m) this.expand(this.n, e);
			if (this.join(u, v, e) != e) return 0;
		}
		if (!sc.verify(':')) return 0;
		let cap = sc.nextNumber();
		if (isNaN(cap)) return 0;
		if (!sc.verify(':')) return 0;
		let f = sc.nextNumber();
		if (isNaN(f)) return 0;
		this.setCapacity(e, cap);
		this.setFlow(e, f);
		return e;
	}
}
