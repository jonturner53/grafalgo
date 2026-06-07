/** @file Flograph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../basic/List.mjs';
import Scanner from '../basic/Scanner.mjs';
import Digraph from './Digraph.mjs';
import { shuffle } from '../../common/Random.mjs';

import { assert, assertEnabled } from '../../common/Assert.mjs';
let ae; // initialized in constructor

/** Data structure for Flograph, used by max flow algorithms.
 *  Extends Digraph class and adds edge capacities, flows and
 *  optionally, minimum flow requirements and costs.
 */
export default class Flograph extends Digraph {
	Source;        // source vertex
	Sink;          // sink vertex

	ssCapScale;     // scaling factor used by randomCapacities() method
					// is set by RandomGraph.randomFlograph() method

	/** Constructor for flow graph
	 *  @param n is the number of vertices
	 *  @param erange is the max number of edges to provide space for
	 */
	constructor(n, erange) {
	ae = assertEnabled();
		super(n, erange); 
		this.Source = 1; this.Sink = this.n;

		this.addEdgeProperty('cap', 1);
		this.addEdgeProperty('flow', 0);

		this.ssCapScale = 1;
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

	/** Get the residual capacity of an edge.
	 *  @param u is a vertex in the flograph
	 *  @param e is an edge that is incident to u
	 *  @return the unused capacity of e, going from u to mate(u)
	 */
	res(e, u=this.tail(e)) {
		return (u == this.tail(e) ?
					this.cap(e) - this.flow(e) :
					this.flow(e) - (this.floor ? this.floor(e) : 0));
	}

	/** Get the flow on an edge relative to one of its endpoints.
	 *  @param e is an edge
	 *  @param u is an endpoint of e
	 *  @return the flow on e, going from u to mate(u)
	 */
	f(e, u=this.tail(e)) {
		return (u == this.tail(e) ? this.flow(e) : -this.flow(e));
	}

	/** Get the cost of an edge relative to one of its endpoints.
	 *  @param e is an edge
	 *  @param u is an endpoint of e
	 *  @return the cost of the flow on e, going from u to mate(u)
	 */
	c(e, u=this.tail(e)) {
		return (u == this.tail(e) ? this.cost(e) : -this.cost(e));
	}

	/** Add flow to an edge.
	 *  @param e is an edge
	 *  @param u is an endpoint of e
	 *  @param f is a flow amount to be added to the flow on e leaving u
	 */
	addFlow(e, u, f) {
		ae && assert(f <= this.res(e, u), 'addFlow: edge capacity violation');
		this.flow(e, this.flow(e) + (u == this.tail(e) ? f : (-f)));
	}

	/** Set the flow of every edge to zero. */
	clearFlow() {
		for (let e = this.first(); e; e = this.next(e))
			this.flow(e, 0);
	}

	/** Return the current flow magnitude (total flow leaving source). */
	totalFlow() {
		let flow = 0; let src = this.source;
		for (let e = this.firstOutof(src); e; e = this.nextOutof(src, e)) {
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
			for (let e = this.firstAt(u); e; e = this.nextAt(u,e)) {
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
			for (let e = this.firstOutof(u); e; e = this.nextOutof(u, e)) {
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
		for (let e = this.first(); e; e = this.next(e)) {
			cost += this.flow(e) * this.cost(e);
		}
		return cost;
	}

	/** Join two vertices with an edge.
	 *  @param u is a vertex
	 *  @param v is an edge
	 *  @param e is a currently unused edge number to be used for the
	 *  new edge (u,v); if omitted, the first available edge number is used
	 *  the edge capacity and flow are both initialized to zero,
	 *  as is the min flow requirement, if enabled
	 */
	join(u, v, e=this.edges.first(2)) {
		let ee = super.join(u, v, e);
//console.log('fgjoin', e, ee, this.edgeRange, this.validEdge(ee), this.edges.in(ee,1));
		this.cap(ee, 0); this.flow(ee, 0);
		if (this.cost) this.cost(ee, 0);
		if (this.floor) this.floor(ee, 0);
		return ee;
	}

	/** Compare another flograph to this one.
	 *  @param that is a Flograph object or a string representing one.
	 *  @param includeFlow (when true) causes the comparison to include
	 *  flows on edges
	 *  @return true if that is equal to this; that is, it has the same
	 *  vertices, edges, capacities, costs, floors (and possibly flows);
	 *  endpoint lists are sorted as a side effect
	 */
	equals(that, includeFlow=false) {
		// note: not leveraging superclass due to conflicting requirements
		if (this === that) return true;
        if (typeof that == 'string') {
            let s = that;
			that = Flograph.fromString(s, this.n, this.edgeRange);
			assert(that != null, 
				   'Flograph.fromString: called by .equals() cannot parse ' +s);
        } else if (that.constructor.name != 'Flograph') {
			return false;
		}
		if (!!this.cost  != !!that.cost  || !!this.floor != !!that.floor)
			return false;
		let el1 = this.sortedElist(); let el2 = that.sortedElist();
		for (let i = 0; i < el1.length; i++) {
			let e1 = el1[i]; let e2 = el2[i];
			if (this.cap(e1) != that.cap(e2) ||
				(includeFlow && this.flow(e1) != that.flow(e2)) ||
				this.cost  && this.cost(e1)  != that.cost(e2)   ||
				this.floor && this.floor(e1) != that.floor(e2)    ) {
				return false;
			}
		}
		return that;
	}

	/** Compare two edges incident to the same endpoint u.
	 *  @return -1 if u's mate in e1 is less than u's mate in e2,
	 *  return +1 if u's mate in e1 is greater than than u's mate in e2,
	 *  return  0 if u's mate in e1 is equal to its mate in e2.
	 */
	ecmp(e1, e2, u) {
		ae && assert(this.validVertex(u) && this.validEdge(e1)
										 && this.validEdge(e2));
			 if (u == this.head(e1) && u == this.tail(e2)) return -1;
		else if (u == this.tail(e1) && u == this.head(e2)) return 1;

		let v1 = this.mate(u, e1); let v2 = this.mate(u, e2);
		let cap1 = this.cap(e1); let cap2 = this.cap(e2);

		return (v1 != v2 ? v1 - v2 :
				(cap1 != cap2 ? cap1 - cap2 :
				 (this.cost && this.cost(e1) != this.cost(e2) ?
							   this.cost(e1)  - this.cost(e2) :
				  (this.floor && this.floor(e1) != this.floor(e2) ?
								 this.floor(e1)  - this.floor(e2) : 0))));
	}

	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @return a string representing the edge
	 */
	edge2string(e, label) {
		if (e == 0) return '-';
		return '(' + this.x2s(this.tail(e), label) + ',' 
				   + this.x2s(this.head(e), label) + ','
				   + (this.floor && this.floor(e)>0 ? this.floor(e) + '-' : '')
				   + this.cap(e)
				   + (this.cost && this.cost(e) ? '@' + this.cost(e) : '') 
				   + (this.f(e)>0 ? '/' + this.f(e) : '') + ')';
	}

	/** Construct a string representation of the Flograph object.
	 *  @param fmt is an integer; its low order bits specify format options
	 *		0b0001 causes the adjacency lists to be shown on separate lines
	 *		0b0010 causes empty lists to be shown explicitly
	 *		0b0100 omits edges from the list of the "larger" endpoint
	 *      0b1000 omits edges with zero flow
	 *  Uses elab and vlab  to modify the behavior of the Graph.toString()
	 *  method.
	 */
	toString(fmt=2, elab=0, vlab=0) {
		if (!elab) {
			elab = (e,u) => 
					(u == this.head(e) || (fmt&0x8 && this.flow(e) == 0) ? '' :
					 (this.x2s(this.mate(u,e)) + ':' +
					  (this.floor && this.floor(e)>0 ?
						this.floor(e) + '-' : '') +
				   	  this.cap(e) +
					  (this.cost && this.cost(e) ? '@' + this.cost(e) : '') +
					  (this.flow(e)>0 ? '/' + this.flow(e) : '')
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
	static fromString(s, n=10, erange=10) {
		let source = 0; let sink = 0;
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
		let hasFloors = 0; let hasCosts = 0;
		let enext = ((u,sc) => {
						let v = sc.nextIndex();
						if (v < 0) return false;
						n = Math.max(n,v);
						let i = pairs.length;
						pairs.push([u,v]);
						if (!sc.verify(':',0)) return false;
						let x = sc.nextNumber();
						if (Number.isNaN(x)) return false;
						if (!sc.verify('-')) {
							caps[i] = x;
						} else {
							floors[i] = x;
							hasFloors = 1;
							let cap = sc.nextNumber();
							if (Number.isNaN(cap)) return false; 
							caps[i] = cap;
						}
						if (sc.verify('@')) {
							let cost = sc.nextNumber();
							if (Number.isNaN(cost)) return false;
							costs[i] = cost;
							hasCosts = 1;
						}
						if (sc.verify('/')) {
							let flow = sc.nextNumber();
							if (Number.isNaN(flow)) return false;
							flows[i] = flow;
						}
						return true;
					});

		let sc = new Scanner(s);
		if (!sc.verify('{')) return null;
		while (!sc.verify('}')) {
			let u = vnext(sc);
			if (!u) return null;
			if (sc.verify('[')) {
				while (!sc.verify(']')) {
					if (!enext(u,sc)) return null;
				}
			}
		}

		let g = new Flograph(n, Math.max(erange, pairs.length));
		if (hasCosts) g.addEdgeProperty('cost', 0);
		if (hasFloors) g.addEdgeProperty('floor', 0);

		// configure graph
		for (let i = 0; i < pairs.length; i++) {
			let [u,v] = pairs[i];
			let e = g.join(u,v);
			g.cap(e, caps[i]);
			if (flows[i]) g.flow(e, flows[i]);
			if (g.cost && costs[i]) g.cost(e, costs[i]);
			if (g.floor && floors[i]) g.floor(e, floors[i]);
		}
		g.source = source; g.sink = sink;
		return g;
	}

	/** Randomize the order of the vertices and edges. */
	scramble() {
		let ep = super.scramble();
		shuffle(this.F, ep); shuffle(this.Cap, ep);
	}

	/** Compute random capacities for edges.
	 *  @param rand is a random number generator used to generate the
	 *  random edge capacities; it is invoked using any extra arguments
	 *  provided by caller; for example randomCapacities(randomInteger, 1, 10)
	 *  will assign random integer capacities in 1..10.
	*/
	randomCapacities(rand, ...args) {
		let s = this.source; let t = this.sink;
		for (let e = this.first(); e; e = this.next(e)) {
			let c = rand(...args);
			if (this.tail(e) == s || this.head(e) == t) c *= this.ssCapScale;
			this.cap(e, Math.max(c, (this.floor ? this.floor(e) : 0)));
		}
	}

	/** Compute random costs for all the edges.
	 *  @param rand is a random number generator used to generate the
	 *  random edge costs; it is invoked using any extra arguments
	 *  provided by caller; for example randomCosts(randomInteger, 1, 10)
	 *  will assign random integer costs in 1..10.
	 */
	randomCosts(rand, ...args) {
		if (!this.cost) this.addEdgeProperty('cost', 0);
		for (let e = this.first(); e; e = this.next(e)) {
			this.cost(e, rand(...args));
		}
	}

	/** Compute random floor values for all the edges.
	 *  @param rand is a random number generator used to generate the
	 *  random edge costs; it is invoked using any extra arguments
	 *  provided by caller; for example randomFloors(randomInteger, 1, 10)
	 *  will assign random integer costs in 1..10.
	 */
	randomFloors(rand, ...args) {
		if (!this.floor) this.addEdgeProperty('floor', 0);
		for (let e = this.first(); e; e = this.next(e)) {
			let f = rand(...args);
			this.floor(e, Math.min(f, this.cap(e)));
		}
	}
}
