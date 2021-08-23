/** @file Graph.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Adt from '../Adt.mjs';
import { assert } from '../../Errors.mjs'
import List from '../basic/List.mjs';
import ListPair from '../basic/ListPair.mjs';
import Dlists from '../basic/Dlists.mjs';
import Scanner from '../basic/Scanner.mjs';

/** Data structure for undirected graph.
 *
 *  Graph size (number of vertices and max number of edges) must
 *  be specified when a Graph object is instantiated.
 *  Edges can be added and deleted from the graph.
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
export default class Graph extends Adt {
	_firstEp;	///< _firstEp[v] is first edge endpoint at v
	_left;		///< _left[e] is left endpoint of edge e
	_right;		///< _right[e] is right endpoint of edge e
	_edges;		///< sets of in-use and free edges
	_epLists;	///< lists of the edge endpoints at each vertex

	/** Construct Graph with space for a specified # of vertices and edges.
	 *  @param n is the number of vertices in the graph
	 *  @param ecap is the initial edge capacity (defaults to n)
	 *  @param vcap is the initial vertex capacity (defaults to n);
	 *  this argument is intended for internal use of Graph class
	 */
	constructor(n=5, ecap=n, vcap=n) {
		super(n); this.#init(vcap, ecap);
	}

	#init(vcap, ecap) {
		assert(this.n > 0 && vcap >= this.n && ecap > 0);
		this._firstEp = new Array(vcap+1).fill(0, 0, this.n+1);
		this._left = new Array(ecap+1); this._right = new Array(ecap+1);
		this._edges = new ListPair(ecap);
		this._epLists = new Dlists(2*(ecap+1));
	}

	reset(n, ecap=n, vcap=n) {
		assert(n > 0 && vcap >= n && ecap > 0);
		this._n = n; this.#init(vcap, ecap);
	}

	get _vcap() { return this._firstEp.length-1; }
	get _ecap() { return this._left.length-1; }

	expand(n, m) {
		if (n <= this.n && m <= this.m) return;
		if (n > this._vcap || m > this._ecap) {
			let vcap = (n <= this._vcap ? this._vcap :
							 Math.max(n, Math.floor(1.25*this._vcap)));
			let ecap = (m <= this._ecap ? this._ecap:
							 Math.max(m, Math.floor(1.25*this._ecap)));
			let nu = new Graph(this.n, ecap, vcap);
			nu.assign(this); this.xfer(nu);
		}
		this._firstEp.fill(0, this.n+1, n+1);
		this._n = n;
	}

	/** Assign one graph to another.
	 *  @param g is another graph that is to replace this one.
	 */
	assign(g) {
		if (g == this) return;
		if (g.n > this._vcap || g.m > this._ecap) {
			this.reset(g.n, g.m);
		} else {
			this.clear(); this._n = g.n;
		}
		for (let e = g.first(); e != 0; e = g.next(e)) {
			let ee = this.join(g.left(e), g.right(e));
		}
		this.sortAllEplists();
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph that is to replace this one.
	 */
	xfer(g) {
		this._firstEp = g._firstEp;
		this._left = g._left; this._right = g._right;
		this._edges = g._edges; this._epLists = g._epLists;
		g._firstEp = g._left = g._right = null;
		g._edges = null; g._epLists = null;
	}

	/** Compare another graph to this one.
	 *  @param g is a Graph object or a string representation of a Graph
	 *  @return true if g is equal to this; when g is a string, the string
	 *  representation of this graph is compared to g; otherwise, the
	 *  vertices and edges are compared; note: the adjacency lists may
	 *  be sorted as a side-effect
	 */
	equals(g) {
		if (g == this) return true;
		if (typeof g == 'string') return this.toString() == g;
        if (!(g instanceof Graph)) return false;

		if (g.n != this.n || g.m != this.m) return false;
		this.sortAllEplists(); g.sortAllEplists();
		for (let u = 1; u <= this.n; u++) {
			let e = this.firstAt(u); let eg = g.firstAt(u);
			while (e != 0 && eg != 0) {
				if (this.mate(u, e) != g.mate(u, eg))
					return false;
				e = this.nextAt(u, e); eg = g.nextAt(u, eg);
			}
			if (e != eg) return false;
		}
		return true;
	}

	/** Remove all the edges from a graph.  */
	clear() {
		this._epLists.clear(); this._edges.clear();
		for (let u = 1; u <= this.n; u++) this._firstEp[u] = 0;
	}

	/** Get the number of edges.
	 *  @return the number of edges in the graph.
	 */
	get m() { return this._edges.nIn(); }
	
	validVertex(u) { return u == Math.floor(u) && 1 <= u && u <= this.n; }

	/** Determine if an edge number corresponds to a valid edge.
	 *  @param e is the edge number to be verified
	 *  @return true if e is a valid edge number, else false.
	 */
	validEdge(e) { return e == Math.floor(e) && this._edges.isIn(e); }
	
	/** Get the first edge in the overall list of edges.
	 *  @return the first edge in the list
	 */
	first() { return this._edges.firstIn(); }
	
	/** Get the next edge in the overall list of edges.
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the list, or 0 if e is not in the list
	 *  or it has no successor
	 */
	next(e) { return this._edges.nextIn(e); }
	
	/** Get the first edge incident to a vertex.
	 *  @param v is the vertex of interest
	 *  @return the first edge incident to v
	 */
	firstAt(v) { 
		assert(this.validVertex(v));
		return Math.trunc(this._firstEp[v]/2);
	}
	
	/** Get the next edge in the adjacency list for a specific vertex.
	 *  @param v is the vertex whose adjacency list we're accessing
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the adjacency list for v
	 *  or 0 if e is not incident to v or is the last edge on the list
	 */
	nextAt(v, e) {
		assert(this.validVertex(v) && this.validEdge(e));
		if (v != this._left[e] && v != this._right[e]) return 0;
		let ep = (v == this._left[e] ? 2*e : 2*e+1);
		return Math.trunc(this._epLists.next(ep)/2);
	}
	
	/** Get the left endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the left endpoint of e, or 0 if e is not a valid edge.
	 */
	left(e) {
		assert(e == 0 || this.validEdge(e));
		return this._left[e];
	}
	
	/** Get the right endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the right endpoint of e, or 0 if e is not a valid edge.
	 */
	right(e) {
		assert(e == 0 || this.validEdge(e));
		return this._right[e];
	}
	
	/** Get the other endpoint of an edge.
	 *  @param v is a vertex
	 *  @param e is an edge incident to v
	 *  @return the other vertex incident to e
	 */
	mate(v, e) {
		assert(this.validVertex(v) && this.validEdge(e) &&
			   (v == this._left[e] || v == this._right[e]));
		return v == this._left[e] ? this._right[e] : this._left[e];
	}

	/** Join two vertices.
	 *  @param u is the left endpoint for the new edge
	 *  @param v is the right endpoint for the new edge
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
		this._firstEp[u] = this._epLists.join(this._firstEp[u], 2*e);
		this._firstEp[v] = this._epLists.join(this._firstEp[v], 2*e+1);
	
		return e;
	}
	
	/** Delete an edge from the graph.
	 *  @param e is the edge to be deleted.
	 *  @return true on success, false on failure
	 */
	delete(e) {
		assert(this.validEdge(e));
		this._edges.swap(e);
		let u = this._left[e]; let v = this._right[e];
		this._firstEp[u] = this._epLists.delete(2*e,   this._firstEp[u]);
		this._firstEp[v] = this._epLists.delete(2*e+1, this._firstEp[v]);
		return true;
	}
	
	// Compare two edges incident to the same endpoint u.
	// Return -1 if u's mate in e1 is less than u's mate in e2.
	// Return +1 if u's mate in e1 is greater than than u's mate in e2.
	// Return  0 if u's mate in e1 is equal to its mate in e2.
	ecmp(e1, e2, u) {
		assert(this.validVertex(u) &&
					   this.validEdge(e1) && this.validEdge(e2));
		if (this.mate(u, e1) < this.mate(u, e2)) return -1;
		else if (this.mate(u, e1) > this.mate(u, e2)) return 1;
		else return 0;
	}
	
	/** Sort an endpoint list for a specified vertex using ecmp().
	 *  @param u is the vertex whose adjacency list is to be sorted.
	 */
	sortEplist(u) {
		assert(u != 0 && this.validVertex(u));
		if (this._firstEp[u] == 0) return; // empty list

		// if already sorted, skip sorting step
		for (let e = this.firstAt(u); e != 0; e = this.nextAt(u, e)) {
			if (this.nextAt(u, e) == 0) return; // already sorted
			if (this.ecmp(e, this.nextAt(u,e), u) > 0) 
				break; // edge out of order
		}

		// copy endpoints in endpoint list for u into an array
		// and remove them from endpoint list
		let epl = [];
		for (let first = this._firstEp[u]; first!=0; first = this._firstEp[u]) {
			epl.push(first);
			this._firstEp[u] = this._epLists.delete(first, first);
		}

		epl.sort((e1, e2) => this.ecmp(Math.trunc(e1/2), Math.trunc(e2/2), u));
	
		// now rebuild links forming adjacency list for u
		for (let j = 1; j < epl.length; j++) {
			this._epLists.join(epl[0], epl[j]);
		}
		this._firstEp[u] = epl[0];
	}
	
	/** Sort adjacency lists for all vertices by "other endpoinnt". */
	sortAllEplists() {
		for (let u = 1; u <= this.n; u++) this.sortEplist(u);
	}
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @param u is one of the endponts of e;
	 *  it will appear first in the string
	 *  @return a string representing the edge
	 */
	edge2string(e, u=this.left(e)) {
		let v = this.mate(u, e);
		return "{" + this.index2string(u) + ","  + this.index2string(v) + "}";
	}
	
	/** Create a string representation of an edge list.
	 *  @param elist is a list of edge numbers
	 *  @return the string
	 */
	elist2string(elist) {
		let s = '';
		for (let e of elist) {
			if (s.length > 0) s += ' ';
			s += this.edge2string(e);
		}
		return '[' + s + ']';
	}

	/** Create a string representation of an adjacency list.
	 *  @param u is a vertex number
	 *  @return a string representing the list
	 */
	alist2string(u, showEdgeNum=false) {
		let s = '';
		for (let e = this.firstAt(u); e != 0; e = this.nextAt(u, e)) {
			let ns = this.nabor2string(u, e, showEdgeNum);
			if (ns == null) continue;
			if (s.length > 0) s += ' ';
			s += ns;
		}
		return this.index2string(u) + '[' + s + ']';
	}

	/** Create a string representation for a neighbor of a given vertex.
	 *  @param u is a vertex
	 *  @param e is an edge incident to u
	 *  @showEdgeNum specifies that the edge number should be included
	 *  in the string
	 *  @return a string that represents the neighbor of u, suitable for
	 *  use in an adjacency list string.
	 */
	nabor2string(u, e, showEdgeNum=false) {
		return this.index2string(this.mate(u, e)) + (showEdgeNum ? '.'+e : '');
	}
	
	/** Construct a string representation of the Graph object.
	 *  For small graphs (at most 26 vertices), vertices are
	 *  represented in the string as lower case letters.
	 *  For larger graphs, vertices are represented by integers.
	 *  @return a reference to the string
	 */
	toString(addNewlines=false, showEdgeNum=false) {
		let s = '';
		for (let u = 1; u <= this.n; u++) {
			s += this.alist2string(u, showEdgeNum);
			s += (addNewlines ? '\n' : (u < this.n ? ' ' : ''));
		}
		return (addNewlines ? '{\n' : '{')  + s + (addNewlines ? '}\n' : '}');
	}
	
	/** Construct a string in dot file format representation 
	 *  of the Graph object.
	 *  For small graphs (at most 26 vertices), vertices are
	 *  represented in the string as lower case letters.
	 *  For larger graphs, vertices are represented by integers.
	 *  @param s is a string object provided by the caller which
	 *  is modified to provide a representation of the Graph.
	 *  @return a reference to the string
	 */
	toDotString() {
		// undirected graph
		let s = "graph G {\n";
		let cnt = 0;
		for (let e = this.first(); e != 0; e = this.next(e)) {
			let u = Math.min(left(e),right(e));
			let v = Math.max(left(e),right(e));
			s += this.index2string(u) + " -- ";
			s += this.index2string(v) + " ; ";
			if (++cnt == 15) { cnt = 0; s += "\n"; }
		}
		s += " }\n";
		return s;
	}
		
	/** Read one edge from a scanner and add it to the graph.
	 *  Since for undirected graphs, edges appear on both adjacency lists,
	 *  ignore an edge if its second vertex is larger than the first.
	 *  @param sc is a Scanner object.
	 *  @return true on success, false on error.
	 */
	nextEdge(sc) {
		let cursor = sc.cursor;
		let u = 0; let v = 0;
		if (!sc.verify('(') || (u = sc.nextIndex()) == 0 ||
			!sc.verify(',') || (v = sc.nextIndex()) == 0 ||
			!sc.verify(')')) {
			sc.reset(cursor); return false;
		}
		if (u < v) join(u, v);
		return true;
	}
		
	/** Read adjacency list from an input stream, add it to the graph.
	 *  @param in is an open input stream
	 *  @return true on success, false on error.
	 */
	nextAlist(sc) {
		let cursor = sc.cursor;
		let u = sc.nextIndex();
		if (u == 0) { sc.reset(cursor); return false; }
		if (u > this.n) this.expand(u, this.m);
		if (!sc.verify('[')) { sc.reset(cursor); return false; }
		while (!sc.verify(']')) {
			let nn = this.nextNabor(u, sc);
			if (nn == 0) {
				sc.reset(cursor); return false;
			}
		}
		return true;
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
			if (u < v) e = this.join(u, v);
			else e = this.findEdge(u,v);
		} else {
			e = sc.nextInt();
			if (isNaN(e)) return 0;
			if (e >= this.m) this.expand(this.n, e);
			if (u < v) {
				if (this.join(u, v, e) != e) return 0;
			} else { // endpoints already joined, just verify
				if ((u == this.left(e)  && v != this.right(e)) ||
					(u == this.right(e) && v != this.left(e)))
					return 0;
			}
		}
		return e;
	}

	/** Initialize graph from a string representation.
	 *  @param in is an open input stream
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		if (!sc.verify('{')) return false;
		while (this.nextAlist(sc)) {
			if (sc.verify('}')) {
				this.sortAllEplists(); return true;
			}
		}
		this.clear(); sc.reset();
		return false;
	}
	
	/** Find an edge joining two vertices.
	 *  @param u is a vertex number
	 *  @param v is a vertex number
	 *  @return the number of some edge joining u and v, or 0 if there
	 *  is no such edge
	 */
	findEdge(u, v) {
		assert(this.validVertex(u) && this.validVertex(v));
		for (let e = this.firstAt(u); e != 0; e = this.nextAt(u,e))
			if (this.mate(u,e) == v) return e;
		return 0;
	}

	/** Compute the degree of a vertex.
	 *  @param u is a vertex
	 *  @return the number of edges incident to u
	 */
	degree(u) {
		assert(this.validVertex(u));
		let d = 0;
		for (let e = this.firstAt(u); e != 0; e = this.nextAt(u,e)) d++;
		return d;
	}
	
	/** Compute the maximum degree.
	 *  @return the maximum degree of any vertex.
	 */
	maxDegree() {
		let d = 0;
		for (let u = 1; u <= this.n; u++) d = Math.max(d, this.degree(u));
		return d;
	}
	
	/** Get the components of a graph.
	 *  @return a component vector, that assigns a "component number" to each
	 *  vertex; that is, vertices in the same component have the same
	 *  component number
	 */
	getComponents() {
		let component = new Array(this.n+1).fill(0);
		
		let q = new List(this.n);
		let curComp = 0;
		let s = 1;
		while (s <= this.n) {
			// do a breadth-first search from s, labeling all
			// vertices found with the current component number
			component[s] = ++curComp; q.enq(s);
			while (!q.empty()) {
				let u = q.deq();
				for (let e = this.firstAt(u); e != 0; e = this.nextAt(u,e)) {
					let v = this.mate(u,e);
					if (component[v] == 0) {
						component[v] = curComp; q.enq(v);
					}
				}
			}
			// scan ahead to next int that has not yet been
			// placed in some component
			while (s <= this.n && component[s] != 0) s++;
		}
		return component;
	}
}
