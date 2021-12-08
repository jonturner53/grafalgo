/** @file Graph.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs'
import { randomInteger, scramble, randomPermutation, shuffle }
	from '../../common/Random.mjs';
import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListPair from '../basic/ListPair.mjs';
import ListSet from '../basic/ListSet.mjs';
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
export default class Graph extends Top {
	_firstEp;	///< _firstEp[v] is first edge endpoint at v
	_left;		///< _left[e] is left endpoint of edge e
	_right;		///< _right[e] is right endpoint of edge e
	#weight;	///< #weight[e] is weight of edge e, initially unused
	_edges;		///< sets of in-use and free edges
	_epLists;	///< lists of the edge endpoints at each vertex
	_nabors;	///< temporary list of neighbors used by fromString

	/** Construct Graph with space for a specified # of vertices and edges.
	 *  @param n is the number of vertices in the graph
	 *  @param ecap is the initial edge capacity (defaults to n)
	 *  @param vcap is the initial vertex capacity (defaults to n);
	 *  this argument is intended for internal use of Graph class
	 */
	constructor(n, ecap, vcap) {
		super(n);
		if (!ecap) ecap = this.n;
		if (!vcap) vcap = this.n;
		this.#init(vcap, ecap);
	}

	#init(vcap, ecap) {
		assert(this.n > 0 && vcap >= this.n && ecap > 0);
		this._firstEp = new Array(vcap+1).fill(0, 0, this.n+1);
		this._left = new Array(ecap+1); this._right = new Array(ecap+1);
		this._edges = new ListPair(ecap);
		this._epLists = new ListSet(2*(ecap+1));
		if (this.#weight) this.addWeights();
	}

	addWeights() {
		this.#weight = new Array(this._ecap+1);
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
		assert(g instanceof Graph);
		if (g == this) return;
		if (g.n > this._vcap || g.m > this._ecap) {
			this.reset(g.n, g.m);
		} else {
			this.clear(); this._n = g.n;
		}
		if (g.#weight && !this.#weight) this.addWeights();
		if (!g.#weight && this.#weight) this.#weight = null;
		for (let e = g.first(); e != 0; e = g.next(e)) {
			let ee = this.join(g.left(e), g.right(e));
			if (g.#weight) {
				this.#weight[ee] = g.weight(e);
			}
		}
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph that is to replace this one.
	 */
	xfer(g) {
		assert(g instanceof Graph);
		if (g == this) return;
		this._n = g.n;
		this._firstEp = g._firstEp;
		this._left = g._left; this._right = g._right;
		this.#weight = g.#weight;
		this._edges = g._edges; this._epLists = g._epLists;
		g._firstEp = g._left = g._right = null;
		g._edges = null; g._epLists = null;
	}

	get M() {
		let M = 0;
		for (let e = this.first(); e != 0; e = this.next(e))
			M = Math.max(e, M);
		return M;
	}

	/** Remove all the edges from a graph.  */
	clear() {
		let e = this.first();
		while (e != 0) { this.delete(e); e = this.first(); }
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
	validEdge(e) { return e >= 0 && e == Math.floor(e) && this._edges.isIn(e); }
	
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
		assert(u != v && u > 0 && v > 0 &&
			   (e > 0 || this._edges.firstOut() == 0) &&
			   !this._edges.isIn(e));
		if (u > this.n || v > this.n || this._edges.nOut() == 0) {
			this.expand(Math.max(this.n, Math.max(u, v)),
						Math.max(e, this._edges.n+1));
			if (e == 0) e = this._edges.firstOut();
		}
		this._edges.swap(e);

		// initialize edge information
		this._left[e] = u; this._right[e] = v;
		if (this.#weight) this.#weight[e] = 0;
	
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
		else if (!this.#weight) return 0;
		// now use weights to break ties
		     if (this.weight(e1) < this.weight(e2)) return -1;
		else if (this.weight(e1) > this.weight(e2)) return 1;
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
	
		// now rebuild endpoint list at u
		for (let j = 1; j < epl.length; j++) {
			this._epLists.join(epl[0], epl[j]);
		}
		this._firstEp[u] = epl[0];
	}
	
	/** Sort adjacency lists for all vertices by "other endpoinnt". */
	sortAllEplists() {
		for (let u = 1; u <= this.n; u++) this.sortEplist(u);
	}

	/** Compute a sorted list of edge numbers.
	 *  @param evec is an optional array of edge numbers; if present,
	 *  the edges in the list are sorted; if omitted, all edges in the
	 *  graph are sorted
	 *  @return a sorted array of edge numbers, where edges {u,v} are sorted
	 *  first by the smaller endpoint, then by the larger endpoint; if weights
	 *  are present, they are used to break ties.
	 */
	sortedElist(evec=null) {
		// first create vector of edge information
		// [smaller endpoint, larger endpoint, weight, edge number]
		if (evec) {
			for (let i = 0; i < evec.length; i++) {
				let e = evec[i];
				if (this.left(e) < this.right(e)) {
					evec[i] = [this.left(e), this.right(e),
								this.#weight ? this.weight(e) : 0, e];
				} else {
					evec[i] = [this.right(e), this.left(e),
								this.#weight ? this.weight(e) : 0, e];
				}
			}
		} else {
			let i = 0; let evec = new Array(this.m);
			for (let e = this.first(); e != 0; e = this.next(e)) {
				if (this.left(e) < this.right(e)) {
					evec[i] = [this.left(e), this.right(e),
								this.#weight ? this.weight(e) : 0, e];
				} else {
					evec[i] = [this.right(e), this.left(e),
								this.#weight ? this.weight(e) : 0, e];
				}
				i++;
			}
		}
		evec.sort((t1, t2) => (t1[0] < t2[0] ? -1 : (t1[0] > t2[0] ? 1 :
							  	(t1[1] < t2[1] ? -1 : (t1[1] > t2[1] ? 1 :
								  (t1[2] < t2[2] ? -1 : (t1[2] > t2[2] ? 1 : 0
				  )))))));
		for (let i = 0; i < evec.length; i++) evec[i] = evec[i][3];
		return evec;
	}
	
	/** Find an edge joining two vertices.
	 *  @param u is a vertex number
	 *  @param v is a vertex number
	 *  @param edges is an array of edges in sorted order (as returned by
	 *  sortedElist()).
	 *  @return the number of some edge joining u and v, or 0 if there
	 *  is no such edge
	 */
	findEdge(u, v, edges) {
		assert(this.validVertex(u) && this.validVertex(v));
		if (!edges) {
			for (let e = this.firstAt(u); e != 0; e = this.nextAt(u, e))
				if (v == this.mate(u, e)) return e;
			return 0;
		}
		// do binary search in edges
		let lo = 0; let hi = edges.length-1;
		if (u > v) [u, v] = [v, u];
		while (lo < hi) {
			let mid = Math.floor((lo + hi) / 2);
			let e = edges[mid];
			let m = this.left(e); let M = this.right(e);
			if (m > M) [m, M] = [M, m];
				 if (u < m || (u == m && v < M)) hi = mid-1;
			else if (u > m || (u == m && v > M)) lo = mid+1;
			else return e;
		}
		return 0;
	}

	/** Get the weight of an edge.
	 *  @param e is an edge
	 *  @return the weight of e
	 */
	weight(e) {
		assert(this.validEdge(e));
		return this.#weight && this.#weight[e] ? this.#weight[e] : 0;
	}

	/** Set the weight of an edge.
	 *  @param e is an edge
	 *  @param w is a weight to be assigned to e
	 */
	setWeight(e, w) {
		assert(this.validEdge(e));
		if (!this.#weight) this.addWeights();
		this.#weight[e] = w;
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
		if (typeof g == 'string') {
			let s = g; g = new Graph(this.n, this.m); g.fromString(s); 
		}
        if (!(g instanceof Graph)) return false;
		if (g.n != this.n || g.m != this.m) return false;

		// now compare the edges using sorted edge lists
		let el1 = this.sortedElist(); let el2 = g.sortedElist();
		for (let i = 0; i < el1.length; i++) {
			let m1 = Math.min(this.left(el1[i]), this.right(el1[i]));
			let M1 = Math.max(this.left(el1[i]), this.right(el1[i]));
			let m2 = Math.min(g.left(el2[i]), g.right(el2[i]));
			let M2 = Math.max(g.left(el2[i]), g.right(el2[i]));
			if (m1 != m2 || M1 != M2 || this.weight(el1[i]) != g.weight(el2[i]))
				return false;
		}
		return true;
	}
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @param u is one of the endponts of e;
	 *  @label is an optional function used to label the vertices
	 *  it will appear first in the string
	 *  @return a string representing the edge
	 */
	edge2string(e, label) {
		return '{' + this.index2string(this.left(e), label) + ','  +
					 this.index2string(this.right(e), label) +
					 (this.#weight ? ',' + this.weight(e) : '') + '}';
	}
	
	/** Create a string representation of an edge list.
	 *  @param elist is an array of edge numbers (possibly with some
	 *  @label is an optional function used to label the vertices
	 *  invalid values mixed in; these are ignored)
	 *  @return the string
	 */
	elist2string(elist, label) {
		let s = '';
		for (let e of elist) {
			if (!this.validEdge(e)) continue;
			if (s.length > 0) s += ' ';
			s += this.edge2string(e, label);
		}
		return '[' + s + ']';
	}
	
	/** Create a string representation of a vertex list.
	 *  @param vlist is an array of edge numbers (possibly with some
	 *  @label is an optional function used to label the vertices
	 *  invalid values mixed in; these are ignored)
	 *  @return the string
	 */
	vlist2string(vlist, label) {
		let s = '';
		for (let u of vlist) {
			if (s.length > 0) s += ' ';
			s += this.index2string(e, label);
		}
		return '[' + s + ']';
	}

	/** Create a string representation of an adjacency list.
	 *  @param u is a vertex number
	 *  @return a string representing the list
	 */
	alist2string(u, details=0, label=0) {
		let s = '';
		for (let e = this.firstAt(u); e != 0; e = this.nextAt(u, e)) {
			let ns = this.nabor2string(u, e, details, label);
			if (s.length > 0 && ns.length > 0) s += ' ';
			s += ns;
		}
		return this.index2string(u, label) + '[' + s + ']';
	}

	/** Create a string representation for a neighbor of a given vertex.
	 *  @param u is a vertex
	 *  @param e is an edge incident to u
	 *  @showEdgeNum specifies that the edge number should be included
	 *  in the string
	 *  @return a string that represents the neighbor of u, suitable for
	 *  use in an adjacency list string.
	 */
	nabor2string(u, e, details=0, label=0) {
		return this.index2string(this.mate(u, e), label) +
				 (this.#weight ? ':' + this.weight(e) : '');
	}
	
	/** Construct a string representation of the Graph object.
	 *  For small graphs (at most 26 vertices), vertices are
	 *  represented in the string as lower case letters.
	 *  For larger graphs, vertices are represented by integers.
	 *  @return a reference to the string
	 */
	toString(details=0, pretty=0, label=0) {
		let s = '';
		for (let u = 1; u <= this.n; u++) {
			s += this.alist2string(u, details, label);
			s += (pretty ? '\n' : (u < this.n ? ' ' : ''));
		}
		return (pretty ? '{\n' : '{')  + s + (pretty ? '}\n' : '}');
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
		let u = this.nextVertex(sc);
		if (u == 0) { sc.reset(cursor); return false; }
		if (u > this.n) this.expand(u, this.m);
		// initialize _nabors to include edges added previously
		this._nabors.clear();
		for (let e = this.firstAt(u); e != 0; e = this.nextAt(u, e))
			this._nabors.enq(this.mate(u, e), e);
		if (!sc.verify('[')) { sc.reset(cursor); return false; }
		while (!sc.verify(']')) {
			if (this.nextNabor(u, sc) == 0) {
				sc.reset(cursor); return false;
			}
		}
		return true;
	}

	/** Get the next vertex (from the start of an alist) from a scanner.
	 *  @param sc is a scanner for a string representation of a flow graph
	 *  @return the vertex that is assumed to be the next thing in the
	 *  scanner string, or 0 if not successful.
	 */
	nextVertex(sc) { return sc.nextIndex(); }

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
		if (v == u) return 0;
		let e = 0; let newEdge = false;
		if (this._nabors.contains(v)) {
			e = this._nabors.value(v);
		} else {
			e = this.join(u, v); newEdge = true;
		}
		if (sc.verify(':')) { // read weight
			let w = sc.nextNumber();
			if (isNaN(w)) return 0;
			if (!newEdge && w != this.weight(e)) return 0;
			this.setWeight(e, w);
		}
		if (newEdge) this._nabors.enq(v, e);
		return e;
	}

	/** Initialize graph from a string representation.
	 *  @param in is an open input stream
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		if (!this._nabors) // create temporary list of neighbors
			this._nabors = new List(20);
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

	/** Return a random edge.
	 *  Likely to be slow if _ecap >> m.
	 *  If sampling many edges, just copy out edges to an array
	 *  and sample the n array
	 */
	randomEdge() {
		let edges = this._edges;
		if (edges.nIn == 0) return 0;
		if (edges.nIn() < this._ecap / 20) {
			let i = randomInteger(1, edges.nIn);
			for (let e = edges.firstIn(); e != 0; e = edges.nextIn(e)) 
				if (--i == 0) return e;
			return 0; // should never get here
		}
		let e = randomInteger(1, this._ecap);
		while (edges.isOut(e)) {
			// avg number of tries should never exeed 20
			// if used to sample from "almost full" graph, then fast
			e = randomInteger(1, this._ecap);
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
			if (this._firstEp[u] == 0) continue;
			let epl = [0]; let ee = this._firstEp[u];
			while (ee != 0) {
				epl.push(ee); ee = this.epLists.delete(ee, ee);
			}
			scramble(epl);
			for (let i = 2; i < epl.length; i++)
				this.epLists.join(epl[1], epl[i]);
			this._firstEp[u] = epl[1];
		}
		if (this.#weight) shuffle(this.#weight, ep);
		return [vp, ep];
	}

	/** Shuffle the vertices and edges according to the given permutations.
	 *  @param g is a graph object to be shuffled
	 *  @param vp is a permutation on the vertices, mapping vertex u to vp[u-1]
	 *  @param ep is a permutation on the edge numbers (including unused ones)
	 *  mapping edge e to ep[e-1]
	 */
	_shuffle(vp, ep) {
		let left = new Array(this._ecap).fill(0);
		let right = new Array(this._ecap);
		for (let e = this.first(); e != 0; e = this.next(e)) {
			left[ep[e]] = this.left(e); right[ep[e]] = this.right(e);
		}
		this.clear();
		for (let e = 0; e < left.length; e++) {
			if (left[e] != 0)
				this.join(vp[left[e]], vp[right[e]], ep[e]);
		}
	}

	/** Compute random weights for all the edges.
	 *  @param f is a random number generator used to generate the
	 *  random edge weights; it is invoked using any extra arguments
	 *  provided by caller; for example randomWeights(randomInteger, 1, 10)
     *  will assign random integer weights in 1..10.
	 */
	randomWeights(f) {
		if (!this.#weight) this.addWeights();
		let args= ([].slice.call(arguments)).slice(1);
        for (let e = this.first(); e != 0; e = this.next(e)) {
			let w = f(...args); this.setWeight(e, w);
		}
	}
}
