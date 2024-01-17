/** @file EdgeGroupColors.mjs
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
import {maxGroupCount, maxOutDegree} from './egcCommon.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';

/** This class implements a data structure used by edge-group coloring
 *  algorithms.
 */
export default class EdgeGroupColors extends Top {
	eg;				/// EdgeGroups object that colors are applied to

	_color;         // _color[e] is edge assigned to e or 0
	_edgesByColor;	// ListSet of edges partitioned by color (including 0)
	_firstEdge;     // _firstEdge[c] is first edge of color c

	_usage;         // usage[u][c] is number of times c is used at u

	_palettes;      // _palettes[u] is ListSet that defines palettes at u
	_unused;        // _unused[u] is first unused color in _palettes[u]
	_firstColor;    // _firstColor[g] is first color in g's palette
	_owner;         // _owner[u][c] is group at input u that owns color c
	_paletteSize;   // _paletteSize[g] is number of colors in g's palette

	constructor(eg, n_c=1) {
		super(n_c);	// n_c is number of colors in palette
		this.eg = eg;

		this._color = new Int32Array(eg.graph.edgeRange+1);
		this._edgesByColor = new ListSet(eg.graph.edgeRange);
		this._firstEdge = new Int32Array(this.n_c+1);
		for (let e = eg.graph.first(); e; e = eg.graph.next(e)) {
			this._firstEdge[0] = this._edgesByColor.join(this._firstEdge[0],e);
		}

		this._usage = new Array(eg.graph.n+1);

		this._palettes = new Array(eg.n_i+1);
		this._unused = new Int32Array(eg.n_i+1);
		this._firstColor = new Int32Array(eg.n_g+1);
		this._owner = new Array(eg.n_i+1);
		this._paletteSize = new Int32Array(eg.n_g+1);

		for (let u = 1; u <= eg.graph.n; u++) {
			this._usage[u] = new Int32Array(n_c+1);
			this._usage[u][0] = eg.graph.degree(u);
		}
		for (let u = 1; u <= eg.n_i; u++) {
			this._palettes[u] = new ListSet(n_c);
			this._owner[u] = new Int32Array(n_c+1);
			for (let c = 1; c <= n_c; c++)
				this._unused[u] = this._palettes[u].join(this._unused[u],c);
		}
	}

	get n_c() { return this.n; }

	maxColor() { return Math.max(...this._color); }

	clear() {
		for (let e = this.eg.graph.first(); e; e = this.eg.graph.next(e))
			this.color(e,0);
		for (let g = this.eg.firstGroup(); g; g = this.eg.nextGroup(g)) {
			for (let c = this.firstColor(g); c; c = this.firstColor(g))
				this.release(c,g);
		}
	}

	/** Assign one GroupColors object to another by copying its contents.
	 *  @param other is another object whose contents is copied to this one
	 */
	assign(other) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
		if (this.eg == other.eg && this.n_c == other.n_c)
			this.clear();
		else
			this.reset(other.eg, other.n_c);

		for (let e = this.eg.graph.first(); e; e = this.eg.graph.next(e))
			if (other.color(e)) this.color(e, other.color(e));
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param other is another graph whose contents is transferred to this one
	 */
	xfer(other) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
		this._n = other.n_c;
		this.eg = other.eg;
		this._color = other._color;
		this._edgesByColor = other._edgesByColor;
		this._firstEdge = other._firstEdge;
		this._usage = other._usage;
		this._palettes = other._palettes;
		this._firstColor = other._firstColor;
		this._owner = other._owner;
		this._paletteSize = other._paletteSize;

		other.eg = other._color = _other.edgesByColor = other._firstEdge = null;
		other._usage = other._palettes = other._firstColor = null;
		other._owner = other.paletteSize = null;
	}

	/** Determine if a color is available for use with a specified edge. */
	avail(c,e) {
		if (c == 0) return true;
		let [u,v] = [this.eg.input(e),this.eg.output(e)]
		if (this._usage[v][c] > 0) return false;
		return this._usage[v][c] == 0 && 
			   (!this.owner(c,u) || this.owner(c,u) == this.eg.group(e));
	}

	usage(c,u) { return this._usage[u][c]; }
	paletteSize(g) { return this._paletteSize[g]; }

	firstEdgeWithColor(c) { return this._firstEdge[c]; }
	nextEdgeWithColor(c,e) { return this._edgesByColor.next(e); }

	/** Get the first color used by a group.
	 *  @param g is a valid group defined by this.eg
	 *  @return the first color used by g (there must be one)
	 */
	firstColor(g) { return this._firstColor[g]; };

	/** Get the next color used by a group.
	 *  @param g is a valid group defined by eg
	 *  @param c is a color used by some edge in g
	 *  @return the color that follows c in g's list of colors
	 */
	nextColor(g,c) { return this._palettes[this.eg.hub(g)].next(c); }

	/** Get the group that owns a specified color at an input.
	 *  @param c is a color
	 *  @param u is an input
	 *  @return the group with hub u that has c in its palette
	 */
	owner(c,u) { return this._owner[u][c]; }

	/** Bind a color to a group.
	 *  @param c is a color
	 *  @param g is a group at input u, with c in its palette
	 *  c is a color in g's palette
	 */
	bind(c,g) {
		let u = this.eg.hub(g);
		ea && assert(g && c && u && !this.owner(c,u) && !this.usage(c,u),
					 g+' '+c+' '+u+' '+this.owner(c,u));
		this._owner[u][c] = g;
		this._unused[u] = this._palettes[u].delete(c, this._unused[u]);
		this._firstColor[g] = this._palettes[u].join(this._firstColor[g],c);
		this._paletteSize[g]++;
	}

	/** Release a color from a group.
	 *  @param c is a color
	 *  @param g is a group at input u, with c in its palette
	 *  c is a color in g's palette
	 */
	release(c,g) {
		let u = this.eg.hub(g);
		ea && assert(g && c && u && this.owner(c,u) == g);
		this._owner[u][c] = 0;
		this._firstColor[g] = this._palettes[u].delete(c,this._firstColor[g]);
		this._unused[u] = this._palettes[u].join(this._unused[u], c);
		this._paletteSize[g]--;
	}

	/** Get/set an edge color.
	 *  @param e is an edge
	 *  @param c (if specified) is 0 or a color that is either not being used at
	 *  at e's input or is being used by another edge in e's group; client must
	 *  ensure this is true; if c=0, the edge is "uncolored"
	 *  @return the color of e
	 */
	color(e, c=-1) {
		ea && assert(this.eg.graph.validEdge(e) && c <= this.n_c);
		if (c != -1) {
			let [u,v] = [this.eg.input(e),this.eg.output(e)];
			let g = this.eg.group(e);
			ea && assert(g);

			// free current color assigned to e
			let cc = this._color[e];  // old color (possibly 0)
			this._firstEdge[cc] =
				this._edgesByColor.delete(e, this._firstEdge[cc]);
			this._usage[u][cc]--; this._usage[v][cc]--;
			// note: cc remains bound to group, even if usage now 0

			// set the new color (possibly 0)
			ea && assert(this.avail(c,e));
			this._color[e] = c;
			this._firstEdge[c] =
				this._edgesByColor.join(this._firstEdge[c], e);
			this._usage[u][c]++; this._usage[v][c]++;
			if (c && !this.owner(c,u)) this.bind(c,g);
		}
		return this._color[e];
	}

	/** Color the edges in the graph using the palettes.
	 *  Constructs palette graph for each output v, computes a maximum
	 *  matching and then uses the matching to color v's edges.
	 *  @param out is an optional argument that specifies a single
	 *  output to be colored; if out is omitted, all are colored
	 *  @return true if successful, else false
	 */
	colorFromPalettes(out=0) {
		let Delta_o = maxOutDegree(this.eg);
		let pg = new Graph(this.eg.n_g+this.n_c, Delta_o*this.n_c);
		let io = new ListPair(this.eg.n_g + this.n_c);
		for (let g = 1; g <= this.eg.n_g; g++) io.swap(g);

		let egg = this.eg.graph;
		let firstOut = out ? out : this.eg.n_i+1;
		let  lastOut = out ? out : egg.n;
		for (let v = firstOut; v <= lastOut; v++) {
			pg.clear();
			for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
				let g = this.eg.group(e);
				for (let c = this.firstColor(g); c; c = this.nextColor(g,c)) {
					pg.join(g,this.eg.n_g+c);
				}
			}
			let [match] = bimatchHK(pg,0,io);
			for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
				let g = this.eg.group(e);
				let me = match.at(g);
				if (!me) return false;
				this.color(e, pg.mate(g,me)-this.eg.n_g);
			}
		}
		return true;
	}
	
	/** Compare another object to this one.
	 *  @param other is a EdgeGroupColors object or a string representing one.
	 *  @return true if g is equal to this; that is, it has the same
	 *  vertices, edges and edge weights
	 *
	 *  Bug: comparison expects group graphs to have matching group numbers.
	 */
	equals(other) {
		if (this === other) return true;
        if (typeof other == 'string') {
            let s = other;
			other = new this.constructor(this.eg,this.n_c);
			assert(other.fromString(s), other.constructor.name +
						 ':equals: fromString cannot parse ' + s);
				// note: this assert must always be enabled
			if (other.n_c > this.n_c) return false;
			if (other.n_c < this.n_c) other.expand(this.n_c);
        } else if (other.constructor.name != this.constructor.name ||
		    other.n_c != this.n_c) {
			return false;
		}
		if (!this.eg.equals(other.eg)) return false;

		// now make sure the colors in the groups match
		let clist = new List(this.n_c);
		for (let g = this.eg.firstGroup(); g; g = this.eg.nextGroup(g)) {
			clist.clear(); let len1 = 0; let len2 = 0;
			for (let c = this.firstColor(g); c; c = this.nextColor(c)) {
				clist.enq(c); len1++;
			}
			for (let c = other.firstColor(g); c; c = other.nextColor(c)) {
				if (!clist.contains(c)) return false;
				len2++;
			}
			if (len1 != len2) return false;
		}
		return other;
	}

	/** Construct a string showing the edges by color. */
	toString(showGroupIds=true) {
		let s = '{\n'; let cgroups = new List(this.eg.n_g);
		for (let c = 1; c <= this.n_c; c++) {
			if (!this.firstEdgeWithColor(c)) continue;
			s += c + '[';
			cgroups.clear();
			for (let e = this.firstEdgeWithColor(c); e;
					 e = this.nextEdgeWithColor(c,e)) {
				let g = this.eg.group(e);
				if (!cgroups.contains(g)) cgroups.enq(g);
			}
			for (let g = cgroups.first(); g; g = cgroups.next(g)) {
				if (g != cgroups.first()) s += ' ';
				let ss = '';
				let e1 = this.eg.firstInGroup(g);
				for (let e = e1; e; e = this.eg.nextInGroup(g,e)) {
					if (showGroupIds && this.color(e) != c) continue;
					if (ss) ss += ' ';
					ss += this.color(e) == c ?
								this.eg.graph.x2s(this.eg.output(e)) : '.';
				}
				s += this.eg.graph.x2s(this.eg.input(e1)) + '(' + ss + ')';
				if (showGroupIds) s += this.eg.g2s(g);
			}
			s += ']\n';
		}
		s += '}\n';
		return s;
	}

	/** Return a string listing the colors in a group's palette. */
	palette2string(g) {
		let s = '{';
		for (let c = this.firstColor(g); c; c = this.nextColor(g,c))
			s += (c == this.firstColor(g) ? c : ' ' + c);
		s += '}';
		return s;
	}

	/** Initialize coloring for the current graph.
	 *  @param s is a string representing a coloring
	 *  @return true on success, else false
	 */
	fromString(s) {
		let nextVertex = (sc => {
						let u = sc.nextIndex();
						return u > 0 && u <= this.eg.graph.n ? u : 0;
					});
		// function to parse an edge group
		let pairs = [];
		let nextGroup = ((u,c,sc) => {
						if (!sc.verify('(')) return false
						let i0 = pairs.length;
						while (!sc.verify(')')) {
							let v = nextVertex(sc);
							if (v <= this.eg.n_i) return false;
							pairs.push([v,c]);
						}
						let g = sc.nextIndexUpper();
						if (g <= 0 || g > this.eg.n_g) return false;
						// replace vertices just scanned with edge numbers
						for (let i = i0; i < pairs.length; i++) {
							let v = pairs[i][0];
							let e = this.eg.findEdge(v, g)
							if (!e || this.eg.input(e) != u) return false;
							pairs[i][0] = e;
						}
						return true;
					});

		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let cmax = 0;
		while (!sc.verify('}')) {
			let c = sc.nextNumber();
			if (Number.isNaN(c) || c != ~~c) return false;
			cmax = Math.max(cmax,c);
			if (!sc.verify('[')) return false;
			while (!sc.verify(']')) {
				let u = nextVertex(sc);
				if (u > this.eg.n_i) return false;
				if (!nextGroup(u,c,sc)) return false;
			}
		}

		if (cmax == this.n_c) this.clear();
		else this.reset(this.eg, this.n_c);

		for (let i = 0; i < pairs.length; i++) {
			let [e,c] = pairs[i];
			this.color(e,c);
		}
		return true;
	}
}
