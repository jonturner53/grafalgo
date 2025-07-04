/** @file Graph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { randomInteger, scramble, randomPermutation, shuffle }
	from '../../common/Random.mjs';
import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListPair from '../basic/ListPair.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

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
	firstEp;	// firstEp[v] is first edge endpoint at v
	edges;		// sets of in-use and free edges
	epLists;	// lists of the edge endpoints at each vertex
	io;			// optional ListPair defining bipartition
	nabors;     // temporary list of neighbors used by fromString

	Left;		// Left[e] is left endpoint of edge e
	Right;		// Right[e] is right endpoint of edge e
	Weight;     // Weight[e] is optional weight of edge e, initially unused

	/** Construct Graph with space for a specified # of vertices and edges.
	 *  @param n is the number of vertices in the graph
	 *  @param erange is the initial range for edge values (defaults to n)
	 */
	constructor(n=10, erange=n) {
		ea && assert(n > 0 && erange > 0);
		super(n);
		this.firstEp = new Int32Array(this.n+1);
		this.Left = new Int32Array(erange+1);
		this.Right = new Int32Array(erange+1);
		this.edges = new ListPair(erange);
		this.epLists = new ListSet(2*(erange+1));
		this.Weight = null;
	}

	get edgeRange() { return this.Left.length-1; }

	/** Determine if this object includes edge weights . */
	get hasWeights() { return (this.Weight != null ? true : false); }
	get hasLengths() { return this.hasWeights; }
	get hasCosts()   { return this.hasWeights; }
	get hasBounds()  { return this.hasWeights; }

	/** Turn edge weights on or off.
	 *  @param on is a boolean used to enable or disable edge weights
	 */
	set hasWeights(on) {
		if (on && !this.Weight) {
			this.Weight = new Float32Array(this.edgeRange+1);
		} else if (!on && this.Weight) {
			this.Weight = null;
		}
	}
	set hasLengths(on) { this.hasWeights = on; }
	set hasCosts(on)   { this.hasWeights = on; }
	set hasBounds(on)  { this.hasWeights = on; }

	/** Expand the vertex range and/or edge range of this object.
	 *  @param n is the desired new vertex range
	 *  @param erange is the desired new edge range
	 */
	expand(n, erange) {
		ea && assert(n > this.n || erange > this.edgeRange);
		let nu = new this.constructor(n, erange);
		nu.assign(this,true); this.xfer(nu);
	}

	/** Assign one graph to another.
	 *  @param that is another graph that is to replace this one.
	 */
	assign(that, relaxed=false) {
		ea && assert(that != this &&
				this.constructor.name == that.constructor.name);
		if ((this.n == that.n || relaxed && this.n > that.n) &&
			this.edgeRange >= that.m)
			this.clear();
		else
			this.reset(that.n, that.m);

		if ( that.hasWeights && !this.hasWeights) this.hasWeights = true;
		if (!that.hasWeights &&  this.hasWeights) this.hasWeights = false;
		if (that.io) {
			this.io = new ListPair(this.n); this.io.assign(that.io);
		}
		for (let e = that.first(); e; e = that.next(e)) {
			let ee = this.edges.in(e,2) ?
						this.join(that.left(e), that.right(e), e) :
						this.join(that.left(e), that.right(e));
				// preserve edge numbers when possible; consider dropping that
			if (that.hasWeights) {
				this.Weight[ee] = that.weight(e);
			}
		}
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param that is another graph that is to replace this one.
	 */
	xfer(that) {
		super.xfer(that);
		this.firstEp = that.firstEp;
		this.Left = that.Left; this.Right = that.Right;
		this.Weight = that.Weight;
		this.edges = that.edges; this.epLists = that.epLists;
		this.io = that.io;
		that.firstEp = that.Left = that.Right = that.Weight = null;
		that.edges = that.epLists = that.io = null;
	}

	/** Remove all the edges from a graph.  */
	clear() {
		let e = this.first();
		while (e != 0) { this.delete(e); e = this.first(); }
	}

	/** Get the number of edges.
	 *  @return the number of edges in the graph.
	 */
	get m() { return this.edges.length(1); }

	validVertex(u) { return 1 <= u && u <= this.n; }

	/** Determine if an edge number corresponds to a valid edge.
	 *  @param e is the edge number to be verified
	 *  @return true if e is a valid edge number, else false.
	 */
	validEdge(e) { return this.edges.in(e,1); }
	
	/** Get the left endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the left endpoint of e, or 0 if e is not a valid edge.
	 */
	left(e) {
		ea && assert(this.validEdge(e),
					 `Graph.left: invalid edge number: ${e}`);
		return this.Left[e];
	}
	
	/** Get the right endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the right endpoint of e, or 0 if e is not a valid edge.
	 */
	right(e) {
		ea && assert(this.validEdge(e),
					 `Graph.right: invalid edge number: ${e}`);
		return this.Right[e];
	}

	/** Get/set the weight of an edge.
	 *  @param e is an edge
	 *  @param w is an optional weight to be assigned to e
	 *  @return the weight of e
	 */
	weight(e, w=null) {
		if (w != null) {
			if (!this.hasWeights) this.hasWeights = true;
			this.Weight[e] = w;
		}
		return this.hasWeights ? this.Weight[e] : 0;
	}
	length(e,l) { return this.weight(e,l); }
	cost(e,c) { return this.weight(e,c); }
	bound(e,c) { return this.weight(e,c); }
	
	/** Get the other endpoint of an edge.
	 *  @param v is a vertex
	 *  @param e is an edge incident to v
	 *  @return the other vertex incident to e
	 */
	mate(v, e) {
		ea && assert(this.validVertex(v) && this.validEdge(e) &&
			   (v == this.left(e) || v == this.right(e)));
		return v == this.left(e) ? this.right(e) : this.left(e);
	}
	
	/** Get the first edge in the overall list of edges.
	 *  @return the first edge in the list
	 */
	first() { return this.edges.first(1); }
	
	/** Get the next edge in the overall list of edges.
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the list, or 0 if e is not in the list
	 *  or it has no successor
	 */
	next(e) { return this.edges.next(e); }
	
	/** Get the first edge incident to a vertex.
	 *  @param v is the vertex of interest
	 *  @return the first edge incident to v
	 */
	firstAt(v) { 
		ea && assert(this.validVertex(v));
		return Math.trunc(this.firstEp[v]/2);
	}
	
	/** Get the next edge in the adjacency list for a specific vertex.
	 *  @param v is the vertex whose adjacency list we're accessing
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the adjacency list for v
	 *  or 0 if e is not incident to v or is the last edge on the list
	 */
	nextAt(v, e) {
		ea && assert(this.validVertex(v) && this.validEdge(e));
		if (v != this.left(e) && v != this.right(e)) return 0;
		let ep = (v == this.left(e) ? 2*e : 2*e+1);
		return Math.trunc(this.epLists.next(ep)/2);
	}

	/** Get a reference to the bipartition for this graph.
	 *  @return a reference to the internal ListPair that defines a
	 *  bipartition on the vertices; list1 identifies the inputs,
	 *  list2 identifies the outputs; return null if no bipartition
	 *  has been defined
	 */
	getBipartition() { return this.io ? this.io : null; }
	get hasBipartition() { return this.io ? true : false; }

	/** Define a bipartition on the graph.
	 *  @param io is a ListPair that divides the vertices into
	 *  "inputs" and "outputs" and defines a bipartition; alternatively,
	 *  it may be a positive integer k, in which case the first k vertices
	 *  are defined to be inputs, while the remainder are outputs; if io
	 *  is omitted or 0, a bipartition is computed from the graph;
	 *  the computed bipartition classifies the first vertex
	 *  (the one with smallest index) in each connected component as an input;
	 *  if io is specified, it is assumed consistent with any current edges.
	 *  @return false if computed value of io does not define a bipartition;
	 *  otherwise, return true
	 */	
	setBipartition(io=0) {
		if (io) {
			if (typeof io === 'number') {
				let ni = io; io = new ListPair(this.n);
				for (let i = 1; i <= ni; i++) io.swap(i);
			}
			this.io = io; return true;
		}

		io = new ListPair(this.n);
		let unreached = new Int8Array(this.n+1).fill(true);
		let q = new List(this.n);
	
		for (let u = 1; u <= this.n; u++) {
			if (!unreached[u]) continue;
			unreached[u] = false; io.swap(u); q.enq(u);
			while (!q.empty()) {
				let v = q.deq();
				for (let e = this.firstAt(v); e; e = this.nextAt(v,e)) {
					let w = this.mate(v,e);
					if (unreached[w]) {
						if (io.in(v,2)) io.swap(w);
						unreached[w] = false; q.enq(w);
					} else if ( (io.in(v,1) && io.in(w,1)) ||
						   		(io.in(v,2) && io.in(w,2))) {
						return false;
					}
				}
			}
		}
		this.io = io; return true;
	}

	/** Determine if a vertex in a bipartite graph is an input.
	 *  @param u is a vertex
	 *  @return true if u is an input, else false
	 */
	isInput(u)  { return (this.io ? this.io.in(u,1) : 0); }
	isOutput(u) { return (this.io ? this.io.in(u,2) : 0); }

	/** Get the input end of an edge in a bipartite graph.
	 *  @param e is an edge
	 *  @param return whichever endpoint of e is an input
	 */
	input(e)  {
		return this.isInput(this.left(e)) ? this.left(e) : this.right(e);
	}
	output(e) {
		return this.isOutput(this.left(e)) ? this.left(e) : this.right(e);
	}

	inputCount() { return this.io.length(1); }
	outputCount() { return this.io.length(2); }

	/** Return first input defined by bipartition io. */
	firstInput() { return this.io.first(1); }

	/** Return next output defined by bipartition io. */
	nextInput(u) { return this.io.next(u); }

	/** Return first output defined by bipartition io. */
	firstOutput() { return this.io.first(2); }

	/** Return next output defined by bipartition io. */
	nextOutput(u) { return this.io.next(u); }

	/** Join two vertices.
	 *  @param u is the left endpoint for the new edge
	 *  @param v is the right endpoint for the new edge
	 *  @param e is the number of an "unused" edge;
	 *  if omitted, the first unused edge is used
	 *  @return the edge number for the new edge or 0
	 *  on failure
	 */
	join(u, v, e=this.edges.first(2)) {
		ea && assert(u != v && u > 0 && v > 0 &&
					(!this.hasBipartition ||
						(this.isInput(u) != this.isInput(v))) &&
			   		(e > 0 || !this.edges.first(2)) && !this.edges.in(e,1),
			   		`graph.join(${this.x2s(u)},${this.x2s(v)},` +
			   		`${this.edges.in(e,2)})`);
		if (u > this.n || v > this.n || this.edges.length(2) == 0) {
			this.expand(Math.max(this.n, u, v),
						Math.max(e, this.edges.n+1));
			if (e == 0) e = this.edges.first(2);
		}
		this.edges.swap(e);

		// initialize edge information
		this.Left[e] = u; this.Right[e] = v;
		if (this.hasWeights) this.Weight[e] = 0;
	
		// add edge to the endpoint lists
		this.firstEp[u] = this.epLists.join(this.firstEp[u], 2*e);
		this.firstEp[v] = this.epLists.join(this.firstEp[v], 2*e+1);
	
		return e;
	}
	
	/** Delete an edge from the graph.
	 *  @param e is the edge to be deleted.
	 *  @return true on success, false on failure
	 */
	delete(e) {
		ea && assert(this.validEdge(e));
		let u = this.left(e); let v = this.right(e);
		this.edges.swap(e);
		this.firstEp[u] = this.epLists.delete(2*e,   this.firstEp[u]);
		this.firstEp[v] = this.epLists.delete(2*e+1, this.firstEp[v]);
		return true;
	}
	
	/** Compare two edges incident to the same endpoint u.
	 *  Return a negative value if u's mate in e1 is less than u's mate in e2.
	 *  Return +pos if u's mate in e1 is greater than than u's mate in e2.
	 *  Return  0 if u's mate in e1 is equal to its mate in e2.
	 */
	ecmp(e1, e2, u) {
		ea && assert(this.validVertex(u) &&
					   this.validEdge(e1) && this.validEdge(e2));
		let v1 = this.mate(u, e1); let v2 = this.mate(u, e2);
		return (v1 != v2 ? v1 - v2 : this.weight(e1) - this.weight(e2));
	}
	
	/** Sort an endpoint list for a specified vertex using ecmp().
	 *  @param u is the vertex whose adjacency list is to be sorted.
	 */
	sortEplist(u,ecmp) {
		ea && assert(u != 0 && this.validVertex(u));
		if (this.firstEp[u] == 0) return; // empty list

		// if already sorted, skip sorting step
		if (!ecmp) {
			for (let e = this.firstAt(u); e; e = this.nextAt(u, e)) {
				if (this.nextAt(u, e) == 0) return; // already sorted
				if (this.ecmp(e, this.nextAt(u,e), u) > 0) 
					break; // edge out of order
			}
		}

		// copy endpoints in endpoint list for u into an array
		// and remove them from endpoint list
		let epl = [];
		for (let first = this.firstEp[u]; first; first = this.firstEp[u]) {
			epl.push(first);
			this.firstEp[u] = this.epLists.delete(first, first);
		}

		if (ecmp)
			epl.sort((e1, e2) => ecmp(~~(e1/2), ~~(e2/2), u));
		else
			epl.sort((e1, e2) => this.ecmp(~~(e1/2), ~~(e2/2), u));
	
		// now rebuild endpoint list at u
		for (let j = 1; j < epl.length; j++) {
			this.epLists.join(epl[0], epl[j]);
		}
		this.firstEp[u] = epl[0];
	}
	
	/** Sort adjacency lists for all vertices by "other endpoint". */
	sortAllEplists(ecmp) {
		for (let u = 1; u <= this.n; u++) this.sortEplist(u,ecmp);
	}

	/** Compute a list of edge numbers sorted by endpoints and weights.
	 *  @param evec is an optional array of edge numbers; if present,
	 *  the edges in the list are sorted; if omitted, all edges in the
	 *  graph are sorted
	 *  @return a sorted array of edge numbers, where edges {u,v} are sorted
	 *  first by the smaller endpoint, then by the larger endpoint; if weights
	 *  are present, they are used to break ties.
	 */
	sortedElist(evec=null) {
		if (evec == null) {
			let i = 0; evec = new Array(this.m);
			for (let e = this.first(); e; e = this.next(e)) {
				evec[i++] = e;
			}
		}
		evec.sort((e1,e2) => { let m1 = Math.min(this.left(e1),this.right(e1));
							   let M1 = this.mate(m1,e1);
							   let m2 = Math.min(this.left(e2),this.right(e2));
							   let M2 = this.mate(m2,e2);
							   return (m1 != m2 ? m1 - m2 : 
									   (M1 != M2 ? M1 - M2 :
										this.weight(e1) - this.weight(e2)));
							 });
		return evec;
	}
	
	/** Find an edge joining two vertices.
	 *  @param u is a vertex number
	 *  @param v is a vertex number
	 *  @param edges is an optional array of edges in sorted order
	 *  (as returned by sortedElist()).
	 *  @return the number of some edge joining u and v, or 0 if there
	 *  is no such edge; if edges is present, restrict search to edges
	 */
	findEdge(u, v, edges) {
		ea && assert(this.validVertex(u) && this.validVertex(v), `${u} ${v}`);
		if (!edges) {
			for (let e = this.firstAt(u); e; e = this.nextAt(u, e))
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

	/** Compare another graph to this one.
	 *  @param that is a Graph object or a string representation of a Graph
	 *  @return true if that is equal to this
	 */
	equals(that) {
		that = super.equals(that, [this.n, this.edgeRange]);
		if ((typeof that) == "boolean") return that;
		if (this.n != that.n || that.m != this.m) return false;

		// now compare the edges using sorted edge lists
		let el1 = this.sortedElist(); let el2 = that.sortedElist();
		for (let i = 0; i < el1.length; i++) {
			let e1 = el1[i]; let e2 = el2[i];
			let m1 = Math.min(this.left(e1), this.right(e1));
			let M1 = this.mate(m1,e1);
			let m2 = Math.min(that.left(e2), that.right(e2));
			let M2 = that.mate(m2,e2);
			if (m1 != m2 || M1 != M2 || this.weight(e1) != that.weight(e2))
				return false;
		}
		return that;
	}
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @param label is an optional function used to label the vertices
	 *  @param terse causes edges that can be represented as letters to be
	 *  shown as letter pairs with no space or other decoration
	 *  @return a string representing the edge
	 */
	edge2string(e, label=null, terse=false) {
		return e == 0 ? '-' :
				(terse ?
					(this.x2s(this.left(e), label) + 
					 this.x2s(this.right(e), label)) : 
					('{' + this.x2s(this.left(e), label) + ','  +
					  this.x2s(this.right(e), label) +
					  (this.hasWeights ? ','+this.weight(e) : '') + '}'));
	}
	e2s(e,label,terse) { return this.edge2string(e,label,terse); }
	
	/** Create a string representation of an edge list.
	 *  @param elist is an array of edge numbers (possibly with some
	 *  invalid values mixed in; these are ignored)
	 *  @param label is an optional function that maps an edge to text
	 *  @param showAll is a flag that causes invalid edges in elist to
	 *  be displayed as dashes.
	 *  @param terse specifies terse edge strings
	 *  @return the string
	 */
	elist2string(elist, label=null, showAll=false, terse=false) {
		let s = '';
		for (let e of elist) {
			let valid = this.validEdge(e);
			if (!valid && !showAll) continue;
			if (s.length > 0) s += ' ';
			s += (valid ? this.e2s(e, label, terse) : '-');
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
			s += this.x2s(e, label);
		}
		return '[' + s + ']';
	}
	
	/** Construct a string representation of the Graph object.
	 *  Returned string shows the adjacency lists of the vertices.
	 *  @param fmt is an integer; its low order bits specify format options
	 *		0b001 causes the adjacency lists to be shown on separate lines
	 *		0b010 causes empty lists to be shown explicitly
	 *		0b100 omits edges from the list of the "larger" endpoint
	 *  @param elab is an optional labeling function used to produce the
	 *  string that represents an edge in an adjacency list; by default,
	 *  this is just the 'other endpoint' of the edge, but it can be
	 *  used to produce other strings, or show properties of the edge;
	 *  it has two arguments, an edge e and the 'near' endpoint of e
	 *  @param vlab is a similar labeling function used to produce the
	 *  string that represents the vertex that 'owns' an adjacency list;
	 *  it has a single argument
	 *  adjacency list is shown explicitly
	 *  @return a reference to the string
	 */
	toString(fmt=0, elab=0, vlab=0) {
		if (!elab) {
			elab = (e,u) => this.x2s(this.mate(u,e)) + 
							(this.weight(e) ? (':' + this.weight(e)) : '');
		}
		if (!vlab) vlab = ((u) => this.x2s(u));
		let s = '';
		for (let u = 1; u <= this.n; u++) {
			let ss = this.alist2string(u, elab, fmt&4);
			if (!(fmt&2) && !ss) continue;
			if (!(fmt&1) && s) s += ' ';
			s += vlab(u) + ss;
			if (fmt&1) s += '\n';
		}
		return (fmt&1 ? '{\n' + s + '}\n': '{' + s + '}');
	}

	/** Create a string representation of an adjacency list.
	 *  @param u is a vertex number
	 *  @param elab is edge labelling function as defined in toString()
	 *  @param skip is a flag that omits edges from list of larger endpoint
	 *  @return a string representing the list
	 */
	alist2string(u, elab=0, skip) {
		let s = '';
		for (let e = this.firstAt(u); e; e = this.nextAt(u, e)) {
			if (skip && this.mate(u,e) < u) continue;
			let ns = elab(e,u);
			if (s.length > 0 && ns.length > 0) s += ' ';
			s += ns;
		}
		return (s ? `[${s}]` : '');
	}

	/** Get the next vertex (from the start of an alist) from a scanner.
	 *  @param sc is a scanner for a string representation of a flow graph
	 *  @return the vertex that is assumed to be the next thing in the
	 *  scanner string, or 0 if not successful.
	 */
	nextVertex(sc) { return sc.nextIndex(); }
		
	/** Initialize graph from a string representation.
	 *  @param s is a string representing a graph
	 *  @return true on success, else false
	 */
	fromString(s) {
		let n = 1;
		// function for parsing a vertex
		let vnext = (sc => {
						let u = sc.nextIndex();
						n = Math.max(n,u);
						return u > 0 ? u : 0;
					});
		// function for parsing an item in an adjacency list
		let pairs = []; let weights = [];
		let enext = ((u,sc) => {
						let v = sc.nextIndex();
						if (v < 0) return false;
						n = Math.max(n,v);
						let i = pairs.length;
						if (u < v) pairs.push([u,v]);
						if (sc.verify(':',0)) {
							let w = sc.nextNumber();
							if (Number.isNaN(w)) return false;
							if (u < v) weights[i] = w;
						}
						return true;
					});

		if (!this.parseString(s, vnext, enext)) return false;

		this.reset(n, Math.max(1,pairs.length));

		// configure graph
		for (let i = 0; i < pairs.length; i++) {
			let [u,v] = pairs[i];
			let e = this.join(u,v);
			if (weights[i]) this.weight(e, weights[i]);
		}
		return true;
	}

	/** Parse a string representing a graph.
	 *  @param s is a string representing a graph
	 *  @param enext is a function that is called at the
	 *  point in the string where an edge or edge endpoint is expected;
	 *  it should parse the edge of edge endpoint with any attached
	 *  properties that might be expected and return true or false
	 *  @param vnext is a function that is called at the
	 *  point in the string where a vertex and its adjacency list
	 *  are expected; it should parse the vertex and any attached
	 *  properties that may be present and return the vertex number,
	 *  or 0 on failure.
	 *  @return true on success, else false
	 */
	parseString(s, vnext, enext) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		while (!sc.verify('}')) {
			let u = vnext(sc);
			if (!u) return false;
			if (sc.verify('[')) {
				while (!sc.verify(']')) {
					if (!enext(u,sc)) return false;
				}
			}
		}
		return true;
	}

	/* Compute the degree of a vertex.
	 *  @param u is a vertex
	 *  @return the number of edges incident to u
	 */
	degree(u) {
		ea && assert(this.validVertex(u));
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
	 *  Likely to be slow if edgeRange >> m.
	 *  If sampling many edges, just copy out edges to an array
	 *  and sample the n array
	 */
	randomEdge() {
		let edges = this.edges;
		if (edges.nIn == 0) return 0;
		if (edges.length(1) < this.edgeRange / 20) {
			let i = randomInteger(1, edges.length(1));
			for (let e = edges.first(1); e; e = edges.next(e,1)) 
				if (--i == 0) return e;
			return 0; // should never get here
		}
		let e = randomInteger(1, this.edgeRange);
		while (edges.in(e,2)) {
			// avg number of tries should never exeed 20
			// if used to sample from "almost full" graph, then fast
			e = randomInteger(1, this.edgeRange);
		}
		return e;
	}

	/** Randomize the order of the vertices, edges and adjacency lists.
	 *  @param fixedPoints is an optional Set of vertices that are
	 *  not to be randomized
	 *  @return the pair [vp,ep] where v is the vertex permutation used and
	 *  ep is the edge permutation
	 */
	scramble(fixedPoints=null) {
		let vp = randomPermutation(this.n,fixedPoints);
		let ep = randomPermutation(this.edgeRange);
		let weight = this.Weight; this.Weight = null;
		this.shuffle(vp, ep);
		if (weight) { shuffle(weight, ep); this.Weight = weight; }
		this.scrambleEplists();
		return [vp,ep];
	}

	/** Randomize order of edges.
	 *  Does not renumber vertices or edges.
	 */
	scrambleEdges() {
		// first re-order the edges object
		let el = new Int32Array(this.m+1);
		let i = 1;
		for (let e = this.first(); e; e = this.next(e)) el[i++] = e;
		scramble(el);
		for (i = 1; i <= this.m; i++) {
			this.edges.swap(el[i]); this.edges.swap(el[i]);
		}
	}

	/** Randomize order of endpoint lists.
	 *  Does not renumber vertices or edges.
	 */
	scrambleEplists() {
		for (let u = 1; u <= this.n; u++) {
			if (this.firstEp[u] == 0) continue;
			let epl = [0]; let ee = this.firstEp[u];
			while (ee != 0) {
				epl.push(ee); ee = this.epLists.delete(ee, ee);
			}
			scramble(epl);
			for (let i = 2; i < epl.length; i++)
				this.epLists.join(epl[1], epl[i]);
			this.firstEp[u] = epl[1];
		}
	}

	/** Shuffle the vertices and edges according to the given permutations.
	 *  @param vp is a permutation on the vertices, mapping vertex u to vp[u-1]
	 *  @param ep is a permutation on the edge numbers (including unused ones)
	 *  mapping edge e to ep[e-1]
	 */
	shuffle(vp, ep) {
		let left = new Array(this.edgeRange).fill(0);
		let right = new Array(this.edgeRange);
		for (let e = this.first(); e; e = this.next(e)) {
			left[ep[e]] = this.left(e); right[ep[e]] = this.right(e);
		}
		this.clear();
		for (let e = 0; e < left.length; e++) {
			if (left[e] != 0)
				this.join(vp[left[e]], vp[right[e]], e);
		}
	}

	/** Compute random weights for all the edges.
	 *  @param rand is a random number generator used to generate the
	 *  random edge weights
	 *  @param args collects any remaining arguments to randomWeights
	 *  into an array; its slements are the arguments to rand.
	 *  provided by caller; for example randomWeights(randomInteger, 1, 10)
	 *  will assign random integer weights in 1..10.
	 */
	randomWeights(rand, ...args) {
		if (!this.hasWeights) this.hasWeights = true;
		for (let e = this.first(); e; e = this.next(e)) {
			this.weight(e, rand(...args));
		}
	}
}
