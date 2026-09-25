/** @file FanGraph.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled } from '../../common/Assert.mjs';
import Top from '../../dataStructures/Top.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Scanner from '../../dataStructures/basic/Scanner.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { scramble } from '../../common/Random.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';

let ae;

/** This class extends the Graph class by adding edge groups called "fans"
 *  and color palettes. FanGraphs are bipartite and each fan has an input
 *  as its "hub".
 *  Fan coloring algorithms color the edges in a FanGraph, with
 *  edges in distinct fans at each input having disjoint color sets.
 *
 *  To simplify representation, inputs are assigned smaller index values
 *  than outputs; with vertices 1..ni, pre-defined as inputs.
 */
export default class FanGraph extends Graph {
	ae = assertEnabled();

	fans_;        // ListPair identifying active fan numbers
    fan_edges;    // ListSet that partitions edges into their fans
	input_fans;   // ListSet partitioning fans among inputs

	palettes_;      // array of ListSets where each partitions colors
					// among fans at an input
	palette_size;   // palette_size[g] is number of colors in g's palette
	first_color;    // array identifying first color in each fan's palette

	color_edges;    // ListSet of edges partitioned by color (including 0)
	usage_;         // usage_[c][u] is number of times c is used at u
	owner_;         // owner_[c][u] is fan that owns color c at input u
	unused_;        // unused_[u] is first unused color at input u

	num_colored;	// number of edges colored
	top_color;		// highest color number assigned to an edge

	vlist_;			// temporary list of vertices

	/** Constructor for FanGraph object.
	 *  @param ni is the number of inputs
	 *  @param no is the number of outputs
	 *  @param nf is the max number of fans
	 *  @param crange is largest color number available for coloring the graph
	 *  @param erange is the maximum number of edges in the graph
	 *  @param tints is a flag that enables fan tints
	 */
	constructor(ni, no, nf, erange, crange, tints=0) {
		super(ni+no, erange); this.setBipartition(ni);
		this.addEdgeProperty('color_', 0);
		this.addEdgeProperty('fan', 0);

		this.fans_ = new ListPair(nf);
		this.fans_.addProperty('fanout',0);
		if (tints) {
			this.fans_.addProperty('tint',0);
			Object.defineProperty(this, 'tint',
				{ value: function(e,v) { return this.fans_['tint'](e,v); }});
			Object.defineProperty(this, 'reset_tint',
				{ value: function() { this.fans_['reset_tint'](); }});
		}
		this.fan_edges = new ListSet(this.edgeRange, nf);
		this.input_fans = new ListSet(nf, ni);

		this.palettes_ = new Array(ni+1);
		this.palette_size = new Int32Array(nf+1).fill(0);
		this.first_color = new Int32Array(nf+1);
		this.unused_ = new Int32Array(this.n+1);
		for (let u = 1; u <= ni; u++) {
			this.palettes_[u] = new ListSet(crange);
			for (let c = 2; c <= crange; c++)
				this.palettes_[u].join(1,c);
				//this.unused_[u] = this.palettes_[u].join(this.unused_[u],c);
			this.unused_[u] = 1;
		}
		this.usage_ = new Array(crange+1);
		this.owner_ = new Array(crange+1);
		for (let c = 1; c <= crange; c++) {
			this.usage_[c] = new Int32Array(this.n+1);
			this.owner_[c] = new Int32Array(ni+1);
		}
		this.color_edges = new ListSet(this.edgeRange, crange);
		this.num_colored = this.top_color = 0;

		this.vlist_ = new List(this.n);
	}

	get ni() { return this.inputCount(); }

	get no() { return this.outputCount(); }

	get nf() { return this.fans_.n; }

	get crange() { return this.usage_.length-1; }
	get cmax() { return this.top_color; }

	firstFan() { return this.fans_.first(1); }
	nextFan(f) { return this.fans_.next(f,1); }

	firstFanAt(u) { return this.input_fans.first(u); }
	nextFanAt(u,f) { return this.input_fans.next(f); }

	firstEdgeIn(f) { return this.fan_edges.first(f); }
	nextEdgeIn(f,e) { return this.fan_edges.next(e); }

	/** Get the first color in a fan's palette.
	 *  @param f is a valid fan defined by this
	 *  @return the first color used by f (there must be one)
	 */
	firstColor(f) { return this.first_color[f]; };

	/** Get the next color in a fan's palette.
	 *  @param f is a valid fan
	 *  @param c is a color assigned to f
	 *  @return the color that follows c in f's palette
	 */
	nextColor(f,c) { return this.palettes_[this.hub(f)].next(c); }

	/** Get/set the number of edges in a fan.
	 *  @param f is a fan ; if a second argument is present,
	 *  it becomes the new value of the fanout
	 *  @return the fanout of f
	 */
	fanout(f) { return this.fans_.fanout(...arguments); }

	/** Get the input common to all of the edges in a fan */
	hub(f) {
		let e = this.fan_edges.first(f);
		return e ? this.input(e) : 0;
	}

	fanCount(u=0) {
		if (!u) return this.fans_.length(1);
		let cnt = 0;
		for (let f = this.firstFanAt(u); f; f = this.nextFanAt(u,f))
			cnt++;
		return cnt;
	}

	maxFanCount() {
		let cnt = 0;
		for (let u = 1; u <= this.ni; u++)
			cnt = Math.max(cnt, this.fanCount(u));
		return cnt;
	}

	maxTint() {
		if (!this.tint) return 0;
		let tmax = 0;
		for (let u = 1; u <= this.ni; u++) {
			for (let f = this.firstFanAt(u); f; f = this.nextFanAt(u,f))
				tmax = Math.max(tmax, this.tint(f));
		}
		return tmax;
	}

	/** Assign an edge to a fan.
	 *  @param e is an edge not currently assigned to a fan
	 *  @param f is a fan to assign e to or 0, to assign e
	 *  to any currently unused fan id.
	 *  @return the fan id that e is assigned to
	 */
	add(e, f=0) {
		ae && assert(this.fan(e) == 0);
		if (f == 0 || this.fans_.in(f,2)) {
			// allocate fan and add edge to it
			if (f == 0) f = this.fans_.first(2);
			ae && assert(this.fan(e) == 0 && this.fan_edges.first(f) == 0 &&
												this.fan_edges.singleton(e));
			this.fans_.swap(f);
			this.fan(e,f); this.fanout(f,1);
			this.fan_edges.append(e,f);
			this.input_fans.append(f,this.input(e));
		} else {
			// add edge to an existing fan
			ae && assert(this.fan_edges.first(f));
			let u = this.hub(f);
			ae && assert(u == this.input(e),
				this.x2s(u) + ' ' + this.e2s(e) + ' ' +
				this.e2s(this.fan_edges.first(f)) + ' ' + this.ni);
			this.fan(e,f);
			this.fan_edges.append(e,f);
			this.fanout(f,this.fanout(f)+1);
		}
		return f;
	}

	/** Delete an edge from its fan.
	 *  @param e is an edge in a fan
	 */
	remove(e) {
		let f = this.fan(e);
		this.fan(e, 0); this.fanout(f,this.fanout(f)-1);
		this.fan_edges.remove(e,f);

		if (this.fanout(f) == 0) {
			let u = this.input(e);
			this.input_fans.remove(f, u);
			this.fans_.swap(f);
		}
	}

	/** Merge two fans (used in random graph generation process).
	 *  @param g1 is a fan 
	 *  @param g2 is a fan at the same input as g1
	 *  to a different fan
	 *  @returns the fan number of the resulting fan
	 */
	merge(f1, f2) {
		if (f1 == f2 || f2 == 0) return f1;
		if (f1 == 0) return f2;
		let u = this.hub(f1);
		ae && assert(u == this.hub(f2));
	
		// update fan of edges in f2, while checking for and removing
		// potential parallel edges
		this.vlist_.clear();
		for (let e = this.fan_edges.first(f1); e;
				 e = this.fan_edges.next(e))
			this.vlist_.enq(this.output(e));

		while (this.fan_edges.first(f2)) {
			let e = this.fan_edges.first(f2);
			this.remove(e);  // removes e from f2's list in fan_edges, etc
			if (this.vlist_.contains(this.output(e))) {
				this.delete(e);  // deletes e from graph
								 // no parallel edges in fan
			} else {
				this.add(e,f1);  // adds e to f1's list in fan_edges, etc
			}
		}
		return f1;
	}
	
	/** Sort the fans at a vertex by size (largest to smallest).
	 *  @param u is a vertex
	 */
	sortFans(u) {
		let vec = new Int32Array(this.fanCount(u));
		let i = 0;
		while (this.input_fans.first(u)) {
			vec[i] = this.input_fans.first(u);
			this.input_fans.remove(vec[i++], u);
		}
		vec.sort((f1,f2) => this.fanout(f2) - this.fanout(f1));
		while (i > 0) {
			this.input_fans.append(vec[--i], u);
		}
	}

	/** Reorder the fan list at a specified input.
	 *  @param u is an input; on return the list of fans at u is randomly
	 *  reordered.
	 */
	scrambleFans(u) {
		let vec = new Int32Array(1+this.fanCount(u));
		let i = 1;
		while (this.input_fans.first(u)) {
			vec[i] = this.input_fans.first(u);
			this.input_fans.remove(vec[i++], u);
		}
		scramble(vec);
		while (i > 1) {
			this.input_fans.append(vec[--i], u);
		}
	}
	
	/** Sort all fans by fanout (largest to smallest). */
	sortAllFans(cmp=0) {
		let vec = new Int32Array(this.fans_.length(1));
		let i = 0;
		for (let f = this.fans_.first(1); f; f = this.fans_.first(1)) {
			vec[i++] = f; this.fans_.swap(f);
		}
		if (!cmp) {
			cmp = (f1,f2) => this.fanout(f2) - this.fanout(f1);
		}
		vec.sort(cmp);
		for (i = 0; i < vec.length; i++) {
			this.fans_.swap(vec[i]);
		}
	}

	/** Find an edge in a fan.
	 *  @param v is an output
	 *  @param r is a fan
	 *  @return edge in g with v as output or 0
	 */
	findFanEdge(v,f) {
		for (let e = this.firstEdgeIn(f); e; e = this.nextEdgeIn(f, e)) {
			if (this.output(e) == v) return e;
		}
		return 0;
	 }

	/** Determine if a color is available for use with a specified edge. */
	avail(c,e) {
		if (c == 0) return true;
		let f = this.fan(e);
		let [u,v] = [this.input(e),this.output(e)]
		return this.usage(c,v) == 0 && 
			   (!this.owner(c,u) || this.owner(c,u) == f);
	}

	usage(c,u) { return this.usage_[c][u]; }
	paletteSize(f) { return this.palette_size[f]; }

	/** Get the fan that owns a specified color at an input.
	 *  @param c is a color
	 *  @param u is an input
	 *  @return the fan with hub u that has c in its palette
	 */
	owner(c,u) { return this.owner_[c][u]; }

	/** Bind a color to a fan.
	 *  @param c is a color
	 *  @param f is a fan at some input u; c is assumed to be unbound
	 *  at u; on return it is bound to f
	 */
	bind(c,f) {
		let u = this.hub(f);
		ae && assert(f && c && u && !this.owner(c,u) && !this.usage(c,u),
					 `${f} ${c} ${u} ${this.owner(c,u)} ${this.usage(c,u)}`);
		this.owner_[c][u] = f;
		this.unused_[u] = this.palettes_[u].delete(c, this.unused_[u]);
		this.first_color[f] = this.palettes_[u].join(this.first_color[f], c);
		this.palette_size[f]++;
	}

	/** Release a color from a fan.
	 *  @param c is a color
	 *  @param f is a fan with c in its palette
	 */
	release(c,f) {
		let u = this.hub(f);
		ae && assert(f && c && u && this.owner(c,u) == f);
		this.owner_[c][u] = 0;
		this.first_color[f] = this.palettes_[u].delete(c, this.first_color[f]);
		this.unused_[u] = this.palettes_[u].join(this.unused_[u], c);
		this.palette_size[f]--;
	}

	/** Get/set an edge color.
	 *  @param e is an edge
	 *  @param c (if specified) is 0 or a color that is either not being used at
	 *  at e's input or is being used by another edge in e's fan; client must
	 *  ensure this is true; if c=0, the edge is "uncolored"
	 *  @return the color of e
	 */
	color(e,c=-1) {
		ae && assert(this.eg.validEdge(e) && c <= this.n_c);
		if (c < 0) return this.color_(e);

		let [u,v] = [this.input(e),this.output(e)];
		let f = this.fan(e);
		ae && assert(f);

		// free current color assigned to e
		let cc = this.color_(e);  // old color (possibly 0)
		this.color_edges.remove(e, cc);
		if (cc) { this.usage_[cc][u]--; this.usage_[cc][v]--; }

		// note: cc remains bound to fan, even if usage now 0
		if (cc) this.num_colored--;
		if (cc && (cc == this.top_color)) {
			while (!this.color_edges.first(this.top_color)) this.top_color--;
		}

		// set the new color (possibly 0)
		ae && assert(this.avail(c,e),`${f} ${this.avail(c,e)} ` +
					 				 `${this.owner(c,u)} ${this.usage(c,u)}`);
		this.color_(e,c);
		this.color_edges.append(e,c);

		if (c && !this.owner(c,u)) this.bind(c,f);
		if (c) { this.usage_[c][u]++; this.usage_[c][v]++; }
		if (c) this.num_colored++;
		if (c > this.top_color) this.top_color = c;
		
		return this.color_(e);
	}

	/** Uncolor all edges and remove all colors from palettes. */
	uncolor() {
		for (let e = this.first(); e; e = this.next(e))
			this.color(e,0);
		for (let f = this.firstFan(); f; f = this.nextFan(f))
            for (let c = this.firstColor(f); c; c = this.firstColor(f))
                this.release(c,f);
	}

	/** Check that all edges are colored */
	complete() { return this.num_colored == this.m; }

	/** Color the edges in the graph using the palettes.
	 *  Constructs palette graph for each output v, computes a maximum
	 *  matching and then uses the matching to color v's edges.
	 *  @param out is an optional argument that specifies a single
	 *  output to be colored; if out is omitted, all are colored
	 *  @return true if successful, else false
	 */
	colorFromPalettes(out=0) {
		for (let e = this.first(); e; e = this.next(e))
			this.color(e,0);

		// create palette graph
		let [,Delta_o] = this.maxDegree();
		let pg = new Graph(this.nf+this.crange, Delta_o*this.crange);
		pg.setBipartition(this.nf);

		let firstOut = out ? out : this.ni+1;
		let  lastOut = out ? out : this.n;
		for (let v = firstOut; v <= lastOut; v++) {
			// define palette graph for output v
			pg.clear();
			for (let e = this.firstAt(v); e; e = this.nextAt(v,e)) {
				let f = this.fan(e);
				for (let c = this.firstColor(f); c; c = this.nextColor(f,c)) {
					pg.join(f,this.nf+c);
				}
			}
			let [match] = bimatchHK(pg);
			// color edges at v using the palette graph matching
			for (let e = this.firstAt(v); e; e = this.nextAt(v,e)) {
				let f = this.fan(e); let me = match.at(f);
				if (me) {
					let c = pg.mate(f,match.at(f)) - this.nf;
					this.color(e,c);
				}
			}
		}
		return this.complete();
	}

	/** Compare another FanGraph object to this one.
	 *  @param that is an FanGraph object or a string representing one.
	 *  @return true if that is equal to this; meaning the vertices,
	 *  edges and fans all match; colors and color palettes may differ
	 */
	equals(that) {
		that = super.equals(...(arguments.length==1 ?
                     [that, this.ni, this.no, this.nf, Math.max(10,this.m)] :
					 arguments));
        if (typeof that == 'boolean') return that;

		if (this.fans_.length(1) != that.fans_.length(1))
			 return false;

		this.vlist_.clear();
		for (let f = this.firstFan(); f; f = this.nextFan(f)) {
			if (that.fans_.in(f,2) || this.fanout(f) != that.fanout(f) ||
				this.hub(f) != that.hub(f)) {
				return false;
			}
			this.vlist_.clear();
			for (let e = this.firstEdgeIn(f); e; e = this.nextEdgeIn(f,e))
				this.vlist_.enq(this.output(e));
			for (let e = that.firstEdgeIn(f); e; e = that.nextEdgeIn(f,e))
				if (!this.vlist_.contains(that.output(e))) return false;
		}
		return that;
	}

	/** Construct a string representation of the FanGraph object.
	 *  @param fmt is an integer representing format flags
	 *    fmt&1 shows each input's fans on a separate line
	 *    fmt&2 shows all inputs, including those with no fans
	 *    fmt&4 causes fan identifiers to be shown
	 *    fmt&8 causes colors to be shown
	 *    fmt&0x10 causes edges at outputs to be shown
	 *    fmt&0x20 causes palettes to be shown
	 */
	toString(fmt=0, fxs=0) {
		let s = '';
		for (let u = 1; u <= this.ni; u++) {
			if (!(fmt&2) && !this.firstAt(u)) continue;
			if (!(fmt&1) && s) s += ' ';
			s += this.x2s(u) + '[';
			for (let f = this.firstFanAt(u); f; f = this.nextFanAt(u,f)) {
				if (f != this.firstFanAt(u)) s += ' ';
				if (this.tint && this.tint(f)) s += this.tint(f);
				s += this.fan2string(f,fmt&8);
				if (fmt&4) s += this.f2s(f);
				if (fmt&0x20) s += this.palette2string(f); 
			}
			s += ']';
			if (fmt&1) s += '\n';
		}
		if (!fmt&0x10) return (fmt&1 ? '{\n' + s + '}\n': '{' + s + '}');
		let s2 = '';
		for (let v = this.ni+1; v <= this.n; v++) {
			if (!(fmt&1) && s) s2 += ' ';
			s2 += this.x2s(v) + '[';
			for (let e = this.firstAt(v); e; e = this.nextAt(v,e)) {
				if (e != this.firstAt(v)) s2 += ' ';
				s2 += this.x2s(this.mate(v,e));
				if (fmt&8 && this.color(e))
					s2 += ':' + this.color(e);
			}
			s2 += ']';
			if (fmt&1) s2 += '\n';
		}
		return (fmt&1 ? '{\n' + s + '}\n': '{' + s + '}');
	}

	/** Return a string listing the outputs in a given fan. */
	fan2string(f, showColors=0) {
		let s = '('; 
		for (let e = this.firstEdgeIn(f); e; e = this.nextEdgeIn(f,e)) {
			if (e != this.firstEdgeIn(f)) s += ' ';
			s += this.x2s(this.output(e));
			if (showColors) s += ':' + this.color(e);
		}
		s += ')';
		return s;
	}

	/** Compute a string representing a palette */
	palette2string(f) {
		let s=''
		for (let c = this.firstColor(f); c; c = this.nextColor(f,c))
			s += (s ? ' ' : '') + c;
		return '[' + s + ']';
	}

	/** Return index value for a fan or an upper case letter. */
	f2s(f) {
		return (this.n <= 26 ?
				'-ABCDEFGHIJKLMNOPQRSTUVWXYZ'[f] : ''+f);
	}

	/** Initialize object from a string representation.
	 *  @param s is a string representing a fan graph
	 *  @return true on success, else false
	 */
	static fromString(s, ni=4,no=8,nf=12, erange=2*(ni+no),crange=5,tints=0) {
		// function to parse a vertex
		let n = ni+no;
		let nextVertex = (sc => {
						let u = sc.nextIndex();
						n = Math.max(n,u);
						return u > 0 ? u : 0;
					});
		// function to parse a fan
		let tuples = []; let fan = 0; let fanIds = new Set();
		let nextFan = ((u,sc) => {
						// check for tint
						let t = 0;
						if (!sc.verify('(')) {
							t = sc.nextInt();
							if (Number.isNaN(t)) return false;
							if (!sc.verify('(')) return false;
							tints = 1;
						}
						// select an unused fan number and process
						// list of vertices in fan
						while (fanIds.has(++fan)) {}
						let i0 = tuples.length;
						while (!sc.verify(')')) {
							let v = nextVertex(sc);
							if (!v) return false;
							tuples.push([u,v,fan,t]);
						}
						// check for explicit fan number following close-)
						// update fan number in tuples
						let f = (!sc.isspace() ? sc.nextIndex(0,0) : 0);
						if (f > 0) {
							if (fanIds.has(f)) return false;
							// replace fan identifiers
							for (let i = i0; i < tuples.length; i++) {
								tuples[i][2] = f;
							}
							fan--;
						} else {
							f = fan;
						}
						fanIds.add(f);
						nf = Math.max(f,nf);
						return true;
					});

		// scan the input
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		while (!sc.verify('}')) {
			let u = nextVertex(sc);
			if (!u) return false;
			ni = Math.max(ni, u);
			if (sc.verify('[')) {
				while (!sc.verify(']')) {
					if (!nextFan(u,sc)) return false;
				}
			}
		}

		// check that inputs precede outputs
		for (let [u,v,f,b] of tuples)
			if (v <= ni) return false;

		// construct object from tuples
		erange = Math.max(erange, tuples.length);
		crange = Math.max(crange, 5*Math.ceil(nf/ni));
		let g = new FanGraph(ni, n-ni, nf, erange, crange, tints);

		for (let [u,v,f,t] of tuples) {
			g.add(g.join(u,v), f);
			if (g.tint) g.tint(f,t);
		}
		return g;
	}
}
