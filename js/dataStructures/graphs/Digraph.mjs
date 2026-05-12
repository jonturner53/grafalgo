/** @file Digraph.js
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { scramble, shuffle } from '../../common/Random.mjs';
import Scanner from '../basic/Scanner.mjs';
import Graph from './Graph.mjs';
import { randomPermutation } from '../../common/Random.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Data structure for directed graph.
 *  Extends Graph class and places incoming edges before outgoing edges
 *  in adjuacency lists.
 */
export default class Digraph extends Graph {
	firstEpOut		// firstEpOut[u] is endpoint of first outgoing edge
					// in u's adjacency list

	/** Constructor for directed graph
	 *  @param n is the number of vertices
	 *  @param erange is the max number of edges to provide space for
	 */
	constructor(n, erange=n) {
		super(...arguments);
		this.firstEpOut = new Int32Array(this.n+1);
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
	firstInto(u) {
		let e = this.firstAt(u);
		return ((e == 0 || u == this.tail(e)) ? 0 : e);
	}

	/** Get the next edge coming into u.
	 *  @param u is a vertex
	 *  @param e is an edge entering u
	 *  @return the next edge in the list of edges entering u, or 0 if
	 *  no such edge
	 */ 
	nextInto(u, e) {
		e = this.nextAt(u, e);
		return ((e == 0 || u == this.tail(e)) ? 0 : e);
	}

	/** Get the first edge leaving u.
	 *  @param u is a vertex
	 *  @return the first edge in the list of edges leaving u, or 0 if
	 *  no such edge
	 */ 
	firstOutof(u) { return Math.trunc(this.firstEpOut[u]/2); }

	/** Get the next edge leaving u.
	 *  @param u is a vertex
	 *  @param e is an edge leaving u
	 *  @return the next edge in the list of edges leaving u, or 0 if
	 *  no such edge
	 */ 
	nextOutof(u, e) { return this.nextAt(u, e); }

	/** Compute the in-degree of a vertex.
	 *  @param u is a vertex
	 *  @return the number of edges incident to u
	 */
	inDegree(u) {
		ea && assert(this.validVertex(u));
		let d = 0;
		for (let e = this.firstInto(u); e; e = this.nextInto(u,e)) {
			 d++;
		}
		return d;
	}

	/** Compute the out-degree of a vertex.
	 *  @param u is a vertex
	 *  @return the number of edges incident to u
	 */
	outDegree(u) {
		ea && assert(this.validVertex(u));
		let d = 0;
		for (let e = this.firstOutof(u); e; e = this.nextOutof(u,e)) d++;
		return d;
	}

	/** Find a directed edge joining two vertices
	 *  @param u is a vertex
	 *  @param v is another vertex
	 *  @return an edge from u to v, or 0 if no such edge
	 */
	findEdge(u, v, edges) {
		ea && assert(this.validVertex(u) && this.validVertex(v));
		if (!edges) {
			for (let e = this.firstOutof(u); e; e = this.nextOutof(u, e)) {
				if (v == this.mate(u, e)) return e;
			}
			return 0;
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
	join(u, v, e=this.edges.first(2)) {
		ea && assert(this.validVertex(u) && this.validVertex(v) &&
					 (e > 0 || this.edges.first(2) == 0));
/*
		if (u > this.n || v > this.n || this.edges.length(2) == 0) {
			this.expand(Math.max(this.n, u, v), Math.max(e, this.edges.n+1));
		}
*/
		if (e == 0) e = this.edges.first(2);
		this.edges.swap(e);

		// initialize edge information
		this.Left[e] = u; this.Right[e] = v;
	
		// add edge to the endpoint lists
		if (this.firstEpOut[u] == 0) this.firstEpOut[u] = 2*e;
			// this.firstEpOut[u] changes only with first outgoing edge
		this.firstEp[u] = this.epLists.join(this.firstEp[u], 2*e);
		this.firstEp[v] = this.epLists.join(2*e+1, this.firstEp[v]);
			// incoming edges inserted at the front of the list,
			// to keep them separate from outputs
	
		return e;
	}

	/** Delete an edge from the graph.
	 *  @param e is the edge to be deleted.
	 */
	delete(e) {
		ea && assert(this.validEdge(e));
		let u = this.left(e);
		if (e == this.firstOutof(u))
			this.firstEpOut[u] = 2 * this.nextOutof(u,e);
		super.delete(e);
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
		let v1 = this.mate(u, e1); let v2 = this.mate(u, e2);
		return (v1 != v2 ? v1 - v2 : this.compareProps(e1, e2));
	}

	sortEplist(u) {
		super.sortEplist(u);
		// now determine the firstEpOut value for re-ordered list
		for (let e = this.firstAt(u); e; e = this.nextAt(u,e)) {
				if (u == this.tail(e)) {
				this.firstEpOut[u] = 2*e; break;
			}
		}
	}

	/** Compute a sorted list of edge numbers.
	 *  @param evec is an optional array of edge numbers; if present,
	 *  its edges are sorted; if omitted, all edges in graph are sorted
	 *  @return a sorted array of edge numbers, where edges  are sorted
	 *  first by the tail, then by the head; if edge properties are present,
	 *  they are used to break ties.
	 */
    sortedElist(evec=null) {
        // first create vector of edge information
        // [tail, head, edge number]
        if (evec == null) {
			let i = 0; evec = new Array(this.m);
			for (let e = this.first(); e; e = this.next(e))
				evec[i++] = e;
		}
		evec.sort((e1,e2) => { let [t1,h1] = [this.tail(e1), this.head(e1)];
							   let [t2,h2] = [this.tail(e2), this.head(e2)];
							   return t1 != t2 ? t1-t2 :
									   h1 != h2 ? h1-h2 :
							   		  	this.compareProps(e1,e2);
							   });
		return evec;
	}
	
	/** Compare another graph to this one.
	 *  @param that is a Digraph object or a string representing one.
	 *  @return true if g is equal to this; that is, it has the same
	 *  vertices, edges and edge lengths. Properties named 'length"
	 *  are checked, but others are not.
	 */
	equals(that) {
		that = super.equals(...(arguments.length==1 ?
							[that, this.n, Math.max(10,this.m)] : arguments));
		if ((typeof that) == 'boolean') return that;

		// now compare the edges using sorted edge lists
		// note: cannot rely on super.equals since directed graphs
		// separate inputs from ouputs in sorted adjacency lists
		let el1 = this.sortedElist(); let el2 = that.sortedElist();
		for (let i = 0; i < el1.length; i++) {
			let e1 = el1[i]; let e2 = el2[i];
			let t1 = this.tail(e1); let t2 = that.tail(e2);
			let h1 = this.head(e1); let h2 = that.head(e2);
			if (t1 != t2 || h1 != h2) return false;
			for (let j = 0; j < this.propNames.length; j++) {
				let ep1 = this.edgeProperties[j][e1];
				let ep2 = that.edgeProperties[j][e2];
				if ((typeof ep1 != 'number' && typeof ep1 != 'string') ||
					typeof ep1 != typeof ep2)
					continue;
				if ((typeof ep1 == 'number' && ep1 != ep2) ||
					(typeof ep1 == 'string' && ep1.localeCompare(ep2)))
					return false;
			}
		}
		return that;
	}

	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @return a string representing the edge
	 */
	edge2string(e, label, terse) {
		return e == 0 ? '-' :
				((terse && this.n <= 26) ?
					(this.x2s(this.tail(e), label) + 
					 this.x2s(this.head(e), label)) : 
					('(' + this.x2s(this.tail(e), label) + ','  +
					  this.x2s(this.head(e), label) +
					  (this.length ? ',' + this.length(e) : '') + ')'));
	}

	/** Construct a string representation of the Digraph object.
	 *  Uses elab to modify the behavior of the Graph.toString() method.
	 */
	toString(fmt=0, elab=0, vlab=0) {
		if (!elab) {
			elab = (e,u) =>
					(u == this.head(e) ? '' :
					 (this.x2s(this.mate(u,e)) +
						(this.edgeProperties.length > 0 &&
						 this.edgeProperties[0][e] ?
							(':' + this.edgeProperties[0][e]) : '')));
		}
		return super.toString(fmt, elab, vlab);
	}

	/** Initialize graph from a string representation.
	 *  @param s is a string representing a graph; if s includes
	 *  edge properties, they are assumed to represent lengths
	 *  @return true on success, else false
	 */
	static fromString(s, n=10, erange=n, propName='length', defVal=0) {
		// function to parse a vertex
		let vnext = (sc => {
						let u = sc.nextIndex();
						n = Math.max(n,u);
						return u > 0 ? u : 0;
					});
		// function to parse an adjacency list item and save properties
		let pairs = []; let pvals = []; let hasProps = 0;
		let enext = ((u,sc) => {
						let v = sc.nextIndex();
						if (v < 0) return false;
						n = Math.max(n,v);
						let i = pairs.length;
						pairs.push([u,v]);
						if (sc.verify(':',0)) {
							let w = sc.nextNumber();
							if (Number.isNaN(w)) return false;
							pvals[i] = w;
							hasProps = 1;
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

		let g = new Digraph(n, Math.max(erange, pairs.length));
		if (hasProps) g.addEdgeProperty(propName, defVal);

		// configure graph
		for (let i = 0; i < pairs.length; i++) {
			let [u,v] = pairs[i];
			let e = g.join(u,v);
			if (pvals[i] != undefined) {
				g.edgeProperties[0][e] = pvals[i];
			}
		}
		return g;
	}

	/** Randomize the order of the vertices, edges and adjacency lists.
	 *  @return the permutation used for the edges
	 */
	scramble() {
		let ep = super.scramble();
		// separate inputs/outputs in epLists
		for (let u = 1; u <= this.n; u++) {
			this.firstEpOut[u] = 0;
			let ep = this.firstEp[u];
			if (ep == 0) continue;
			let epl = ep;
			while (ep != 0 && ep != this.firstEpOut[u]) {
				// if ep is an output, move it to end of eplist
				let epNext = this.epLists.next(ep);
				if (ep%2 == 0) {
					epl = this.epLists.delete(ep, epl);
					epl = this.epLists.join(epl, ep);
					if (this.firstEpOut[u] == 0)
						this.firstEpOut[u] = ep;
				}
				ep = epNext;
			}
			this.firstEp[u] = epl;
		}
		return ep;
	}
	
	/** Compute random lengths for all the edges.
	 *  @param rand is a random number generator used to generate the
	 *  random edge lengths; it is invoked using any extra arguments
	 *  provided by caller; for example randomLengths(randomInteger, 1, 10)
     *  will assign random integer lengths in 1..10.
	 */
	randomLengths(rand, ...args) {
		if (!this.length) this.addEdgeProperty('length', 0);
		for (let e = this.first(); e; e = this.next(e)) {
			this.length(e, rand(...args));
		}
	}
}
