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

	Color;         // Color[e] is edge assigned to e or 0
	EdgesByColor;	// ListSet of edges partitioned by color (including 0)
	FirstEdge;     // FirstEdge[c] is first edge of color c

	Usage;         // Usage[u][c] is number of times c is used at u

	Palettes;      // Palettes[u] is ListSet that defines palettes at u
	Unused;        // Unused[u] is first unused color in Palettes[u]
	FirstColor;    // FirstColor[g] is first color in g's palette
	Owner;         // Owner[u][c] is group at input u that owns color c
	PaletteSize;   // PaletteSize[g] is number of colors in g's palette

	constructor(eg, n_c=1) {
		super(n_c);	// n_c is number of colors in palette
		this.eg = eg;

		this.Color = new Int32Array(eg.graph.edgeRange+1);
		this.EdgesByColor = new ListSet(eg.graph.edgeRange);
		this.FirstEdge = new Int32Array(this.n_c+1);
		for (let e = eg.graph.first(); e; e = eg.graph.next(e)) {
			this.FirstEdge[0] = this.EdgesByColor.join(this.FirstEdge[0],e);
		}

		this.Usage = new Array(eg.graph.n+1);

		this.Palettes = new Array(eg.n_i+1);
		this.Unused = new Int32Array(eg.n_i+1);
		this.FirstColor = new Int32Array(eg.n_g+1);
		this.Owner = new Array(eg.n_i+1);
		this.PaletteSize = new Int32Array(eg.n_g+1);

		for (let u = 1; u <= eg.graph.n; u++) {
			this.Usage[u] = new Int32Array(n_c+1);
			this.Usage[u][0] = eg.graph.degree(u);
		}
		for (let u = 1; u <= eg.n_i; u++) {
			this.Palettes[u] = new ListSet(n_c);
			this.Owner[u] = new Int32Array(n_c+1);
			for (let c = 1; c <= n_c; c++)
				this.Unused[u] = this.Palettes[u].join(this.Unused[u],c);
		}
	}

	get n_c() { return this.n; }

	maxColor() { return Math.max(...this.Color); }

	clear() {
		for (let e = this.eg.graph.first(); e; e = this.eg.graph.next(e))
			this.color(e,0);
		for (let g = this.eg.firstGroup(); g; g = this.eg.nextGroup(g)) {
			for (let c = this.firstColor(g); c; c = this.firstColor(g))
				this.release(c,g);
		}
	}

	/** Assign one GroupColors object to another by copying its contents.
	 *  @param that is another object whose contents is copied to this one
	 */
	assign(that) {
        ea && assert(that != this &&
                	 this.constructor.name == that.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
		if (this.eg == that.eg && this.n_c == that.n_c)
			this.clear();
		else
			this.reset(that.eg, that.n_c);

		for (let e = this.eg.graph.first(); e; e = this.eg.graph.next(e))
			if (that.color(e)) this.color(e, that.color(e));
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param that is another graph whose contents is transferred to this one
	 */
	xfer(that) {
        ea && assert(that != this &&
                	 this.constructor.name == that.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
		this._n = that.n_c;
		this.eg = that.eg;
		this.Color = that.Color;
		this.EdgesByColor = that.EdgesByColor;
		this.FirstEdge = that.FirstEdge;
		this.Usage = that.Usage;
		this.Palettes = that.Palettes;
		this.FirstColor = that.FirstColor;
		this.Owner = that.Owner;
		this.PaletteSize = that.PaletteSize;

		that.eg = that.Color = that.edgesByColor = that.FirstEdge = null;
		that.Usage = that.Palettes = that.FirstColor = null;
		that.Owner = that.paletteSize = null;
	}

	/** Determine if a color is available for use with a specified edge. */
	avail(c,e) {
		if (c == 0) return true;
		let g = this.eg.group(e);
		let [u,v] = [this.eg.input(e),this.eg.output(e)]
		return this.Usage[v][c] == 0 && 
			   (!this.owner(c,u) || this.owner(c,u) == g);
	}

	usage(c,u) { return this.Usage[u][c]; }
	paletteSize(g) { return this.PaletteSize[g]; }

	firstEdgeWithColor(c) { return this.FirstEdge[c]; }
	nextEdgeWithColor(c,e) { return this.EdgesByColor.next(e); }

	/** Get the first color in a group's palette.
	 *  @param g is a valid group defined by this.eg
	 *  @return the first color used by g (there must be one)
	 */
	firstColor(g) { return this.FirstColor[g]; };

	/** Get the next color in a group's palette.
	 *  @param g is a valid group defined by eg
	 *  @param c is a color used by some edge in g
	 *  @return the color that follows c in g's list of colors
	 */
	nextColor(g,c) { return this.Palettes[this.eg.hub(g)].next(c); }

	/** Get the group that owns a specified color at an input.
	 *  @param c is a color
	 *  @param u is an input
	 *  @return the group with hub u that has c in its palette
	 */
	owner(c,u) { return this.Owner[u][c]; }

	/** Bind a color to a group.
	 *  @param c is a color
	 *  @param g is a group at input u, with c in its palette
	 *  c is a color in g's palette
	 */
	bind(c,g) {
		let u = this.eg.hub(g);
		ea && assert(g && c && u && !this.owner(c,u) && !this.usage(c,u),
					 g+' '+c+' '+u+' '+this.owner(c,u)+' '+this.usage(c,u));
		this.Owner[u][c] = g;
		this.Unused[u] = this.Palettes[u].delete(c, this.Unused[u]);
		this.FirstColor[g] = this.Palettes[u].join(this.FirstColor[g],c);
		this.PaletteSize[g]++;
	}

	/** Release a color from a group.
	 *  @param c is a color
	 *  @param g is a group at input u, with c in its palette
	 *  c is a color in g's palette
	 */
	release(c,g) {
		let u = this.eg.hub(g);
		ea && assert(g && c && u && this.owner(c,u) == g);
		this.Owner[u][c] = 0;
		this.FirstColor[g] = this.Palettes[u].delete(c,this.FirstColor[g]);
		this.Unused[u] = this.Palettes[u].join(this.Unused[u], c);
		this.PaletteSize[g]--;
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
			let cc = this.Color[e];  // old color (possibly 0)
			this.FirstEdge[cc] =
				this.EdgesByColor.delete(e, this.FirstEdge[cc]);
			this.Usage[u][cc]--; this.Usage[v][cc]--;
			// note: cc remains bound to group, even if usage now 0

			// set the new color (possibly 0)
			ea && assert(this.avail(c,e),g+' '+
					this.avail(c,e)+' '+ this.owner(c,u)+' '+ this.usage(c,u));
			this.Color[e] = c;
			this.FirstEdge[c] =
				this.EdgesByColor.join(this.FirstEdge[c], e);
			if (c && !this.owner(c,u)) this.bind(c,g);
			this.Usage[u][c]++; this.Usage[v][c]++;
		}
		return this.Color[e];
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
		pg.split(io);

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
			let [match] = bimatchHK(pg);
			for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
				let g = this.eg.group(e); let u = this.eg.hub(g);
				let me = match.at(g);
				if (!me) return false;
				let c = pg.mate(g,me) - this.eg.n_g
				this.color(e, c);
			}
		}
		return true;
	}
	
	/** Compare another object to this one.
	 *  @param that is a EdgeGroupColors object or a string representing one.
	 *  @return true if g is equal to this; that is, it has the same
	 *  vertices, edges and edge weights
	 *
	 *  Bug: comparison expects group graphs to have matching group numbers.
	 */
	equals(that) {
		that = super.equals(that, [this.eg, this.n]);
		if ((typeof that) == 'boolean') return that;

		if (!this.eg.equals(that.eg)) return false;

		// now make sure the colors in the groups match
		let clist = new List(this.n_c);
		for (let g = this.eg.firstGroup(); g; g = this.eg.nextGroup(g)) {
			clist.clear(); let len1 = 0; let len2 = 0;
			for (let c = this.firstColor(g); c; c = this.nextColor(g,c)) {
				clist.enq(c); len1++;
			}
			for (let c = that.firstColor(g); c; c = that.nextColor(g,c)) {
				if (!clist.contains(c)) return false;
				len2++;
			}
			if (len1 != len2) return false;
		}
		return that;
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
						let g = sc.nextIndexExt(0,0);
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
			if (c == NaN || c != ~~c) return false;
			cmax = Math.max(cmax,c);
			if (!sc.verify('[')) return false;
			while (!sc.verify(']')) {
				let u = nextVertex(sc);
				if (u > this.eg.n_i) return false;
				if (!nextGroup(u,c,sc)) return false;
			}
		}

		this.reset(this.eg, this.n_c);

		for (let i = 0; i < pairs.length; i++) {
			let [e,c] = pairs[i];
			this.color(e,c);
		}
		return true;
	}
}
