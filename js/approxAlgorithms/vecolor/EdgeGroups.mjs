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

/** This class maintains a set of edge groups on, an underlying  bipartite
 *  graph. Groups are centered on inputs, and each output has at most one
 *  edge in each group. Edge-group coloring algorithms color the edges
 *  in a group graph, with edges in distinct groups at each input having
 *  disjoint color sets.
 *
 *  To simplify representation, inputs are assigned smaller index values
 *  than outputs; with vertices 1..n_i, pre-defined as inputs.
 */
export default class EdgeGroups extends Top {
	Graph;          // underlying bipartite graph
	N_i;            // number of inputs

    Group;          // Group[e] is group identifier for e
    Fanout;         // Fanout[g]=# of edges in group g

    GroupIds;       // ListPair that separates in-use group numbers from unused
    EdgesInGroups;  // ListSet that partitions edges into their groups
    FirstInGroup;   // firstInGroup[g] is first edge in group g
    GroupsAtInputs; // ListSet dividing groups among inputs
    FirstGroup;     // FirstGroup[u] is first group at input u

	vlist;          // temporary list of vertices

	/** Constructor for EdgeGroups object.
	 *  @param gg is graph on which edge groups are defined; assumed bipartite
	 *  with all inputs coming before outputs; if gg is omitted, user is
	 *  expected to define it using fromString
	 *  @param n_g is the maximum number of groups that can be accommodated
	 */
	constructor(gg, n_g) {
		super(n_g);
		if (!gg) return;
		this.Graph = gg;

		let ni = 0;
		for (let e = this.graph.first(); e; e = this.graph.next(e)) {
			ni = Math.max(ni,this.input(e));
		}
		this.N_i = ni;

		this.Group = new Int32Array(this.graph.edgeRange+1);
		this.Fanout = new Int32Array(this.n_g+1);

		this.GroupIds = new ListPair(this.n_g);
		this.EdgesInGroups = new ListSet(this.graph.edgeRange);
		this.FirstInGroup = new Int32Array(this.n_g+1);
		this.GroupsAtInputs = new ListSet(this.n_g);
		this.FirstGroup = new Int32Array(this.n_i+1);

		this.vlist = new List(this.Graph.n);
	}

	/** Assign new value to this from another EdgeGroups object. 
	 *  @param that is an EdgeGroups object to be assigned to this
	 *  @param relaxed is a boolean; when false, this.n is adjusted
	 *  to exactly match that.n; when true, this.n is only adjusted
	 *  if it is less than that.n; relaxed assignments are used to
	 *  implement the expand method
	assign(that, relaxed=false) {
		super.assign(that, relaxed);

		this.N_i = that.N_i;
		this.Graph.assign(that.Graph);
		this.Group = that.Group.slice(0);
		this.Fanout = that.Fanout.slice(0);
		this.EdgesInGroups.assign(that.EdgesInGroups);
		this.FirstInGroup = that.FirstInGroup.slice(0);
		this.GroupsAtInputs.assign(that.GroupsAtInputs);
		this.FirstGroup = that.FirstGroup.slice(0);
		this.vlist.assign(that.vlist);
	}
	 */

	/** Assign a new value to this, by transferring contents of another object.
	 *  @param that is a list whose contents are to be transferred to this
	xfer(that) {
		super.xfer(that);
		this.N_i = that.N_i;
		this.Graph = that.Graph;
		this.Group = that.Group;
		this.Fanout = that.Fanout;
		this.EdgesInGroups = that.EdgesInGroups;
		this.FirstInGroup = that.FirstInGroup;
		this.GroupsAtInputs = that.GroupsAtInputs;
		this.FirstGroup = that.FirstGroup;
		this.vlist = that.vlist;
	}
	 */

	clear() {
		this.Group.fill(0);
		this.Fanout.fill(0);

		this.GroupIds.clear();
		this.EdgesInGroups.clear(); this.FirstInGroup.fill(0);
		this.GroupsAtInputs.clear(); this.FirstGroup.fill(0);

		this.vlist.clear();
	}

	get n_i() { return this.N_i; }

	get n_o() { return this.graph.n - this.N_i; }

	get n_g() { return this.n; }

	get graph() { return this.Graph; }

	/** Assign one GroupGraph to another by copying its contents.
	 *  @param that is another graph whose contents is copied to this one
	 */
	assign(that, relaxed=false) {
		super.assign(that);
        ea && assert(that != this &&
                	 this.constructor.name == that.constructor.name,
					 'Top:assign: self-assignment or mismatched types');

		if (this.n == that.n && this.graph == that.graph)
			this.clear();
		else
			this.reset(that.graph, that.n);

		for (let e = that.graph.first(); e; e = that.graph.next(e)) {
			this.add(e, that.group(e));
		}
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param that is another graph whose contents is transferred to this one
	 */
	xfer(that) {
        ea && assert(that != this &&
                	 this.constructor.name == that.constructor.name,
					 'Top:xfer: self-assignment or mismatched types');
		this.Graph = that.graph; this.n = that.n; this.N_i = that.n_i;

		this.Fanout = that.Fanout;
		this.Group = that.Group;
		this.GroupIds = that.GroupIds;
		this.EdgesInGroups = that.EdgesInGroups;
		this.FirstInGroup = that.FirstInGroup;
		this.GroupsAtInputs = that.GroupsAtInputs;
		this.FirstGroup = that.FirstGroup;
		this.vlist = that.vlist;

		that.Fanout = null; that.Group = null;
		that.GroupIds = that.EdgesInGroups = that.GroupsAtInputs = null;
		that.FirstInGroup = that.FirstGroup = that.vlist = null;
	}

	group(e) { return this.Group[e]; };
	input(e) { return this.graph.left(e); }
	output(e) { return this.graph.right(e); }

	fanout(g) { return this.Fanout[g]; }
	hub(g) {
		let e = this.FirstInGroup[g];
		return e ? this.input(e) : 0;
	}

	groupCount(u=0) {
		if (!u) return this.GroupIds.length(1);
		let cnt = 0;
		for (let g = this.firstGroupAt(u); g; g = this.nextGroupAt(u,g))
			cnt++;
		return cnt;
	}

	firstGroup() { return this.GroupIds.first(1); }
	nextGroup(g) { return this.GroupIds.next(g,1); }

	firstGroupAt(u) { return this.FirstGroup[u]; }
	nextGroupAt(u,g) { return this.GroupsAtInputs.next(g); }

	firstInGroup(g) { return this.FirstInGroup[g]; }
	nextInGroup(g,e) { return this.EdgesInGroups.next(e); }

	/** Assign an edge to an edge group.
	 *  @param e is an edge not currently assigned to a group
	 *  @param g is a group to assign e to or 0, to assign e
	 *  to any currently unused group id.
	 *  @return the group id that e is assigned to
	 */
	add(e, g=0) {
		ea && assert(this.Group[e] == 0);
		if (g == 0 || this.GroupIds.in(g,2)) {
			// allocate group and add edge to it
			if (g == 0) g = this.GroupIds.first(2);
			ea && assert(this.Group[e] == 0 && this.FirstInGroup[g] == 0);
			this.GroupIds.swap(g);
			this.Group[e] = g; this.Fanout[g] = 1; this.FirstInGroup[g] = e;
			let u = this.input(e);
			this.FirstGroup[u] =
				this.GroupsAtInputs.join(this.FirstGroup[u],g);
		} else {
			// add edge to an existing group
			ea && assert(this.firstInGroup(g));
			let u = this.hub(g);
			ea && assert(u == this.input(e),
				this.graph.x2s(u) + ' ' + this.graph.e2s(e) + ' ' +
				this.graph.e2s(this.FirstInGroup[g]) + ' ' + this.n_i);
			this.Group[e] = g;
			this.FirstInGroup[g] =
				this.EdgesInGroups.join(this.FirstInGroup[g],e);
			this.Fanout[g]++;
		}
		return g;
	}

	/** Delete an edge from its group.
	 *  @param e is an edge in a group
	 */
	delete(e) {
		let g = this.Group[e];
		this.Group[e] = 0; this.Fanout[g]--;
		this.FirstInGroup[g] =
				this.EdgesInGroups.delete(e, this.FirstInGroup[g]);
		if (this.FirstInGroup[g] == 0) {
			let u = this.input(e);
			this.FirstGroup[u] =
				this.GroupsAtInputs.delete(g, this.FirstGroup[u]);
			this.GroupIds.swap(g);
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
	
		// update Group of edges in g2, while checking for and removing
		// potential parallel edges
		this.vlist.clear();
		for (let e = this.firstInGroup(g1); e; e = this.nextInGroup(g1,e))
			this.vlist.enq(this.output(e));

		for (let e = this.firstInGroup(g2); e; e = this.firstInGroup(g2)) {
			this.delete(e);  // removes e from g2
			if (this.vlist.contains(this.output(e))) {
				this.graph.delete(e);  // no parallel edges within groups
			} else {
				this.add(e,g1);
			}
		}
		return g1;
	}
	
	/** Sort the groups at a vertex by size (largest to smallest).
	 *  @param u is a vertex
	 */
	sortGroups(u) {
		let vec = new Int32Array(this.groupCount(u));
		let i = 0;
		while (this.FirstGroup[u]) {
			vec[i++] = this.FirstGroup[u];
			this.FirstGroup[u] =
				this.GroupsAtInputs.delete(this.FirstGroup[u],
											this.FirstGroup[u]);
		}
		vec.sort((g1,g2) => this.fanout(g2) - this.fanout(g1));
		while (i > 0) {
			this.FirstGroup[u] =
				this.GroupsAtInputs.join(vec[--i], this.FirstGroup[u]);
		}
	}
	
	/** Sort all groups by fanout (largest to smallest). */
	sortAllGroups() {
		let vec = new Int32Array(this.GroupIds.length(1));
		let i = 0;
		for (let g = this.GroupIds.first(1); g; g = this.GroupIds.first(1)) {
			vec[i++] = g; this.GroupIds.swap(g);
		}
		vec.sort((g1,g2) => this.fanout(g2) - this.fanout(g1));
		for (i = 0; i < vec.length; i++) {
			this.GroupIds.swap(vec[i]);
		}
	}

	/** Find an edge in a group.
	 *  @param v is an output
	 *  @param g is a group
	 *  @return edge in g with v as output or 0
	 */
	findEdge(v,g) {
		for (let e = this.firstInGroup(g); e; e = this.nextInGroup(g, e)) {
			if (this.output(e) == v) return e;
		}
		return 0;
	}

	/** Compare another EdgeGroups object to this one.
	 *  @param that is a EdgeGroups object or a string representing one.
	 *  @return true if that is equal to this; that is, it has the same
	 *  underlying graph, inputs, outputs and groups
	 *
	 *  notice: equality requires same graph object in both and
	 * 	        matching group ids
	 */
	equals(that) {
        that = super.equals(that, [this.gg, this.n_g]);
        if (typeof that == 'boolean') return that;

		if (!this.graph.equals(that.graph) || 
			this.GroupIds.length(1) != that.GroupIds.length(1))
			 return false;

		this.vlist.clear();
		for (let g = this.firstGroup(); g; g = this.nextGroup(g)) {
			if (that.GroupIds.in(g,2) || this.fanout(g) != that.fanout(g) ||
				this.hub(g) != that.hub(g)) {
				return false;
			}
			this.vlist.clear();
			for (let e = this.firstInGroup(g); e; e = this.nextInGroup(g,e))
				this.vlist.enq(this.output(e));
			for (let e = that.firstInGroup(g); e; e = that.nextInGroup(g,e))
				if (!this.vlist.contains(that.output(e))) return false;
		}
		return that;
	}

	/** Construct a string representation of the EdgeGroups object.
	 *  @param fmt is an integer representing format flags
	 *    fmt&1 shows each input's groups on a separate line
	 *    fmt&2 shows all inputs, including those with no groups
	 *    fmt&4 causes group identifiers to be shown
	 *  @param gxs is an optional function; gxs(g) is expected to
	 *  return a string that extends the representation of group g 
	 */
	toString(fmt=0, gxs=0) {
		let s = '';
		for (let u = 1; u <= this.n_i; u++) {
			if (!(fmt&2) && !this.graph.firstAt(u)) continue;
			if (!(fmt&1) && s) s += ' ';
			s += this.graph.x2s(u) + '[';
			for (let g = this.firstGroupAt(u); g; g = this.nextGroupAt(u,g)) {
				if (g != this.firstGroupAt(u)) s += ' ';
				s += this.group2string(g);
				if (fmt&4) s += this.g2s(g);
				if (gxs) s += gxs(g);
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
			s += this.graph.x2s(this.output(e));
		}
		s += ')';
		return s;
	}

	/** Return index value for a group or an upper case letter. */
	g2s(g) {
		return (this.n <= 26 ?
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
		let triples = []; let group = 0; let groupIds = new Set(); let n_g = 0;
		let nextGroup = ((u,sc) => {
						if (!sc.verify('(')) return false
						while (groupIds.has(++group)) {}
						let i0 = triples.length;
						while (!sc.verify(')')) {
							let v = nextVertex(sc);
							if (!v) return false;
							triples.push([u,v,group]);
						}
						let g = sc.nextIndexExt(0,0);
						if (g > 0) {
							if (groupIds.has(g)) return false;
							// fill in group identifiers
							for (let i = i0; i < triples.length; i++) {
								triples[i][2] = g;
							}
							group--;
						} else {
							g = group;
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

		this.Graph = new Graph(n, Math.max(1,triples.length));

		// add edges to graph before configuring object
		let pairs = []
		for (let [u,v,g] of triples) pairs.push([this.graph.join(u,v),g]);

		if (n_i == this.n_i && n_g == this.n_g &&
			this.Group.length == this.erange+1)
			this.clear();
		else {
			this.reset(this.graph, n_g);
		}

		// add edges
		for (let [e,g] of pairs) {
			this.add(e,g);
		}
		return true;
	}
}
