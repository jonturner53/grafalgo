/** @file Digraph.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import { scramble, shuffle } from '../../common/Random.mjs';
import Graph from './Graph.mjs';
import { randomPermutation } from '../../common/Random.mjs';

/** Data structure for weighted undirected graph.
 *  Extends Graph class and places incoming edges before outgoing edges
 *  in adjuacency lists.
 */
export default class Digraph extends Graph {
	_firstEpOut		// _firstEpOut[u] is endpoint of first outgoing edge
					// in u's adjacency list

	/** Constructor for directed graph
	 *  @param n is the number of vertices
	 *  @param ecap is the max number of edges to provide space for
	 *  @param vcap is the max number of vertices to provide space for
	 */
	constructor(n, ecap, vcap) {
		super(n, ecap, vcap); this.#init_d();
	}
	
	#init_d() {
		this._firstEpOut = new Array(this.vertexCapacity+1).fill(0);
	} 

    addLengths() { super.addWeights(); }

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
			let nu = new Digraph(n, ecap, vcap);
			nu.assign(this);
			this.xfer(nu);
		}
		this._firstEpOut.fill(0, this.n+1, n+1);
		super.expand(n, m);
	}

	/** Assign one graph to another by copying its contents.
	 *  @param g is another graph whose contents is copied to this one
	 */
	assign(g) {
		assert(g instanceof Digraph);
		super.assign(g);
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph whose contents is transferred to this one
	 */
	xfer(g) {
		assert(g instanceof Digraph);
		this._firstEpOut = g._firstEpOut; g._firstEpOut = null;
		super.xfer(g)
	}

	/** Get the tail of a directed edge.
	 *  @param e is a directed edge
	 *  @return the vertex the e leaves from
	 */ 
	tail(e) { return this.left(e); }

	/** Get the head of a directed edge.
	 *  @param e is a directed edge
	 *  @return the vertex the e goes to
	 */ 
	head(e) { return this.right(e); }

	/** Get the first edge coming into u.
	 *  @param u is a vertex
	 *  @return the first edge in the list of edges entering u, or 0 if
	 *  no such edge
	 */ 
	firstIn(u) {
		let e = this.firstAt(u);
		return (u == this.tail(e) ? 0 : e);
	}

	/** Get the next edge coming into u.
	 *  @param u is a vertex
	 *  @param e is an edge entering u
	 *  @return the next edge in the list of edges entering u, or 0 if
	 *  no such edge
	 */ 
	nextIn(u, e) {
		e = this.nextAt(u, e);
		return (u == this.tail(e) ? 0 : e);
	}

	/** Get the first edge leaving u.
	 *  @param u is a vertex
	 *  @return the first edge in the list of edges leaving u, or 0 if
	 *  no such edge
	 */ 
	firstOut(u) { return Math.trunc(this._firstEpOut[u]/2); }

	/** Get the next edge leaving u.
	 *  @param u is a vertex
	 *  @param e is an edge leaving u
	 *  @return the next edge in the list of edges leaving u, or 0 if
	 *  no such edge
	 */ 
	nextOut(u, e) { return this.nextAt(u, e); }

	/** Compute the in-degree of a vertex.
	 *  @param u is a vertex
	 *  @return the number of edges incident to u
	 */
	inDegree(u) {
		assert(this.validVertex(u));
		let d = 0;
		for (let e = this.firstIn(u); e != 0; e = this.nextIn(u,e)) {
			 d++;
		}
		return d;
	}

	/** Compute the out-degree of a vertex.
	 *  @param u is a vertex
	 *  @return the number of edges incident to u
	 */
	outDegree(u) {
		assert(this.validVertex(u));
		let d = 0;
		for (let e = this.firstOut(u); e != 0; e = this.nextOut(u,e)) d++;
		return d;
	}

	/** Find a directed edge joining two vertices
	 *  @param u is a vertex
	 *  @param v is another vertex
	 *  @return an edge from u to v, or 0 if no such edge
	 */
	findEdge(u, v, edges) {
		assert(this.validVertex(u) && this.validVertex(v));
		for (let e = this.firstOut(u); e != 0; e = this.nextOut(u, e)) {
			if (this.head(e) == v) return e;
		}
		// do binary search in edges
		let lo = 0; let hi = edges.length-1;
		if (u > v) [u, v] = [v, u];
		while (lo < hi) {
			let mid = Math.floor((lo + hi) / 2);
			let e = edges[mid];
			let t = this.tail(e); let h = this.head(e);
				 if (u < t || (u == t && v < h)) hi = mid-1;
			else if (u > t || (u == t && v > h)) lo = mid+1;
			else return e;
		}
		return 0;
	}

	/** Join two vertices.
	 *  @param u is the tail for the new edge
	 *  @param v is the head of the new edge
	 *  @param e is the number of an "unused" edge;
	 *  if omitted, the first unused edge is used
	 *  @return the edge number for the new edge or 0
	 *  on failure
	 */
	join(u, v, e=this._edges.firstOut()) {
		assert(u > 0 && v > 0 && (e > 0 || this._edges.firstOut() == 0) &&
			   !this._edges.isIn(e));
		if (u > this.n || v > this.n || this._edges.nOut() == 0) {
			this.expand(Math.max(this.n, Math.max(u, v)),
						Math.max(e, this._edges.n+1));
			if (e == 0) e = this._edges.firstOut();
		}
		this._edges.swap(e);

		// initialize edge information
		this._left[e] = u; this._right[e] = v;
	
		// add edge to the endpoint lists
		if (this._firstEpOut[u] == 0) this._firstEpOut[u] = 2*e;
			// this._firstEpOut[u] changes only with first outgoing edge
		this._firstEp[u] = this._epLists.join(this._firstEp[u], 2*e);
		this._firstEp[v] = this._epLists.join(2*e+1, this._firstEp[v]);
			// incoming edges inserted at the front of the list,
			// to keep them separate from outputs
	
		return e;
	}

	/** Delete an edge from the graph.
	 *  @param e is the edge to be deleted.
	 */
	delete(e) {
		assert(this.validEdge(e));
		let u = this.left(e);
		if (e == this.firstOut(u))
			this._firstEpOut[u] = 2 * this.nextOut(u,e);
		super.delete(e);
	}

	/** Get the length of an edge.
	 *  @param e is an edge
	 *  @return the length of e
	 */
	length(e) { return super.weight(e); }

	/** Set the length of an edge.
	 *  @param e is an edge
	 *  @param l is a length to be assigned to e
	 */
	setLength(e, l) { super.setWeight(e, l); }

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
			return (v1 != v2 ? v1 - v2 : this.length(e1) - this.length(e2));
		}
		return 0;
	}

	sortEplist(u) {
		super.sortEplist(u);
		// now determine the firstEpOut value for re-ordered list
		for (let e = this.firstAt(u); e != 0; e = this.nextAt(u,e)) {
				if (u == this.tail(e)) {
				this._firstEpOut[u] = 2*e; break;
			}
		}
	}

	/** Compute a sorted list of edge numbers.
	 *  @param evec is an optional array of edge numbers; if present,
	 *  its edges are sorted; if omitted, all edges in graph are sorted
	 *  @return a sorted array of edge numbers, where edges  are sorted
	 *  first by the tail, then by the head; if lengths are present, they
	 *  are used to break ties.
	 */
    sortedElist(evec=null) {
        // first create vector of edge information
        // [smaller endpoint, larger endpoint, weight, edge number]
        if (evec) {
            for (let i = 0; i < evec.length; i++) {
                let e = evec[i];
				evec[i] = [this.tail(e), this.head(e), this.length(e), e];
            }
		} else {
			let i = 0; evec = new Array(this.m);
			for (let e = this.first(); e != 0; e = this.next(e)) {
				evec[i++] = [this.tail(e), this.head(e), this.length(e), e];
			}
		}
		evec.sort((t1, t2) => (t1[0] < t2[0] ? -1 : (t1[0] > t2[0] ? 1 :
							  	(t1[1] < t2[1] ? -1 : (t1[1] > t2[1] ? 1 :
								  (t1[2] < t2[2] ? -1 : (t1[2] > t2[2] ? 1 : 0
				  )))))));
		for (let i = 0; i < evec.length; i++) evec[i] = evec[i][3];
		return evec;
	}
	
	/** Compare another graph to this one.
	 *  @param g is a Digraph object or a string representing one.
	 *  @return true if g is equal to this; that is, it has the same
	 *  vertices, edges and edge weights; note: endpoint lists are
	 *  sorted as a side effect
	 */
	equals(g) {
		if (g == this) return true;
		if (typeof g == 'string') {
			let s = g; g = new Digraph(this.n, this.m); g.fromString(s);
		}
		if (!(g instanceof Digraph)) return false;
		if (this.m != g.m) return false;
		let el1 = this.sortedElist(); let el2 = g.sortedElist();
		for (let i = 0; i < el1.length; i++) {
			let t1 = this.tail(el1[i]); let t2 = g.tail(el2[i]);
			let h1 = this.head(el1[i]); let h2 = g.head(el2[i]);
			if (t1 != t2 || h1 != h2 || this.length(el1[i]) != g.length(el2[i]))
				return false;
		}
		return true;
	}

	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @return a string representing the edge
	 */
	edge2string(e, label) {
		return e == 0 ? '-' :
					'(' + this.index2string(this.tail(e), label) + ',' 
					+ this.index2string(this.head(e), label)
					+ (this.weighted ? ',' + this.length(e) : '') + ')';
	}

	/** Create a string representation of the neighbor of a vertex.
	 *  @param u is a vertex
	 *  @param e is an edge incident to u
	 *  @param showEdgeNum specifies that the edge number should be included
	 *  in the string
	 *  @return a string representing the mate(u,e), possibly followed by
	 *  an edge number, and definitely followed by the edge weight;
	 *  if details is true, incoming edges are returned, otherwise just
	 *  outgoing edges
	 */
	nabor2string(u, e, details=0, label=0) {
		if (u == this.head(e)) return '';
		let s = this.index2string(this.mate(u, e), label);
		if (details) s += '.' + e;
		if (this.weighted) {
			s += ':' + this.length(e);
		}
		return s;
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
		if (sc.verify(':')) { // read length
			let l = sc.nextNumber();
			if (isNaN(l)) return 0;
			this.setLength(e, l);
		}
		return e;
	}

	/** Randomize the order of the vertices, edges and adjacency lists.
	 *  @return the permutation used for the edges
	 */
	scramble() {
		let ep = super.scramble();
		// separate inputs/outputs in epLists
		for (let u = 1; u <= this.n; u++) {
			this._firstEpOut[u] = 0;
			let ep = this._firstEp[u];
			if (ep == 0) continue;
			let epl = ep;
			while (ep != 0 && ep != this._firstEpOut[u]) {
				// if ep is an output, move it to end of eplist
				let epNext = this._epLists.next(ep);
				if (ep%2 == 0) {
					epl = this._epLists.delete(ep, epl);
					epl = this._epLists.join(epl, ep);
					if (this._firstEpOut[u] == 0)
						this._firstEpOut[u] = ep;
				}
				ep = epNext;
			}
			this._firstEp[u] = epl;
		}
		return ep;
	}
	
	/** Compute random lengths for all the edges.
	 *  @param f is a random number generator used to generate the
	 *  random edge lengths; it is invoked using any extra arguments
	 *  provided by caller; for example randomLengths(randomInteger, 1, 10)
     *  will assign random integer lengths in 1..10.
	 */
	randomLengths(f) { super.randomWeights(...arguments); }
}
