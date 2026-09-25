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

import { assert, assertEnabled } from '../../common/Assert.mjs';
let ae; // initialized in constructor

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
	edges_;		      // sets of in-use and free edges
	vertex_endpoints; // ListSet that partitions edge endpoints among vertices
					  // includes numbered lists, one per vertex
	io;			      // optional ListPair defining bipartition

	left_;		     // left_[e] is left endpoint of edge e
	right_;		     // right_[e] is right endpoint of edge e

	/** Construct Graph with space for a specified # of vertices and edges.
	 *  @param n is the number of vertices in the graph
	 *  @param erange is the initial range for edge values (defaults to n)
	 */
	constructor(n=10, erange=n, propName=0, defVal=0) {
		ae = assertEnabled();
		ae && assert(n > 0 && erange > 0, n, erange);
		super(n);
		this.left_ = new Int32Array(erange+1);
		this.right_ = new Int32Array(erange+1);
		this.edges_ = new ListPair(erange);
		this.vertex_endpoints = new ListSet(2*(erange+1), n);

		if (arguments.length > 2) {
			this.addEdgeProperty(propName, defVal);
		}
	}

	get edgeRange() { return this.left_.length-1; }

	/** Get the number of edges.
	 *  @return the number of edges in the graph.
	 */
	get m() { return this.edges_.length(1); }

	/** Remove all the edges from a graph.  */
	clear() {
		let e = this.first();
		while (e != 0) { this.delete(e); e = this.first(); }
	}

	/* Add a new edge property
	 * @param propName is name of new edge property
	 * @param defVal is default value for new property
	 */
	addEdgeProperty(propName, defVal=0) {
		let xpropName = (this.edges_[propName] ? '_' : '') + propName;
			// to avoid conflicts with existing properties in edges_

		this.edges_.addProperty(xpropName, defVal);

		Object.defineProperty(this, propName,
			{ value: function(e,v) { return this.edges_[xpropName](e,v); } });
		Object.defineProperty(this, 'reset_' + propName,
			{ value: function() { this.edges_['reset_' + propName](); } });
	}

	property(i) {
		let p = this.edges_.property(i);
		if (p == null) return null;
		let [name, def] = p;
		return [(name[0] == '_' ? name.slice(1) : name), def];
	}

	/** Return a clone of a graph object, including its property values.
	 */
	static clone(g, withProperties=1) {
		let clone = new Graph(g.n, g.edgeRange);
		for (let e = g.first(); e; e = g.next(e)) {
			clone.join(g.left(e), g.right(e), e);
		}
		if (!withProperties) return clone;
		for (let i = 0; ; i++) {
			let pi = g.property(i);
			if (!pi) break;
			let [name, def] = pi;
			clone.addEdgeProperty(name, def);
			for (let e = g.first(); e; e = g.next(e))
				clone[name](e, g[name](e));
		}
		return clone;
	}

	validVertex(u) { return 1 <= u && u <= this.n; }

	/** Determine if an edge number corresponds to a valid edge.
	 *  @param e is the edge number to be verified
	 *  @return true if e is a valid edge number, else false.
	 */
	validEdge(e) { return this.edges_.in(e,1); }
	
	/** Get the left endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the left endpoint of e, or 0 if e is not a valid edge.
	 */
	left(e) {
		ae && assert(this.validEdge(e),
					 `Graph.left: invalid edge number: ${e}`);
		return this.left_[e];
	}
	
	/** Get the right endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the right endpoint of e, or 0 if e is not a valid edge.
	 */
	right(e) {
		ae && assert(this.validEdge(e),
					 `Graph.right: invalid edge number: ${e}`);
		return this.right_[e];
	}

	/** Get the other endpoint of an edge.
	 *  @param v is a vertex
	 *  @param e is an edge incident to v
	 *  @return the other vertex incident to e
	 */
	mate(v, e) {
		ae && assert(this.validVertex(v) && this.validEdge(e) &&
			   (v == this.left(e) || v == this.right(e)));
		return v == this.left(e) ? this.right(e) : this.left(e);
	}
	
	/** Get the first edge in the overall list of edges.
	 *  @return the first edge in the list
	 */
	first() { return this.edges_.first(1); }
	
	/** Get the next edge in the overall list of edges.
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the list, or 0 if e is not in the list
	 *  or it has no successor
	 */
	next(e) { return this.edges_.next(e); }
	
	/** Get the first edge incident to a vertex.
	 *  @param v is the vertex of interest
	 *  @return the first edge incident to v
	 */
	firstAt(v) { 
		ae && assert(this.validVertex(v));
		return Math.trunc(this.vertex_endpoints.first(v)/2);
	}
	
	/** Get the next edge in the adjacency list for a specific vertex.
	 *  @param v is the vertex whose adjacency list we're accessing
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the adjacency list for v
	 *  or 0 if e is not incident to v or is the last edge on the list
	 */
	nextAt(v, e) {
		ae && assert(this.validVertex(v) && this.validEdge(e));
		if (v != this.left(e) && v != this.right(e)) return 0;
		let ep = (v == this.left(e) ? 2*e : 2*e+1);
		return Math.trunc(this.vertex_endpoints.next(ep)/2);
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
	join(u, v, e=this.edges_.first(2)) {
		ae && assert(u != v && this.validVertex(u) && this.validVertex(v) &&
					(!this.hasBipartition ||
						(this.isInput(u) != this.isInput(v))) &&
			   		(e > 0 || !this.edges_.first(2)) && !this.edges_.in(e,1),
			   		`graph.join(${this.x2s(u)},${this.x2s(v)},` +
			   		`${this.edges_.in(e,2)})`);
		if (e == 0) e = this.edges_.first(2);
		this.edges_.swap(e);

		// initialize edge information
		this.left_[e] = u; this.right_[e] = v;
	
		// add edge to the endpoint lists
		this.vertex_endpoints.append(2*e, u);
		this.vertex_endpoints.append(2*e+1, v);

		// initialize edge properties
		for (let i = 0; ;i++) {
			let pi = this.property(i);
			if (!pi) break;
			let [name,def] = pi;
			this[name](def);
		}
	
		return e;
	}
	
	/** Delete an edge from the graph.
	 *  @param e is the edge to be deleted.
	 *  @return true on success, false on failure
	 */
	delete(e) {
		ae && assert(this.validEdge(e));
		let u = this.left(e); let v = this.right(e);
		this.edges_.swap(e);
		this.vertex_endpoints.remove(2*e, u);
		this.vertex_endpoints.remove(2*e+1, v);
		return true;
	}
	
	/** Compare two edges incident to the same endpoint u.
	 *  Return a negative value if u's mate in e1 is less than u's mate in e2.
	 *  Return +pos if u's mate in e1 is greater than than u's mate in e2.
	 *  Return  0 if u's mate in e1 is equal to its mate in e2.
	 */
	ecmp(e1, e2, u) {
		ae && assert(this.validVertex(u) &&
					   this.validEdge(e1) && this.validEdge(e2));
		let v1 = this.mate(u, e1); let v2 = this.mate(u, e2);
		return (v1 - v2);
		//return (v1 != v2 ? v1 - v2 : compareProp0(e1,e2));
	}

	/** Comparison function for first property values of two edges
	 *  @return a number for which the sign indicates which is "larger".
	 */
	compareProp0(e1, e2) {
		let p0 = this.property(0); let pname;
		if (p0) [pname] = p0;
		let ep1 = this[pname](e1); let ep2 = this[pname](e2);
		if ((typeof ep1 != 'number' && typeof ep1 != 'string') ||
			typeof ep1 != typeof ep2)
			return 0;
		return (typeof ep1 == 'number' ? ep1-ep2 : ep1.localeCompare(ep2));
	}
	
	/** Sort an endpoint list for a specified vertex using ecmp().
	 *  @param u is the vertex whose adjacency list is to be sorted.
	 *  @param ecmp(e1,e2,u) is an optional edge-comparison function used to
	 *  compare edges e1 and e2 both incident to u.
	 */
	sortEplist(u, ecmp=((e1,e2,u) => this.ecmp(e1,e2,u))) {
let t = Date.now(); let d;
		ae && assert(u != 0 && this.validVertex(u));
		if (this.vertex_endpoints.first(u) == 0) return; // empty list

		// if already sorted, skip sorting step
		for (let e = this.firstAt(u); e; e = this.nextAt(u, e)) {
			if (this.nextAt(u, e) == 0) return; // already sorted
			if (ecmp(e, this.nextAt(u,e), u) > 0) 
				break; // edge out of order
		}

		// copy endpoints in endpoint list for u into an array
		// and remove them from endpoint list
		let epl = [];
		while (this.vertex_endpoints.first(u)) {
			let f = this.vertex_endpoints.first(u);
			epl.push(f);
			this.vertex_endpoints.remove(f, u);
		}

		epl.sort((ep1, ep2) => ecmp(~~(ep1/2), ~~(ep2/2), u));
	
		// now rebuild endpoint list at u
		for (let j = 0; j < epl.length; j++) {
			this.vertex_endpoints.append(epl[j], u);
		}
	}
	
	/** Sort adjacency lists for all vertices */
	sortAllEplists(ecmp) {
		for (let u = 1; u <= this.n; u++) this.sortEplist(u,ecmp);
	}

	/** Compute a list of edge numbers sorted by endpoints.
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
							   return (m1 != m2 ? m1 - m2 : M1 - M2);
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
		ae && assert(this.validVertex(u) && this.validVertex(v), `${u} ${v}`);
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
	 *  @return true if that is equal to this (same vertices and edges,
	 *  but edge numbers may differ) and that the first property (if any)
	 *  matches
	 */
	equals(that) {
		that = super.equals(...(arguments.length==1 ?
							[that, this.n, Math.max(10,this.m)] : arguments));
		if ((typeof that) == "boolean") return that;
		if (this.n != that.n || that.m != this.m) return false;

		// check that both have same first property name
		let p1 = this.property(0); let p2 = that.property(0);
		if ((p1 == null) != (p2 == null)) return false;
		if (p1 && p1[0] != p2[0]) return false;
		let pname = p1 ? p1[0] : '';
	
		// now compare the edges using sorted edge lists
		let el1 = this.sortedElist(); let el2 = that.sortedElist();
		for (let i = 0; i < el1.length; i++) {
			let e1 = el1[i]; let e2 = el2[i];
			let m1 = Math.min(this.left(e1), this.right(e1));
			let M1 = this.mate(m1,e1);
			let m2 = Math.min(that.left(e2), that.right(e2));
			let M2 = that.mate(m2,e2);
			if (m1 != m2 || M1 != M2) return false;

			// check that the first property values match
			if (pname && this[pname](e1) != that[pname](e2)) return false;
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
		let p0 = this.property(0);
		let name; if (p0) [name] = p0;
		return e == 0 ? '-' :
				(terse ?
					(this.x2s(this.left(e), label) + 
					 this.x2s(this.right(e), label)) : 
					('{' + this.x2s(this.left(e), label) + ','  +
					  this.x2s(this.right(e), label) +
					  (p0 ? ',' + this.datum2string(this[name](e)) : '') +
					'}'));
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
	 *  this is the 'other endpoint' of the edge and its first edge property
	 *  (if there is one), but it can be used to produce other strings, or
	 *  show multiple edge properties; it has two arguments, an edge e and
	 *  the 'near' endpoint of e
	 *  @param vlab is a similar labeling function used to produce the
	 *  string that represents the vertex that 'owns' an adjacency list;
	 *  it has a single argument
	 *  @return the string
	 */
	toString(fmt=0, elab=0, vlab=0) {
		if (!elab) {
			let p0 = this.property(0); let name; let def;
			if (p0) [name,def] = p0;
			elab = (e,u) => this.x2s(this.mate(u,e)) + 
							(p0 && this[name](e) != undefined &&
								   this[name](e) != def ?
								':' + this.datum2string(this[name](e)) : '');
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
	alist2string(u, elab='', skip) {
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
	 *  @param s is a string representing a graph; if the string includes
	 *  an edge property for any edge or an explicit property name is
	 *  included in the argument list, then an edge property is added to
	 *  the graph
	 *  @param n defines a lower bound on the number of vertices
	 *  @param erange defines a lower bound on the edge range
	 *  @param propName is the name to be assigned to the edge property if
	 *  present
	 *  @param defVal is the default value to be assigned to the edge property
	 *  @return true on success, else false
	 */
	static fromString(s, n=10, erange=10, propName='weight', defVal=0) {
		// function for parsing a vertex
		let vnext = (sc => {
						let u = sc.nextIndex();
						n = Math.max(n,u);
						return u > 0 ? u : 0;
					});

		// function for parsing an item in an adjacency list
		let pairs = []; let pvals = []; let hasProps = 0;
		let enext = ((u,sc) => {
						let v = sc.nextIndex();
						if (v < 0) return false;
						n = Math.max(n,v);
						let i = pairs.length;
						if (u < v) pairs.push([u,v]);
						if (sc.verify(':',0)) {
							let w = sc.nextNumber();
							if (Number.isNaN(w)) return false;
							if (u < v) pvals[i] = w;
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

		let g = new Graph(n, Math.max(erange, pairs.length));
		if (hasProps) g.addEdgeProperty(propName, defVal);

		// configure graph
		for (let i = 0; i < pairs.length; i++) {
			let [u,v] = pairs[i];
			let e = g.join(u, v);
			if (pvals[i] != undefined)
				g[propName](e, pvals[i]);
		}
		return g;
	}

	/** Compute the degree of a vertex.
	 *  @param u is a vertex
	 *  @return the number of edges incident to u
	 */
	degree(u) {
		ae && assert(this.validVertex(u));
		let d = 0;
		for (let e = this.firstAt(u); e; e = this.nextAt(u,e)) d++;
		return d;
	}
	
	/** Compute the maximum degree.
	 *  @return the maximum degree of any vertex, but if this has a
	 *  defined bipartition, return pair equal to the max degree of any input
	 *  and the max degree for any output.
	 */
	maxDegree() {
		let bipartite = this.hasBipartition;
		let dmax = 0; let idmax = 0; let odmax = 0;
		for (let u = 1; u <= this.n; u++) {
			let du = this.degree(u);
			if (bipartite) {
				if (this.isInput(u)) idmax = Math.max(idmax,du);
				else odmax = Math.max(odmax,du);
			} else {
				dmax = Math.max(dmax, du);
			}
		}
		return bipartite ? [idmax,odmax] : dmax;
	}

	/** Return a random edge.
	 *  Likely to be slow if edgeRange >> m.
	 *  If sampling many edges, just copy out edges to an array
	 *  and sample the n array
	 */
	randomEdge() {
		let edges = this.edges_;
		if (edges.length(1) == 0) return 0;
		let e = randomInteger(1, this.edgeRange);
		if (edges.in(e,1)) return e;
		if (g.m > g.edgeRange/20) {
			do {
				e = randomInteger(1, this.edgeRange);
				// expect no more than 20 attempts
			} while (edges.in(e,2));
			return e;
		}
		// do it the hard way
		if (edges.length(1) < this.edgeRange/20) {
			let i = randomInteger(1, edges.length(1));
			for (let e = edges.first(1); e; e = edges.next(e,1)) 
				if (--i == 0) return e;
			return 0; // should never get here
		}
		return e;
	}


	/** Randomize the order of the vertices, edges and adjacency lists.
	 *  @param fixedPoints is an optional Set of vertices that are
	 *  not to be randomized
	 *  @return the pair [vp,ep] where v is the vertex permutation used and
	 *  ep is the edge permutation; note edge properties are not randomized;
	 *  these should be added to a random graph last
	scramble(fixedPoints=null) {
		let vp = randomPermutation(this.n,fixedPoints);
		let ep = randomPermutation(this.edgeRange);

		this.shuffle(vp, ep);
		this.scrambleEplists();
		return [vp,ep];
	}
	 */

	/** Randomize order of edges.
	 *  Does not renumber vertices or edges.
	scrambleEdges() {
		// first re-order the edges object
		let el = new Int32Array(this.m+1);
		let i = 1;
		for (let e = this.first(); e; e = this.next(e)) el[i++] = e;
		scramble(el);
		for (i = 1; i <= this.m; i++) {
			this.edges_.swap(el[i]); this.edges_.swap(el[i]);
		}
	}
	 */

	/** Randomize order of endpoint lists.
	 *  Does not renumber vertices or edges.
	scrambleEplists() {
		for (let u = 1; u <= this.n; u++) {
			if (!this.vertex_endpoints.first(u)) continue;
			let epl = [0];
			while (this.vertex_endpoints.first(u)) {
				let f = this.vertex_endpoints.first(u);
				epl.push(f); this.vertex_endpoints.remove(f,u);
			}
			scramble(epl);
			for (let i = 0; i < epl.length; i++) {
				this.vertex_endpoints.append(epl[i], u);
			}
		}
	}
	 */

	/** Shuffle the vertices and edges according to the given permutations.
	 *  @param vp is a permutation on the vertices, mapping vertex u to vp[u-1]
	 *  @param ep is a permutation on the edge numbers (including unused ones)
	 *  mapping edge e to ep[e-1]
	shuffle(vp, ep) {
		let left  = new Int32Array(this.edgeRange+1);
		let right = new Int32Array(this.edgeRange+1);
		for (let e = this.first(); e; e = this.next(e)) {
			left[ep[e]] = this.left(e); right[ep[e]] = this.right(e);
		}
		this.clear();
		for (let e = 0; e < left.length; e++) {
			if (left[e] != 0)
				this.join(vp[left[e]], vp[right[e]], e);
		}
	}
	 */
}
