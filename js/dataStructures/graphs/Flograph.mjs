/** @file Flograph.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import Digraph from './Digraph.mjs';
import { shuffle } from '../../common/Random.mjs';

/** Data structure for weighted undirected graph.
 *  Extends Graph class and places incoming edges before outgoing edges
 *  in adjuacency lists.
 */
export default class Flograph extends Digraph {
	#f;				// #f[e] is flow on edge e
	#cap;			// #cap[e] is capacity of edge e
	#source;		// source vertex
	#sink;			// sink vertex
	#floor;			// floor[e] is min flow requirement (optional)

	/** Constructor for directed graph
	 *  @param n is the number of vertices
	 *  @param ecap is the max number of edges to provide space for
	 *  @param vcap is the max number of vertices to provide space for
	 */
	constructor(n, ecap, vcap) {
		super(n, ecap, vcap); this.#init_d();
	}
	
	#init_d() {
		this.#f = new Array(this.edgeCapacity+1);
		this.#cap = new Array(this.edgeCapacity+1);
		this.#source = 1; this.#sink = this.n;
		if (this.floored) this.addFloors();
	} 

	get floored() { return (this.#floor ? true : false); }

	addCosts() { super.addWeights(); }
	
	addFloors() {
		this.#floor = new Array(this.edgeCapacity+1);
	}

	reset(n, ecap, vcap) {
		super.reset(n, ecap, vcap); this.#init_d();
	}

	expand(n, m) {
		if (n <= this.n && m <= this.m) return;
		if (n > this.vertexCapacity || m > this.edgeCapacity) {
			let vcap = (n <= this.vertexCapacity ? this.vertexCapacity :
							Math.max(n, Math.trunc(1.25*this.vertexCapacity)));
			let ecap = (m <= this.edgeCapacity ? this.edgeCapacity :
							Math.max(m, Math.trunc(1.25*this.edgeCapacity)));
			let nu = new Flograph(n, ecap, vcap);
			nu.assign(this); this.xfer(nu);
		}
		super.expand(n, m);
	}

	/** Assign one Flograph to another (but not its flow).
	 *  @param g is another Flograph that is copied to this one
	 */
	assign(g) {
		assert(g instanceof Flograph);
		if (g == this) return;
		if (g.n > this.vertexCapacity || g.m > this.edgeCapacity) {
			this.reset(g.n, g.m);
		} else {
			this.clear(); this._n = g.n;
		}
		if (g.floored && !this.floored) this.addFloors();
		if (!g.floored && this.floored) this.#floor = null;
		for (let e = g.first(); e != 0; e = g.next(e)) {
			let u = g.tail(e); let v = g.head(e);
			let ee = this.join(u, v);
			this.setCapacity(ee, g.cap(e)); this.setFlow(ee, 0);
			if (g.weighted) this.setCost(ee, g.cost(e));
			if (g.floored) this.setFloor(ee, g.floor(e));
		}
		this.setSource(g.source); this.setSink(g.sink);
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph whose contents is traferred to this one
	 */
	xfer(g) {
		assert(g instanceof Flograph);
		super.xfer(g);
		this.#floor = g.#floor; g.#floor = null;
		this.#f = g.#f; this.#cap = g.#cap;
		g.#f = g.#cap = null;
	}

	setSource(s) { this.#source = s; }
	setSink(t) { this.#sink = t; }
	get source() { return this.#source; }
	get sink() { return this.#sink; }

	/** Get the capacity of an edge.
	 *  @param e is an edge that is incident to u
	 *  @return the capacity of e
	 */
	cap(e) { return this.#cap[e]; }

	/** Get the min flow requirement for an edge.
	 *  @param e is an edge that is incident to u
	 *  @return the min flow requirement for e
	 */
	floor(e) {
		return (this.floored && this.#floor[e] ? this.#floor[e] : 0);
	}

	/** Get the cost of the current flow on an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the cost of the flow on e, going from u to mate(u)
	 */
	cost(e, u=this.tail(e)) {
		let c = super.weight(e);
		return (u == this.tail(e) ? c : -c);
	}

	/** Get the residual capacity of an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the unused capacity of e, going from u to mate(u)
	 */
	res(e, u=this.tail(e)) {
		return (u == this.tail(e) ? this.#cap[e] - this.#f[e] :
									this.#f[e] - this.floor(e));
	}

	/** Get the flow on an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the flow on e, going from u to mate(u)
	 */
	f(e, u=this.tail(e)) {
		return (u == this.tail(e) ? this.#f[e] : -this.#f[e]);
	}

	/** Change the flow on an edge.
	 *  @param e is an edge
	 *  @param f is the new flow on e from the tail to the head
	 */ 
	setFlow(e, f) {
		assert(f <= this.#cap[e], 'setFlow: edge capacity violation');
		this.#f[e] = f;
	}
	
	/** Change the capacity of an edge.
	 *  @param e is an edge 
	 *  @param cap is the new edge capacity for e
	 */
	setCapacity(e, cap) {
		assert(cap >= this.floor(e), 'setCapacity: edge capacity violation');
		this.#cap[e] = cap;
	}

	/** Change the cost of an edge.
	 *  @param e is an edge 
	 *  @param cost is the new edge cost for e
	 */
	setCost(e, cost) { super.setWeight(e, cost); }

	setFloor(e, floor) {
		if (!this.floored) this.addFloors();
		this.#floor[e] = floor;
	}

	clearFlow() {
		for (let e = this.first(); e != 0; e = this.next(e))
			this.setFlow(e, 0);
	}

	totalFlow() {
		let flow = 0; let src = this.source;
		for (let e = this.firstOut(src); e != 0; e = this.nextOut(src, e)) {
			flow += this.f(e);
		}
		return flow;
	}

	totalCost() {
		let cost = 0;
		for (let e = this.first(); e != 0; e = this.next(e)) {
			cost += this.f(e) * this.cost(e);
		}
		return cost;
	}

	/** Add flow to an edge.
	 *  @param e is an edge
	 *  @param u is an endpoint of e
	 *  @param f is a flow amount to be added to the flow on e leaving u
	 */
	addFlow(e, u, f) {
		assert(f <= this.res(e, u), 'addFlow: edge capacity violation');
		if (u == this.tail(e)) this.#f[e] += f;
		else 				   this.#f[e] -= f;
	}

	join(u, v, e) {
		let ee = super.join(u, v, e);
		this.setCapacity(ee, 0); this.setFlow(ee, 0);
		if (this.floored) this.setFloor(ee, 0);
		return ee;
	}

	/** Compare another flograph to this one.
	 *  @param g is a Flograph object or a string representing one.
	 *  @param includeFlow (when true) causes the comparison to include
	 *  flows on edges
	 *  @return true if g is equal to this; that is, it has the same
	 *  vertices, edges, capacities and costs (and possibly flows);
	 *  endpoint lists are sorted as a side effect
	 */
	equals(g, includeFlow=false) {
		if (g == this) return true;
		if (typeof g == 'string') {
			let s = g; g = new Flograph(this.n, this.m); g.fromString(s);
		}
		if (!(g instanceof Flograph)) return false;
		if (!super.equals(g)) return false;
		// so we have same edges, check capacities, costs and possibly flows
		let el1 = this.sortedElist(); let el2 = g.sortedElist();
		for (let i = 0; i < el1.length; i++) {
			if (this.cap(el1[i]) != g.cap(el2[i]) ||
				this.cost(el1[i]) != g.cost(el2[i]) ||
				(includeFlow && this.f(el1[i]) != g.f(el2[i])))
				return false;
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
			 if (u == this.head(e1) && u == this.tail(e2)) return -1;
		else if (u == this.tail(e1) && u == this.head(e2)) return 1;
		else {
			let v1 = this.mate(u, e1); let v2 = this.mate(u, e2);
			let cap1 = this.#cap[e1]; let cap2 = this.#cap[e2];
			return (v1 != v2 ? v1 - v2 :
					(cap1 != cap2 ? cap1 - cap2 :
					 this.cost(e1, v1) - this.cost(e2, v2)));
		}
	}

	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @return a string representing the edge
	 */
	edge2string(e, label) {
		if (e == 0) return '-';
		return '(' + this.index2string(this.tail(e), label) + ',' 
				   + this.index2string(this.head(e), label) + ','
				   + (this.cost(e>0) ? this.cost(e) + ',' : '') 
				   + (this.floor(e)>0 ? this.floor(e) + '-' : '')
				   + this.cap(e) + (this.f(e)>0 ? '/' + this.f(e) : '') + ')';
	}

	vertex2string(u, label=0) {
		let s = '';
		if (u == this.sink) s += '->';
		s += this.index2string(u, label);
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
	nabor2string(u, e, details=0, label=0) {
		let s = super.nabor2string(u, e, details, label);
		if (s.length == 0) return s;
		return s + ':' + (this.cost(e)>0 ? this.cost(e) + ',' : '') +
						 (this.floor(e)>0 ? this.floor(e) + '-' : '') +
						 this.cap(e) + (this.f(e)>0 ? '/' + this.f(e) : '');
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
		else if (sc.verify('->')) this.setSource(u);
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
		if (v == 0 || v == u) return 0;
		if (v > this.n) this.expand(v, this.m);
		if (this._nabors.contains(v)) {
			let ee = this._nabors.value(v);
			if (u == this.tail(ee)) return 0;  // parallel edge
		}
		let e = this.join(u, v);
		if (!sc.verify(':')) return 0;
		let x = sc.nextNumber(); if (isNaN(x)) return 0;
		if (sc.verify(',')) {
			this.setCost(e,x);
			x = sc.nextNumber(); if (isNaN(x)) return 0;
		}
		if (sc.verify('-')) {
			this.setFloor(e,x);
			x = sc.nextNumber(); if (isNaN(x)) return 0;
		}
		this.setCapacity(e,x);
		if (sc.verify('/')) {
			x = sc.nextNumber(); if (isNaN(x)) return 0;
			this.setFlow(e,x);
		}
		return e;
	}

	/** Randomize the order of the vertices and edges. */
	scramble() {
		let ep = super.scramble();
		shuffle(this.#f, ep); shuffle(this.#cap, ep);
	}

	/** Compute random capacities for edges.
	 *  @param scale is a scaling factor to be applied to the capacities
	 *  of source/sink edges.
	 *  @param f is a random number generator used to generate the
	 *  random edge capacities; it is invoked using any extra arguments
	 *  provided by caller; for example randomCapacities(randomInteger, 1, 10)
	 *  will assign random integer capacities in 1..10.
	*/
	randomCapacities(scale, f) {
		let fargs = [...arguments].slice(2);
		let s = this.source; let t = this.sink;
		for (let e = this.first(); e != 0; e = this.next(e)) {
			let c = f(...fargs);
			if (this.tail(e) == s || this.head(e) == t) c *= scale;
			this.setCapacity(e, Math.max(c, this.floor(e)));
		}
	}

	/** Compute random costs for all the edges.
	 *  @param f is a random number generator used to generate the
	 *  random edge costs; it is invoked using any extra arguments
	 *  provided by caller; for example randomCosts(randomInteger, 1, 10)
	 *  will assign random integer costs in 1..10.
	 */
	randomCosts(f) { super.randomLengths(...arguments); }

	/** Compute random floor values for all the edges.
	 *  @param f is a random number generator used to generate the
	 *  random edge costs; it is invoked using any extra arguments
	 *  provided by caller; for example randomFloors(randomInteger, 1, 10)
	 *  will assign random integer costs in 1..10.
	 */
	randomFloors(f) {
		if (!this.floored) this.addFloors();
		let fargs = [... arguments].slice(1);
        for (let e = this.first(); e != 0; e = this.next(e)) {
			let w = f(...fargs); this.setFloor(e, Math.min(w, this.cap(e)));
		}
	}
}
