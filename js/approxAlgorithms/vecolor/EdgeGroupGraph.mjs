/** @file EdgeGroupGraph.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Scanner from '../../dataStructures/basic/Scanner.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** This class implements a bipartite "group graph", which is an undirected 
 *  graph in which the edges incident to each "input" are divided into groups
 *  of one or more edge. Edge-group coloring algorithms color the edges
 *  in a group graph, with edges in distinct groups at each input having
 *  disjoint color sets.
 *
 *  To simplify representation, inputs are assigned smaller index values
 *  than outputs; with vertices 1..ni, pre-defined as inputs.
 */
export default class EdgeGroupGraph extends Graph {
	_ni;             // number of inputs
    deg;             // deg[u]=degree of u

	grange;          // index range for groups
    gdeg;            // gdeg[u]=group degree at u
    gid;             // gid[e] is group identifier for e
    fan;             // fan[g]=# of edges in group g

    groupIds;        // ListPair that separates in-use group numbers from unused
    edgesInGroups;   // ListSet that partitions edges into their groups
    feg;             // feg[g] is first edge in group g
    groupsAtInputs;  // ListSet dividing groups among inputs
    fg;              // fg[u] is first group at input u

	vlist;           // temporary list of vertices

	constructor(n=10, erange=n, ni=~~(n/2), grange=erange) {
		super(n, erange);

		this._ni = ni;
		this.deg = new Int32Array(n+1);

		this.grange = grange; 
		this.gdeg = new Int32Array(ni+1);
		this.gid = new Int32Array(erange+1);
		this.fan = new Int32Array(grange+1);

		this.groupIds = new ListPair(grange);
		this.edgesInGroups = new ListSet(erange);
		this.feg = new Int32Array(grange+1);
		this.groupsAtInputs = new ListSet(grange);
		this.fg = new Int32Array(ni+1);

		this.vlist = new List(n);
	}

	clear() {
		super.clear();
		this.deg.fill(0);

		this.gdeg.fill(0);
		this.gid.fill(0);
		this.fan.fill(0);

		this.groupIds.clear();
		this.edgesInGroups.clear(); this.feg.fill(0);
		this.groupsAtInputs.clear(); this.fg.fill(0);
	}

	get ni() { return this._ni; }

	get groupRange() { return this.grange; }

	/** Assign one GroupGraph to another by copying its contents.
	 *  @param other is another graph whose contents is copied to this one
	 */
	assign(other, relaxed=false) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');

		if ((this.n == other.n && this.edgeRange == other.edgeRange &&
			 this._ni == other._ni && this.grange == other.grange) ||
			(relaxed && this.n >= other.n && this.edgeRange>=other.edgeRange &&
			 this._ni >= other._ni && this.grange >= other.grange))
			this.clear();
		else
			this.reset(other.n, other.edgeRange, other._ni, other.grange);

		for (let e = other.first(); e; e = other.next(e)) {
			let g = other.gid[e];
			this.join(other.left(e), other.right(e), g, e);
		}
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param other is another graph whose contents is transferred to this one
	 */
	xfer(other) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:xfer: self-assignment or mismatched types');
		super.xfer(other)
		this._ni = other._ni;
		this.deg = other.deg;

		this.grange = other.grange;
		this.gdeg = other.gdeg;
		this.fan = other.fan;

		this.gid = other.gid;
		this.groupIds = other.groupIds;
		this.edgesInGroups = other.edgesInGroups; this.feg = other.feg;
		this.groupsAtInputs = other.groupsAtInputs; this.fg = other.fg;

		other.deg = other.gdeg = other.fan = null; other.gid = null;
		other.groupIds = other.edgesInGroups = other.groupsAtInputs = null;
		other.feg = other.fg = null;
	}

	input(e) { return this.left(e); }
	output(e) { return this.right(e); }
	group(e) { return this.gid[e]; };

	degree(u) { return this.deg[u]; }
	groupDegree(u) { return this.gdeg[u]; }
	fanout(g) { return this.fan[g]; }

	maxDegree() { return Math.max(...this.deg); }

	maxGroupDegree() { return Math.max(...this.gdeg); }

	maxDegreeIn() {
		let d = 0;
		for (let u = 1; u <= this.ni; u++)
			d = Math.max(d, this.degree(u));
		return d;
	}

	maxDegreeOut() {
		let d = 0;
		for (let u = this.ni+1; u <= this.n; u++)
			d = Math.max(d, this.degree(u));
		return d;
	}

	maxGroupDegree() {
		let d = 0;
		for (let u = 1; u <= this.ni; u++)
			d = Math.max(d, this.groupDegree(u));
		return d;
	}

	firstGroup() { return this.groupIds.first(1); }
	nextGroup(g) { return this.groupIds.next(g,1); }

	firstGroupAt(u) { return this.fg[u]; }
	nextGroupAt(u,g) { return this.groupsAtInputs.next(g); }

	firstInGroup(g) { return this.feg[g]; }
	nextInGroup(g,e) { return this.edgesInGroups.next(e); }

	/** Join two vertices.
	 *  @param u is an input vertex
	 *  @param v is an output vertex
	 *  @param g is the group number to be assigned to the new edge;
	 *  if not specified or 0, an unused group number is assigned
	 *  @param e is the edge number to use; if not specified or 0,
	 *  an unused edge number is assigned
	 *  @returns the edge number of the new edge or 0 on failure;
	 *  exceptions may be thrown if u is an output, v is an input,
	 *  e is already used for another edge, g is already used for
	 *  a group at a different input or g is not specified and there
	 *  are no available group ids
	 */
	join(u, v, g=0, e=0) {
		if (e) super.join(u,v,e);
		else e = super.join(u,v);

		ea && assert(u <= this.ni && v > this.ni);
		this.deg[u]++; this.deg[v]++;

		if (g == 0) g = this.groupIds.first(2);
		ea && assert(g);

		if (this.groupIds.in(g,2)) {
			this.groupIds.swap(g);
			this.fg[u] = this.groupsAtInputs.join(this.fg[u],g);
			this.gdeg[u]++; this.fan[g] = 1;
		} else {
			ea && assert(this.firstInGroup(g) &&
						 u == this.left(this.firstInGroup(g)));
			this.fan[g]++;
		}
		this.gid[e] = g;
		this.feg[g] = this.edgesInGroups.join(this.feg[g],e);
		return e;
	}
	
	/** Delete an edge from the graph.
	 *  @param e is edge to be deleted
	 */
	delete(e) {
		let g = this.group(e);
		let [u,v] = [this.input(e),this.output(e)];
		this.gid[e] = 0; 
		this.deg[u]--; this.deg[v]--; this.fan[g]--;
		this.feg[g] = this.edgesInGroups.delete(e,this.feg[g]);
		if (this.feg[g] == 0) {
			ea && assert(this.fan[g] == 0);
			this.fg[u] = this.groupsAtInputs.delete(g,this.fg[u]);
			this.gdeg[u]--; this.groupIds.swap(g);
		}
		super.delete(e);
	}

	/** Merge two edge groups (used in random graph generation process).
	 *  @param g1 is a group 
	 *  @param g2 is a group at the same input as g1
	 *  to a different edge group
	 *  @returns the group number of the resulting edge group
	 */
	merge(g1, g2) {
		if (g1 == g2 || g2 == 0) return g1;
		if (g1 == 0) return g2;
		let u = this.input(this.firstInGroup(g1));
		ea && assert(u == this.input(this.firstInGroup(g2)));
	
		// update gid of edges in g2, while checking for and removing
		// potential parallel edges
		this.vlist.clear();
		for (let e = this.firstInGroup(g1); e; e = this.nextInGroup(g1,e))
			this.vlist.enq(this.output(e));
		let enext;
		for (let e = this.firstInGroup(g2); e; e = enext) {
			enext = this.nextInGroup(g2,e);
			let v = this.output(e);
			if (this.vlist.contains(v)) {
				this.delete(e);
			} else {
				this.gid[e] = g1;
			}
		}

		// now combine edge lists and recycle group number g2
		this.feg[g1] = this.edgesInGroups.join(this.feg[g1], this.feg[g2]);
		this.feg[g2] = 0;
		this.fg[u] = this.groupsAtInputs.delete(g2, this.fg[u]);
		this.groupIds.swap(g2);
		this.fan[g1] += this.fan[g2]; this.fan[g2] = 0; this.gdeg[u]--;
		return g1;
	}
	
	/** Sort the groups at a vertex by size (largest to smallest).
	 *  @param u is a vertex
	 */
	sortGroups(u) {
		let vec = new Int32Array(this.groupDegree(u));
		vec[0] = this.firstGroup(u);
		let i = 1;
		while (fg[u] != 0) {
			vec[i++] = fg[u]; fg[u] = groupsAtInputs.delete(fg[u],fg[u]);
		}
		sort(vec, (g1,g2) => this.fanout(g2) - this.fanout(g1));
		fg[u] = vec[0];
		for (let i = 1; i < groupDegree(u); i++)
			fg[u] = groupsAtInputs.join(fg[u], vec[i]);
	}

	/** Find an edge in a group.
	 *  @param v is an output
	 *  @param g is a group
	 *  @return edge in g with v as output or 0
	 */
	findEdgeInGroup(v,g) {
		for (let e = this.firstInGroup(g); e; e = this.nextInGroup(g, e))
			if (this.output(e) == v) return e;
		return 0;
	}

	/** Compare another group graph to this one.
	 *  @param other is a GroupGraph object or a string representing one.
	 *  @return true if other is equal to this; that is, it has the same
	 *  underlying graph, inputs, outputs and groups
	 *
	 *  bug notice: requires matching group ids
	 */
	equals(other) {
        other = super.equals(other);
        if (typeof other == 'boolean') return other;

		if (this.ni != other.ni || this.grange != other.grange ||
			this.groupIds.length(1) != other.groupIds.length(1))
			 return false;

		this.vlist.clear();
		for (let g = this.firstGroup(); g; g = this.nextGroup(g)) {
			if (other.groupIds.in(g,2) || this.fanout(g) != other.fanout(g) ||
				this.left(this.firstInGroup(g)) !=
				other.left(other.firstInGroup(g))) {
				return false;
			}
			this.vlist.clear();
			for (let e = this.firstInGroup(g); e; e = this.nextInGroup(g,e))
				this.vlist.enq(this.output(e));
			for (let e = other.firstInGroup(g); e; e = other.nextInGroup(g,e))
				if (!this.vlist.contains(other.output(e))) return false;
		}
		return other;
	}

	/** Construct a string representation of the GroupGraph object.
	 *  @param fmt is an integer representing format flags
	 *
	 *    fmt&1 shows each input's groups on a separate line
	 *    fmt&2 shows all inputs, including those with no edges
	 *    fmt&4 causes group identifiers to be shown
	 */
	toString(fmt=0) {
		let s = '';
		for (let u = 1; u <= this.ni; u++) {
			if (!(fmt&2) && !this.firstAt(u)) continue;
			if (!(fmt&1) && s) s += ' ';
			s += this.x2s(u) + '[';
			for (let g = this.firstGroupAt(u); g; g = this.nextGroupAt(u,g)) {
				if (g != this.firstGroupAt(u)) s += ' ';
				s += this.group2string(g);
				if (fmt&4) s += this.g2s(g);
			}
			s += ']';
			if (fmt&1) s += '\n';
		}
		return (fmt&1 ? '{\n' + s + '}\n': '{' + s + '}');
	}

	/** Return a string listing the outputs in a given group. */
	group2string(g) {
		let s = '('; 
		for (let e = this.firstInGroup(g); e; e = this.nextInGroup(g,e)) {
			if (e != this.firstInGroup(g)) s += ' ';
			s += this.x2s(this.output(e));
		}
		s += ')';
		return s;
	}

	/** Return index value for a group or an upper case letter. */
	g2s(g) {
		return (this.groupRange <= 26 ?
				'-ABCDEFGHIJKLMNOPQRSTUVWXYZ'[g] : ''+g);
	}

	/** Initialize graph from a string representation.
	 *  @param s is a string representing a graph
	 *  @return true on success, else false
	 */
	fromString(s) {
		let n = 1; let ni = 1;
		// function to parse a vertex
		let nextVertex = (sc => {
						let u = sc.nextIndex();
						n = Math.max(n,u);
						return u > 0 ? u : 0;
					});
		// function to parse an edge group
		let triples = []; let gid = 0; let groupIds = new Set(); let gmax = 0;
		let nextGroup = ((u,sc) => {
						if (!sc.verify('(')) return false
						while (groupIds.has(++gid)) {}
						let i0 = triples.length;
						while (!sc.verify(')')) {
							let v = nextVertex(sc);
							if (!v) return false;
							triples.push([u,v,gid]);
						}
						let g = sc.nextIndexUpper();
						if (g > 0) {
							if (groupIds.has(g)) return false;
							// fill in group identifiers
							for (let i = i0; i < triples.length; i++) {
								triples[i][2] = g;
							}
							gid--;
						} else {
							g = gid;
						}
						groupIds.add(g);
						gmax = Math.max(g,gmax);
						return true;
					});

		// scan the input
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		while (!sc.verify('}')) {
			let u = nextVertex(sc);
			if (!u) return false;
			ni = Math.max(ni,u);
			if (sc.verify('[')) {
				while (!sc.verify(']')) {
					if (!nextGroup(u,sc)) return false;
				}
			}
		}

		// configure group graph
		let erange = Math.max(1,triples.length);
		let grange = Math.max(gmax,1);
		if (n == this.n && erange == this.erange &&
			ni == this.ni && grange == this.groupRange)
			this.clear();
		else
			this.reset(n, erange, ni, grange);

		// add edges
		for (let i = 0; i < triples.length; i++) {
			let [u,v,g] = triples[i];
			if (v <= ni) return false;
			this.join(u,v,g);
		}
		return true;
	}
}
