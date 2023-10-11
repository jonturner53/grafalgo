/** @file EdgeGroups.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Top from '../../dataStructures/Top.mjs';
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
 *  than outputs; with vertices 1..n_i, pre-defined as inputs.
 */
export default class EdgeGroups extends Top {
	gg;              // underlying "group graph"
	_ni;             // number of inputs

    gid;             // gid[e] is group identifier for e
    fan;             // fan[g]=# of edges in group g

    groupIds;        // ListPair that separates in-use group numbers from unused
    edgesInGroups;   // ListSet that partitions edges into their groups
    feg;             // feg[g] is first edge in group g
    groupsAtInputs;  // ListSet dividing groups among inputs
    fg;              // fg[u] is first group at input u

	vlist;           // temporary list of vertices

	/** Constructor for EdgeGroups object.
	 *  @param gg is graph on which edge groups are defined; assumed bipartite
	 *  with all inputs coming before outputs; if gg is omitted, user is
	 *  expected to define it using fromString
	 *  @param ng is the maximum number of groups that can be accommodated
	 */
	constructor(gg, n_g) {
		super(n_g);
		if (!gg) return;
	
		this.gg = gg;

		let n_i = 0;
		for (let e = gg.first(); e; e = gg.next(e)) {
			n_i = Math.max(n_i,this.input(e));
		}
		this._ni = n_i;

		this.gid = new Int32Array(this.gg.edgeRange+1);
		this.fan = new Int32Array(this.n_g+1);

		this.groupIds = new ListPair(this.n_g);
		this.edgesInGroups = new ListSet(this.gg.edgeRange);
		this.feg = new Int32Array(this.n_g+1);
		this.groupsAtInputs = new ListSet(this.n_g);
		this.fg = new Int32Array(this.n_i+1);

		this.vlist = new List(this.gg.n);
	}

	clear() {
		this.gid.fill(0);
		this.fan.fill(0);

		this.groupIds.clear();
		this.edgesInGroups.clear(); this.feg.fill(0);
		this.groupsAtInputs.clear(); this.fg.fill(0);

		this.vlist.clear();
	}

	get n_i() { return this._ni; }

	get n_g() { return this.n; }

	get graph() { return this.gg; }

	/** Assign one GroupGraph to another by copying its contents.
	 *  @param other is another graph whose contents is copied to this one
	 */
	assign(other, relaxed=false) {
		super.assign(other);
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');

		if (this.n_g == other.n_g && this.gg == other.gg)
			this.clear();
		else
			this.reset(other.n_g, other.gg);

		for (let e = other.gg.first(); e; e = other.gg.next(e)) {
			this.add(e, other.group(e));
		}
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param other is another graph whose contents is transferred to this one
	 */
	xfer(other) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:xfer: self-assignment or mismatched types');
		this.gg = other.gg; this._n = other.n_g; this._ni = other.n_i;

		this.fan = other.fan;
		this.gid = other.gid;
		this.groupIds = other.groupIds;
		this.edgesInGroups = other.edgesInGroups; this.feg = other.feg;
		this.groupsAtInputs = other.groupsAtInputs; this.fg = other.fg;
		this.vlist = other.vlist;

		other.fan = null; other.gid = null;
		other.groupIds = other.edgesInGroups = other.groupsAtInputs = null;
		other.feg = other.fg = other.vlist = null;
	}

	group(e) { return this.gid[e]; };
	input(e) { return this.gg.left(e); }
	output(e) { return this.gg.right(e); }

	fanout(g) { return this.fan[g]; }
	hub(g) {
		let e = this.feg[g];
		return e ? this.input(e) : 0;
	}

	groupCount() { return this.groupIds.length(1); }

	firstGroup() { return this.groupIds.first(1); }
	nextGroup(g) { return this.groupIds.next(g,1); }

	firstGroupAt(u) { return this.fg[u]; }
	nextGroupAt(u,g) { return this.groupsAtInputs.next(g); }

	firstInGroup(g) { return this.feg[g]; }
	nextInGroup(g,e) { return this.edgesInGroups.next(e); }

	/** Assign an edge to an edge group.
	 *  @param e is an edge not currently assigned to a group
	 *  @param g is a group to assign e to or 0, to assign e
	 *  to any currently unused group id.
	 *  @return the group id that e is assigned to
	 */
	add(e, g=0) {
		ea && assert(this.gid[e] == 0);
		if (g == 0 || this.groupIds.in(g,2)) {
			// allocate group and add edge to it
			if (g == 0) g = this.groupIds.first(2);
			ea && assert(this.gid[e] == 0 && this.feg[g] == 0);
			this.groupIds.swap(g);
			this.gid[e] = g; this.fan[g] = 1; this.feg[g] = e;
			let u = this.input(e);
			this.fg[u] = this.groupsAtInputs.join(this.fg[u],g);
		} else {
			// add edge to an existing group
			ea && assert(this.firstInGroup(g));
			let u = this.hub(g);
			ea && assert(u == this.input(e));
			this.gid[e] = g;
			this.feg[g] = this.edgesInGroups.join(this.feg[g],e);
			this.fan[g]++;
		}
		return g;
	}

	/** Delete an edge from its group.
	 *  @param e is an edge in a group
	 */
	delete(e) {
		let g = this.gid[e];
		this.gid[e] = 0; this.fan[g]--;
		this.feg[g] = this.edgesInGroups.delete(e, this.feg[g]);
		if (this.feg[g] == 0) {
			let u = this.input(e);
			this.fg[u] = this.groupsAtInputs.delete(g, this.fg[u]);
			this.groupsIds.swap(g);
		}
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
		let u = this.hub(g1);
		ea && assert(u == this.hub(g2));
	
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
				this.delete(e); this.gg.delete(e);
			} else {
				this.gid[e] = g1;
			}
		}

		// now combine edge lists and recycle group number g2
		this.feg[g1] = this.edgesInGroups.join(this.feg[g1], this.feg[g2]);
		this.feg[g2] = 0;
		this.fg[u] = this.groupsAtInputs.delete(g2, this.fg[u]);
		this.groupIds.swap(g2);
		this.fan[g1] += this.fan[g2]; this.fan[g2] = 0;
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
		fg[u] = vec[--i];
		while (i > 0)
			fg[u] = groupsAtInputs.join(vec[i--], fg[u]);
	}

	/** Find an edge in a group.
	 *  @param v is an output
	 *  @param g is a group
	 *  @return edge in g with v as output or 0
	 */
	findEdge(v,g) {
		for (let e = this.firstInGroup(g); e; e = this.nextInGroup(g, e))
			if (this.output(e) == v) return e;
		return 0;
	}

	/** Compare another EdgeGroups object to this one.
	 *  @param other is a EdgeGroups object or a string representing one.
	 *  @return true if other is equal to this; that is, it has the same
	 *  underlying graph, inputs, outputs and groups
	 *
	 *  notice: equality requires same graph object in both and
	 * 	        matching group ids
	 */
	equals(other) {
        other = super.equals(other);
        if (typeof other == 'boolean') return other;

		if (!this.gg.equals(other.gg) || this.n_g != other.n_g ||
			this.groupIds.length(1) != other.groupIds.length(1))
			 return false;

		this.vlist.clear();
		for (let g = this.firstGroup(); g; g = this.nextGroup(g)) {
			if (other.groupIds.in(g,2) || this.fanout(g) != other.fanout(g) ||
				this.hub(g) != other.hub(g)) {
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

	/** Construct a string representation of the EdgeGroups object.
	 *  @param fmt is an integer representing format flags
	 *
	 *    fmt&1 shows each input's groups on a separate line
	 *    fmt&2 shows all inputs, including those with no groups
	 *    fmt&4 causes group identifiers to be shown
	 */
	toString(fmt=0) {
		let s = '';
		for (let u = 1; u <= this.n_i; u++) {
			if (!(fmt&2) && !this.gg.firstAt(u)) continue;
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
		return (this.n_g <= 26 ?
				'-ABCDEFGHIJKLMNOPQRSTUVWXYZ'[g] : ''+g);
	}

	/** Initialize object from a string representation.
	 *  Because string representing EdgeGroups contains all the information
	 *  needed to define its associated graph, the graph is constructed by
	 *  fromString.
	 *  @param s is a string representing a graph
	 *  @return true on success, else false
	 */
	fromString(s) {
		let n = 1; let n_i = 1;
		// function to parse a vertex
		let nextVertex = (sc => {
						let u = sc.nextIndex();
						n = Math.max(n,u);
						return u > 0 ? u : 0;
					});
		// function to parse an edge group
		let triples = []; let gid = 0; let groupIds = new Set(); let n_g = 0;
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
						n_g = Math.max(g,n_g);
						return true;
					});

		// scan the input
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		while (!sc.verify('}')) {
			let u = nextVertex(sc);
			if (!u) return false;
			n_i = Math.max(n_i,u);
			if (sc.verify('[')) {
				while (!sc.verify(']')) {
					if (!nextGroup(u,sc)) return false;
				}
			}
		}

		// check that inputs precede outputs
		for (let [u,v,g] of triples)
			if (v <= n_i) return false;

		// configure graph
		let erange = Math.max(1,triples.length);
		if (!this.gg)
			this.gg = new Graph(n,erange);
		else if (n == this.gg.n && erange == this.gg.edgeRange)
			this.gg.clear();
		else
			this.gg.reset(n, erange);

		// add edges to gg before configuring object
		let pairs = []
		for (let [u,v,g] of triples) pairs.push([this.gg.join(u,v),g]);

		if (n_i == this.n_i && n_g == this.n_g &&
			this.gid.length == this.erange+1)
			this.clear();
		else
			this.reset(this.gg, n_g);

		// add edges
		for (let [e,g] of pairs) {
			this.add(e,g);
		}
		return true;
	}
}
