/** @file Digraph_l.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import Adt from '../Adt.mjs';
import Digraph from './Digraph.mjs';
import List from '../basic/List.mjs';
import Dlists from '../basic/Dlists.mjs';
import ListPair from '../basic/ListPair.mjs';

/** Data structure for directed graph with edge lengths.
 *  Extends Digraph class, adding edge lengths.
 */
export default class Digraph_l extends Digraph {
	#length; ///< #length[e] is length of edge e

	/** Construct Digraph with space for a specified # of vertices and edges.
	 *  @param n is the number of vertices in the graph
	 *  @param ecap is the initial edge capacity (defaults to n)
	 *  @param vcap is the initial vertex capacity (defaults to n);
	 *  this argument is intended for internal use of Digraph class
	 */
	constructor(n, ecap, vcap) {
		super(n, ecap, vcap); this.#init_l();
	}
	
	#init_l(ecap) {
		this.#length = new Array(this._ecap+1).fill(0);
	} 

	reset(n, ecap, vcap) {
		assert(n > 0 && vcap >= n && ecap > 0);
		super.reset(n, ecap, vcap); this.#init_l();
	}

	expand(n, m) {
		if (n <= this.n && m <= this.m) return;
        if (n > this._vcap || m > this._ecap) {
            let vcap = (n <= this._vcap ? this._vcap :
                            Math.max(n, Math.trunc(1.25*this._vcap)));
            let ecap = (m <= this._ecap ? this._ecap :
                            Math.max(m, Math.trunc(1.25*this._ecap)));
			let nu = new Digraph_l(n, ecap, vcap);
			nu.assign(this); this.xfer(nu);
		}
		this.#length.fill(0, this.m+1, this._ecap+1);
		super.expand(n, m);
	}

	/** Assign one graph to another.
	 *  @param g is another graph that is copied to this one
	 */
	assign(g) {
		super.assign(g);
		if (this.#length.length != this._ecap+1)
			this.#length = new Array(this._ecap);
		for (let e = g.first(); e != 0; e = g.next(e))
			this.#length[e] = g.#length[e];
	}

	/** Embed a Digraph object within this Graph_l object.
	 *  @param g is a Graph object.
	 */
	embed(g) {
		super.assign(g);
		if (this.#length.length != this._ecap+1)
			this.#length = new Array(this._ecap+1);
		this.#length.fill(0);
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph whose contents is traferred to this one
	 */
	xfer(g) {
		super.xfer(g); this.#length = g.#length; g.#length = null;
	}

	/** Get the length of an edge.
	 *  @param e is an edge
	 *  @return the length of e
	 */
	length(e) { assert(this.validEdge(e)); return this.#length[e]; }

	/** Set the length of an edge.
	 *  @param e is an edge
	 *  @param l is a length to be assigned to e
	 */
	setLength(e, l) { assert(this.validEdge(e)); this.#length[e] = l; }

	/** Compare another graph to this one.
	 *  @param g is a Digraph_l object or a string representing one.
	 *  @return true if g is equal to this; that is, it has the same
	 *  vertices, edges and edge lengths; note: endpoint lists are
	 *  sorted as a side effect
	 */
	equals(g) {
		if (g == this) return true;
		if (typeof g == 'string') {
			let s = g; g = new Digraph_l(this.n, this.m); g.fromString(s);
		}
        if (!(g instanceof Digraph_l)) return false;
		if (!super.equals(g)) return false;

		// so we have same edges in same order, now check that lengths match
		for (let u = 1; u <= n(); u++) {
			let e = this.firstOut(u); let eg = g.firstOut(u);
			while (e != 0) { 
				if (this.length(e) != g.length(eg)) return false;
				e = this.nextAt(u, e); eg = g.nextAt(u, eg);
			}
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
		if (status != 0) return status;
		// now use lengths to break ties
		     if (this.length(e1) < this.length(e2)) return -1;
		else if (this.length(e1) > this.length(e2)) return 1;
		else return 0;
	}
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @param u is one of the endponts of e;
	 *  it will appear first in the string
	 *  @return a string representing the edge
	 */
	edge2string(e, u=this.left(e)) {
		let v = this.mate(u, e);
		return "(" + this.index2string(u) + ","  + this.index2string(v) +
			   "," + this.length(e) + ")";
	}

	/** Create a string representation of the neighbor of a vertex.
	 *  @param u is a vertex
	 *  @param e is an edge incident to u
	 *  @param showEdgeNum specifies that the edge number should be included
	 *  in the string
	 *  @return a string representing the mate(u,e), possibly followed by
	 *  an edge number, and definitely followed by the edge length
	 */
	nabor2string(u, e, details=0, strict=0) {
        return (u != this.tail(e) ? '' :
                this.index2string(this.mate(u, e), strict) +
                ':' + this.length(e) + (details ? ':'+e : ''));
	}
		
	/** Get the neighbor of a given vertex from a scanner and add connecting
	 *  edge to this Digraph.
	 *  @param u is a vertex in the graph.
	 *  @param sc is a scanner that has been initialized with a string
	 *  representing a Digraph and the next index to be scanned represents
	 *  a neighbor of u, possibly followed by an explicit edge number
	 *  and definitely followed by a length.
	 *  @return the edge number for the new edge, if the operation was
	 *  successful, else 0.
	 */
	nextNabor(u, sc) {
		let e = super.nextNabor(u, sc);
		if (e == 0 || !sc.verify(':')) return 0;
		let l = sc.nextInt();
		if (isNaN(l)) return 0;
		this.setLength(e, l);
		return e;
	}

	/** Randomize the order of the vertices and edges. */
	scramble() {
		let [,ep] = super.scramble();
		shuffle(this.#length, ep);
	}

	/** Compute random lengths for all the edges.
	 *  @param f is a random number generator used to generate the
	 *  random edge lengths; it is invoked using any extra arguments
	 *  provided by caller; for example randomLengths(randomInteger, 1, 10)
     *  will assign random integer lengths in 1..10.
	 */
	randomLengths(f) {
		let args= ([].slice.call(arguments)).slice(1);
        for (let e = this.first; e != 0; e = this.next(e))
			let l = f(...args); this.setLength(e, l);
	}
	
	/** Construct a string in dot file format representation 
	 *  of the Digraph_l object.
	 *  For small graphs (at most 26 vertices), vertices are
	 *  represented in the string as lower case letters.
	 *  For larger graphs, vertices are represented by integers.
	 *  @param s is a string object provided by the caller which
	 *  is modified to provide a representation of the Digraph_l.
	 *  @return a reference to the string
	 */
	toDotString() {
		// undirected graph
		let s = "graph G {\n";
		for (let e = first(); e != 0; e = next(e)) {
			let u = Math.min(left(e),right(e));
			let v = Math.max(left(e),right(e));
			s += this.index2string(u) + " -- ";
			s += this.index2string(v) + " ; ";
			s += " [label = \" " + this.length(e) + " \"] ; ";
			if (s.length() > 65) s += "\n";
		}
		s += " }\n";
		return s;
	}
}
