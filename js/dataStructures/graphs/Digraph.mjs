/** @file Digraph.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import { scramble } from '../../common/Random.mjs';
import Adt from '../Adt.mjs';
import Graph from './Graph.mjs';
import List from '../basic/List.mjs';
import Dlists from '../basic/Dlists.mjs';
import ListPair from '../basic/ListPair.mjs';

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
		this._firstEpOut = new Array(this._vcap+1).fill(0);
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
			let nu = new Digraph(n, ecap, vcap);
			nu.assign(this); this.xfer(nu);
		}
		this._firstEpOut.fill(0, this.n+1, n+1);
		super.expand(n, m);
	}

	/** Assign one graph to another.
	 *  @param g is another graph that is copied to this one
	assign(g) {
		super.assign(g);
	}
	 */
	
	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph whose contents is traferred to this one
	 */
	xfer(g) {
		this._firstEpOut = g._firstEpOut; g._firstEpOut = null;
		super.xfer(g);
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
	firstIn(u) { return this.firstAt(u); }

	/** Get the next edge coming into u.
	 *  @param u is a vertex
	 *  @param e is an edge entering u
	 *  @return the next edge in the list of edges entering u, or 0 if
	 *  no such edge
	 */ 
	nextIn(u, e) {
		let ee = this.nextAt(u, e);
		return (u == this.tail(ee) ? 0 : ee);
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
		for (let e = this.firstIn(u); e != 0; e = this.nextIn(u,e)) d++;
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
	findEdge(u, v) {
		assert(this.validVertex(u) && this.validVertex(v));
		for (let e = this.firstOut(u); e != 0; e = this.nextOut(u, e)) {
			if (this.head(e) == v) return e;
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
		if (this.firstOut(u) == 0) this._firstEpOut[u] = 2*e;
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
		let u = this._left[e]; let v = this._right[e];
		this._firstEpOut[u] = 2 * (e == this.firstOut(u) ? this.nextOut(u, e) :
														   this.firstOut(u));
		super.delete(e);
	}

	sortAlist(u) {
		super.sortAlist(u);
		for (let e = this.firstAt(u); e != 0; e = this.nextAt(u)) {
			if (u == this.tail(e)) {
				this._firstEpOut[u] = 2*e; break;
			}
		}
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
		if (!super.equals(g)) return false;
		// so we have same input edges in same order, now check that firstOut
		// values  match
		for (let u = 1; u <= this.n; u++) {
			if (this.head(this.firstOut(u)) != g.head(g.firstOut(u)))
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
		let status = super.ecmp(e1, e2, u);
		if (u == this.tail(e1) && u == this.tail(e2) ||  // both out-edges
			u == this.head(e1) && u == this.head(e2))	// both in-edges
			return status
		else
			return (u == this.head(e1) ? -1 : 1);  // in-edges come first
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
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @return a string representing the edge
	 */
	edge2string(e) {
		return "(" + this.index2string(this.tail(e)) + "," 
				   + this.index2string(this.head(e)) + ")";
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
	nabor2string(u, e, details=0, strict=0) {
		if (u == this.head(e) && !details) return '';
		let s = this.index2string(this.mate(u, e), strict);
		if (u == this.head(e)) s += '>';
		//if (details) s += ':' + e;
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
		return e;
	}

	/** Randomize the order of the vertices, edges and adjacency lists.
	 *  @return pair [vp, ep] where vp is the permutation used to permute
	 *  the vertices and ep is the permutation used to permute the edges
	 */
	scramble() {
		let vp = randomPermutation(this.n);
		let ep = randomPermutation(this._ecap);
		this._shuffle(vp, ep);

		// finally scramble individual eplists
		for (let u = 1; u <= this.n; u++) {
			// scramble inputs to u separately from outputs
			if (this._firstEp[u] == 0) continue;
			let epi = [0]; let ee = this._firstEp[u];
			while (ee != 0 && u == this.head(Math.floor(ee/2))) {
				epi.push(ee); ee = this.eplists.delete(ee, ee);
			}
			let epo = [0]; ee = this._firstEp[u];
			while (ee != 0) {
				epo.push(ee); ee = this.eplists.delete(ee, ee);
			}
			scramble(epi); scramble(epo);
			let first = (epi.length > 1 ? epi[1] : epo[1]);
			for (let i = 2; i < epi.length; i++)
				this.eplists.join(first, epi[i]);
			for (let i = (epi.length > 1 ? 1 : 2); i < epo.length; i++)
				this.eplists.join(first, epo[i]);
			this._firstEp[u] = first;
		}
		return [vp,ep]
	}
	
	/** Construct a string in dot file format representation 
	 *  of the Digraph object.
	 *  For small graphs (at most 26 vertices), vertices are
	 *  represented in the string as lower case letters.
	 *  For larger graphs, vertices are represented by integers.
	 *  @param s is a string object provided by the caller which
	 *  is modified to provide a representation of the Digraph.
	 *  @return a reference to the string
	 */
	toDotString() {
		// undirected graph
		let s = "digraph G {\n";
		for (let e = first(); e != 0; e = next(e)) {
			let u = this.tail(e); let v = this.head(e);
			s += this.index2string(u) + " --> ";
			s += this.index2string(v) + " ; ";
			s += " [label = \" " + this.weight(e) + " \"] ; ";
			if (s.length() > 65) s += "\n";
		}
		s += " }\n";
		return s;
	}
}
