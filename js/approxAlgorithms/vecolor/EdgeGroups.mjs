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
	_graph;          // underlying bipartite graph
	_ni;             // number of inputs

    _group;          // _group[e] is group identifier for e
    _fanout;         // _fanout[g]=# of edges in group g

    _groupIds;       // ListPair that separates in-use group numbers from unused
    _edgesInGroups;  // ListSet that partitions edges into their groups
    _firstInGroup;   // _firstInGroup[g] is first edge in group g
    _groupsAtInputs; // ListSet dividing groups among inputs
    _firstGroup;     // _firstGroup[u] is first group at input u

	_vlist;          // temporary list of vertices

	/** Constructor for EdgeGroups object.
	 *  @param gg is graph on which edge groups are defined; assumed bipartite
	 *  with all inputs coming before outputs; if gg is omitted, user is
	 *  expected to define it using fromString
	 *  @param ng is the maximum number of groups that can be accommodated
	 */
	constructor(gg, n_g) {
		super(n_g);
		if (!gg) return;
		this._graph = gg;

		let n_i = 0;
		for (let e = this.graph.first(); e; e = this.graph.next(e)) {
			n_i = Math.max(n_i,this.input(e));
		}
		this._ni = n_i;

		this._group = new Int32Array(this._graph.edgeRange+1);
		this._fanout = new Int32Array(this.n_g+1);

		this._groupIds = new ListPair(this.n_g);
		this._edgesInGroups = new ListSet(this._graph.edgeRange);
		this._firstInGroup = new Int32Array(this.n_g+1);
		this._groupsAtInputs = new ListSet(this.n_g);
		this._firstGroup = new Int32Array(this.n_i+1);

		this._vlist = new List(this._graph.n);
	}

	clear() {
		this._group.fill(0);
		this._fanout.fill(0);

		this._groupIds.clear();
		this._edgesInGroups.clear(); this._firstInGroup.fill(0);
		this._groupsAtInputs.clear(); this._firstGroup.fill(0);

		this._vlist.clear();
	}

	get n_i() { return this._ni; }

	get n_o() { return this.graph.n - this._ni; }

	get n_g() { return this.n; }

	get graph() { return this._graph; }

	/** Assign one GroupGraph to another by copying its contents.
	 *  @param other is another graph whose contents is copied to this one
	 */
	assign(other, relaxed=false) {
		super.assign(other);
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');

		if (this.n_g == other.n_g && this._graph == other.graph)
			this.clear();
		else
			this.reset(other.n_g, other.graph);

		for (let e = other.graph.first(); e; e = other.graph.next(e)) {
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
		this._graph = other.graph; this._n = other.n_g; this._ni = other.n_i;

		this._fanout = other._fanout;
		this._group = other._group;
		this._groupIds = other._groupIds;
		this._edgesInGroups = other._edgesInGroups;
		this._firstInGroup = other._firstInGroup;
		this._groupsAtInputs = other._groupsAtInputs;
		this._firstGroup = other._firstGroup;
		this._vlist = other._vlist;

		other._fanout = null; other._group = null;
		other._groupIds = other._edgesInGroups = other._groupsAtInputs = null;
		other._firstInGroup = other._firstGroup = other._vlist = null;
	}

	group(e) { return this._group[e]; };
	input(e) { return this._graph.left(e); }
	output(e) { return this._graph.right(e); }

	fanout(g) { return this._fanout[g]; }
	hub(g) {
		let e = this._firstInGroup[g];
		return e ? this.input(e) : 0;
	}

	groupCount(u=0) {
		if (!u) return this._groupIds.length(1);
		let cnt = 0;
		for (let g = this.firstGroupAt(u); g; g = this.nextGroupAt(u,g))
			cnt++;
		return cnt;
	}

	firstGroup() { return this._groupIds.first(1); }
	nextGroup(g) { return this._groupIds.next(g,1); }

	firstGroupAt(u) { return this._firstGroup[u]; }
	nextGroupAt(u,g) { return this._groupsAtInputs.next(g); }

	firstInGroup(g) { return this._firstInGroup[g]; }
	nextInGroup(g,e) { return this._edgesInGroups.next(e); }

	/** Assign an edge to an edge group.
	 *  @param e is an edge not currently assigned to a group
	 *  @param g is a group to assign e to or 0, to assign e
	 *  to any currently unused group id.
	 *  @return the group id that e is assigned to
	 */
	add(e, g=0) {
		ea && assert(this._group[e] == 0);
		if (g == 0 || this._groupIds.in(g,2)) {
			// allocate group and add edge to it
			if (g == 0) g = this._groupIds.first(2);
			ea && assert(this._group[e] == 0 && this._firstInGroup[g] == 0);
			this._groupIds.swap(g);
			this._group[e] = g; this._fanout[g] = 1; this._firstInGroup[g] = e;
			let u = this.input(e);
			this._firstGroup[u] =
				this._groupsAtInputs.join(this._firstGroup[u],g);
		} else {
			// add edge to an existing group
			ea && assert(this.firstInGroup(g));
			let u = this.hub(g);
			ea && assert(u == this.input(e));
			this._group[e] = g;
			this._firstInGroup[g] =
				this._edgesInGroups.join(this._firstInGroup[g],e);
			this._fanout[g]++;
		}
		return g;
	}

	/** Delete an edge from its group.
	 *  @param e is an edge in a group
	 */
	delete(e) {
		let g = this._group[e];
		this._group[e] = 0; this._fanout[g]--;
		this._firstInGroup[g] =
				this._edgesInGroups.delete(e, this._firstInGroup[g]);
		if (this._firstInGroup[g] == 0) {
			let u = this.input(e);
			this._firstGroup[u] =
				this._groupsAtInputs.delete(g, this._firstGroup[u]);
			this._groupIds.swap(g);
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
	
		// update _group of edges in g2, while checking for and removing
		// potential parallel edges
		this._vlist.clear();
		for (let e = this.firstInGroup(g1); e; e = this.nextInGroup(g1,e))
			this._vlist.enq(this.output(e));

		for (let e = this.firstInGroup(g2); e; e = this.firstInGroup(g2)) {
			this.delete(e);  // removes e from g2
			if (this._vlist.contains(this.output(e))) {
				this._graph.delete(e);  // no parallel edges within groups
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
		while (this._firstGroup[u]) {
			vec[i++] = this._firstGroup[u];
			this._firstGroup[u] =
				this._groupsAtInputs.delete(this._firstGroup[u],
											this._firstGroup[u]);
		}
		vec.sort((g1,g2) => this.fanout(g2) - this.fanout(g1));
		while (i > 0) {
			this._firstGroup[u] =
				this._groupsAtInputs.join(vec[--i], this._firstGroup[u]);
		}
	}
	
	/** Sort all groups by size (largest to smallest). */
	sortAllGroups() {
		let vec = new Int32Array(this._groupIds.length(1));
		let i = 0;
		for (let g = this._groupIds.first(1); g; g = this._groupIds.first(1)) {
			vec[i++] = g; this._groupIds.swap(g);
		}
		vec.sort((g1,g2) => this.fanout(g1) - this.fanout(g2));
		for (i = 0; i < vec.length; i++) {
			this._groupIds.swap(vec[i]);
		}
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

		if (!this._graph.equals(other.graph) || this.n_g != other.n_g ||
			this._groupIds.length(1) != other._groupIds.length(1))
			 return false;

		this._vlist.clear();
		for (let g = this.firstGroup(); g; g = this.nextGroup(g)) {
			if (other._groupIds.in(g,2) || this.fanout(g) != other.fanout(g) ||
				this.hub(g) != other.hub(g)) {
				return false;
			}
			this._vlist.clear();
			for (let e = this.firstInGroup(g); e; e = this.nextInGroup(g,e))
				this._vlist.enq(this.output(e));
			for (let e = other.firstInGroup(g); e; e = other.nextInGroup(g,e))
				if (!this._vlist.contains(other.output(e))) return false;
		}
		return other;
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
						let g = sc.nextIndexUpper();
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

		// configure graph
		let erange = Math.max(1,triples.length);
		if (!this._graph)
			this._graph = new Graph(n,erange);
		else if (n == this.graph.n && erange == this.graph.edgeRange)
			this.graph.clear();
		else
			this.graph.reset(n, erange);

		// add edges to graph before configuring object
		let pairs = []
		for (let [u,v,g] of triples) pairs.push([this.graph.join(u,v),g]);

		if (n_i == this.n_i && n_g == this.n_g &&
			this._group.length == this.erange+1)
			this.clear();
		else
			this.reset(this.graph, n_g);

		// add edges
		for (let [e,g] of pairs) {
			this.add(e,g);
		}
		return true;
	}
}
