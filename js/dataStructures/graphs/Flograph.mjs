/** @file Flograph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../basic/List.mjs';
import Digraph from './Digraph.mjs';
import { shuffle } from '../../common/Random.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Data structure for Flograph, used by max flow algorithms.
 *  Extends Digraph class and adds edge capacities, flows and
 *  optionally, minimum flow requirements and costs.
 */
export default class Flograph extends Digraph {
	F;             // F[e] is flow on edge e
	Cap;           // Cap[e] is capacity of edge e
	Source;        // source vertex
	Sink;          // sink vertex
	Floor;         // floor[e] is min flow requirement (optional)

	ssCapScale;     // scaling factor used by randomCapacities() method
					// is set by RandomGraph.randomFlograph() method

	/** Constructor for flow graph
	 *  @param n is the number of vertices
	 *  @param erange is the max number of edges to provide space for
	 */
	constructor(n, erange) {
		super(n, erange); 
		this.F = new Int32Array(this.edgeRange+1);
		this.Cap = new Int32Array(this.edgeRange+1);
		this.Source = 1; this.Sink = this.n;
		this.ssCapScale = 1;
		this.Floor = null;
	} 

	get hasFloors() { return (this.Floor ? true : false); }
	set hasFloors(on) {
		if (on && !this.Floor)
			this.Floor = new Int32Array(this.edgeRange+1);
		else if (!on & this.Floor)
			this.Floor = null;
	}

	/** Assign one Flograph to another (but not its flow).
	 *  @param other is another Flograph that is copied to this one
	 */
	assign(other, relaxed=false) {
		super.assign(other, relaxed);
		if (other.hasFloors && !this.hasFloors) this.hasFloors = true;
		if (!other.hasFloors && this.hasFloors) this.hasFloors = null;
		this.clear();
		for (let e = other.first(); e; e = other.next(e)) {
			let ee = this.edges.in(e,2) ?
					 	this.join(other.left(e), other.right(e), e) :
						this.join(other.left(e), other.right(e));
			this.cap(ee, other.cap(e)); this.flow(ee, 0);
			if (other.hasCosts) this.cost(ee, other.cost(e));
			if (other.hasFloors) this.floor(ee, other.floor(e));
		}
		this.source = other.source; this.sink = other.sink;
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param other is another graph whose contents is traferred to this one
	 */
	xfer(other) {
		super.xfer(other);
		this.F = other.F; this.Cap = other.Cap;
		other.F = other.Cap = null;
		this.Floor = other.Floor; other.Floor = null;
	}

	/** Get/set the source vertex.
	 *  @param s is the new source vertex.
	 *  @return the source
	 */
	get source() { return this.Source; }
	set source(s) { this.Source = s; }

	/** Get/set the sink vertex.
	 *  @param t is the new sink vertex
	 *  @return the sink
	 */
	get sink() { return this.Sink; }
	set sink(t) { this.Sink = t; }

	/** Get/set the capacity of an edge.
	 *  @param e is an edge that is incident to u
	 *  @return the capacity of e
	 */
	cap(e,c=-1) { if (c >= 0) this.Cap[e] = c; return this.Cap[e]; }

	/** Get/set the min flow requirement for an edge.
	 *  @param e is an edge that is incident to u
	 *  @return the min flow requirement for e
	 */
	floor(e,f=-1) {
		if (f >= 0) {
			if (!this.hasFloors) this.hasFloors = true;
			this.Floor[e] = f;
		}
		return this.hasFloors ? this.Floor[e] : 0;
	}

	/** Get the cost of an edge from a specified endpoint.
	 *  @param e is an edge
	 *  @param u is an endpoint of e
	 *  @return the cost of e, with from u to the other endpoint
	 */
	costFrom(e, u) {
		return u == this.tail(e) ? this.cost(e) : -this.cost(e);
	}

	/** Get the residual capacity of an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the unused capacity of e, going from u to mate(u)
	 */
	res(e, u=this.tail(e)) {
		return (u == this.tail(e) ? this.cap(e) - this.f(e) :
									this.f(e) - this.floor(e));
	}

	/** Get the flow on an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the flow on e, going from u to mate(u)
	 */
	f(e, u=this.tail(e)) {
		return (u == this.tail(e) ? this.F[e] : -this.F[e]);
	}

	/** Get/set the flow on an edge.
	 *  @param e is an edge
	 *  @param f is the new flow on e from the tail to the head
	 *  @return the flow from the tail
	 */ 
	flow(e, f=-1) {
		if (f >= 0) this.F[e] = Math.min(f, this.cap(e));
		return this.f(e);
	}
	
	/** Set the flow of every edge to zero. */
	clearFlow() {
		for (let e = this.first(); e != 0; e = this.next(e))
			this.flow(e, 0);
	}

	/** Return the current flow magnitude (total flow leaving source). */
	totalFlow() {
		let flow = 0; let src = this.source;
		for (let e = this.firstOut(src); e != 0; e = this.nextOut(src, e)) {
			flow += this.f(e);
		}
		return flow;
	}

	/** Return the set of vertices reachable from the source
	 *  with respect to the current flow.
	 */
	reachable() {
		let q = new List(this.n); let reached = new List(this.n);
		q.enq(1); reached.enq(1);
		while (!q.empty()) {
			let u = q.deq();
			for (let e = this.firstAt(u); e != 0; e = this.nextAt(u,e)) {
				let v = this.mate(u,e);
				if (!reached.contains(v) && !q.contains(v) &&
					this.res(e,u) > 0) {
					q.enq(v); reached.enq(v);
				}
			}
		}
		return reached;
	}

	/** Return flow statistics. 
	 *  @return an object containing several statistics about the current
	 *  flow (assumed to be a max flow); these include the value of the
	 *  flow, the number of vertices reachable from the source (not counting
	 *  source), the number of edges crossing the cut and the capacity of
	 *  the edges crossing the cut.
	 */
	flowStats() {
		let f = this.totalFlow();
		let reachable = this.reachable();
		let cutsize = 0; let cutcap = 0;
		for (let u = reachable.first(); u != 0; u = reachable.next(u)) {
			for (let e = this.firstOut(u); e != 0; e = this.nextOut(u, e)) {
				if (reachable.contains(this.head(e))) continue;
				cutsize++; cutcap += this.cap(e);
			}
		}
		return { 'totalFlow': f, 'reachable': reachable.length-1,
				 'cutsize': cutsize, 'cutcap': cutcap };
	}

	/** Return the current flow cost (sum of flow*cost for all edges). */
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
		ea && assert(f <= this.res(e, u)); // 'addFlow: edge capacity violation');
		if (u == this.tail(e)) this.F[e] += f;
		else 				   this.F[e] -= f;
	}

	/** Join two vertices with an edge.
	 *  @param u is a vertex
	 *  @param v is an edge
	 *  @param e is a currently unused edge number to be used for the
	 *  new edge (u,v); if omitted, the first available edge number is used
	 *  the edge capacity and flow are both initialized to zero,
	 *  as is the min flow requirement, if enabled
	 */
	join(u, v, e) {
		let ee = super.join(u, v, e);
		this.cap(ee, 0); this.flow(ee, 0);
		if (this.hasFloors) this.floor(ee, 0);
		return ee;
	}

	/** Compare another flograph to this one.
	 *  @param g is a Flograph object or a string representing one.
	 *  @param includeFlow (when true) causes the comparison to include
	 *  flows on edges
	 *  @return true if other is equal to this; that is, it has the same
	 *  vertices, edges, capacities and costs (and possibly flows);
	 *  endpoint lists are sorted as a side effect
	 */
	equals(other, includeFlow=false) {
		other = super.equals(other);
		if (typeof other == 'boolean') return other;
		if (this.m != other.m) return false;
		let el1 = this.sortedElist(); let el2 = other.sortedElist();
		for (let i = 0; i < el1.length; i++) {
			let e1 = el1[i]; let e2 = el2[i];
			if (this.cap(e1) != other.cap(e2) ||
				this.floor(e1) != other.floor(e2) ||
				(includeFlow && this.f(e1) != other.f(e2))) {
				return false;
			}
		}
		return other;
	}

	/** Compare two edges incident to the same endpoint u.
	 *  @return -1 if u's mate in e1 is less than u's mate in e2,
	 *  return +1 if u's mate in e1 is greater than than u's mate in e2,
	 *  return  0 if u's mate in e1 is equal to its mate in e2.
	 */
	ecmp(e1, e2, u) {
		ea && assert(this.validVertex(u) && this.validEdge(e1)
										 && this.validEdge(e2));
			 if (u == this.head(e1) && u == this.tail(e2)) return -1;
		else if (u == this.tail(e1) && u == this.head(e2)) return 1;
		else {
			let v1 = this.mate(u, e1); let v2 = this.mate(u, e2);
			let cap1 = this.cap(e1); let cap2 = this.cap(e2);
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
		return '(' + this.x2s(this.tail(e), label) + ',' 
				   + this.x2s(this.head(e), label) + ','
				   + (this.floor(e)>0 ? this.floor(e) + '-' : '')
				   + this.cap(e)
				   + (this.cost(e) ? '@' + this.cost(e) : '') 
				   + (this.f(e)>0 ? '/' + this.f(e) : '') + ')';
	}

	/** Construct a string representation of the Flograph object.
	 *  Uses elab and vlab  to modify the behavior of the Graph.toString()
	 *  method.
	 */
	toString(fmt=0, elab=0, vlab=0) {
		if (!elab) {
			elab = (e,u) => 
					(u == this.head(e) ? '' :
					 (this.x2s(this.mate(u,e)) + ':' +
					  (this.floor(e)>0 ? this.floor(e) + '-' : '') +
				   	  this.cap(e) +
					  (this.cost(e) ? '@' + this.cost(e) : '') +
					  (this.f(e)>0 ? '/' + this.f(e) : '')
					 ));
		}
		if (!vlab) {
			vlab = (u) =>
						(u == this.source ? this.x2s(u) + '->' :
						 (u == this.sink ? '->' + this.x2s(u) : this.x2s(u)));
		}
		return super.toString(fmt, elab, vlab);
	}

		
	/** Initialize graph from a string representation.
	 *  @param s is a string representing a graph
	 *  @return true on success, else false
	 */
	fromString(s) {
		let n = 1; let source = 0; let sink = 0;
		// function to parse a vertex
		let vnext = (sc => {
						let u;
						if (sc.verify('->')) {
							u = sc.nextIndex();
							if (sink) return false;
							sink = u;
						} else {
							u = sc.nextIndex();
							if (sc.verify('->')) {
								if (source || source == u) return false;
								source = u;
							}
						}
						n = Math.max(n,u);
						return u > 0 ? u : 0;
					});
		// function to parse an adjacency list item and save properties
		let pairs=[]; let floors=[]; let caps=[]; let flows=[]; let costs=[];
		let enext = ((u,sc) => {
						let v = sc.nextIndex();
						if (v < 0) return false;
						n = Math.max(n,v);
						let i = pairs.length;
						pairs.push([u,v]);
						if (!sc.verify(':')) return false;
						let x = sc.nextNumber();
						if (Number.isNaN(x)) return false;
						if (!sc.verify('-')) {
							caps[i] = x;
						} else {
							floors[i] = x;
							let cap = sc.nextNumber();
							if (Number.isNaN(cap)) return false; 
							caps[i] = cap;
						}
						if (sc.verify('@')) {
							let cost = sc.nextNumber();
							if (Number.isNaN(cost)) return false;
							costs[i] = cost;
						}
						if (sc.verify('/')) {
							let flow = sc.nextNumber();
							if (Number.isNaN(flow)) return false;
							flows[i] = flow;
						}
						return true;
					});

		if (!super.parseString(s, vnext, enext)) return false;

		// configure graph
		let erange = Math.max(1,pairs.length);
		if (n != this.n || erange != this.erange) this.reset(n, erange);
		else this.clear();

		for (let i = 0; i < pairs.length; i++) {
			let [u,v] = pairs[i];
			let e = this.join(u,v);
			this.cap(e, caps[i]);
			if (floors[i]) this.floor(e, floors[i]);
			if (flows[i]) this.flow(e, flows[i]);
			if (costs[i]) this.cost(e, costs[i]);
		}
		this.source = source; this.sink = sink;
		return true;
	}

	/** Randomize the order of the vertices and edges. */
	scramble() {
		let ep = super.scramble();
		shuffle(this.F, ep); shuffle(this.Cap, ep);
	}

	/** Compute random capacities for edges.
	 *  @param scale is a scaling factor to be applied to the capacities
	 *  of source/sink edges.
	 *  @param f is a random number generator used to generate the
	 *  random edge capacities; it is invoked using any extra arguments
	 *  provided by caller; for example randomCapacities(randomInteger, 1, 10)
	 *  will assign random integer capacities in 1..10.
	*/
	randomCapacities(f) {
		let fargs = [...arguments].slice(1);
		let s = this.source; let t = this.sink;
		for (let e = this.first(); e != 0; e = this.next(e)) {
			let c = f(...fargs);
			if (this.tail(e) == s || this.head(e) == t) c *= this.ssCapScale;
			this.cap(e, Math.max(c, this.floor(e)));
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
		if (!this.hasFloors) this.hasFloors = true;
		let fargs = [... arguments].slice(1);
		for (let e = this.first(); e != 0; e = this.next(e)) {
			let w = f(...fargs); this.floor(e, Math.min(w, this.cap(e)));
		}
	}
}
