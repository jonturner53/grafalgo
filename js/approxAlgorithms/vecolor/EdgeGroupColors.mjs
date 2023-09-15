/** @file EgcColors.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Scanner from '../../dataStructures/basic/Scanner.mjs';
import Top from '../../dataStructures/Top.mjs';
import EdgeGroupGraph from './EdgeGroupGraph.mjs';

/** This class implements a data structure used by edge-group coloring
 *  algorithms.
 */
export default class EgcColors extends Top {
	eg;				/// EdgeGroups object that colors are applied to

	_color;         // _color[e] is edge assigned to e or 0
	edgesByColor;	// ListSet of edges partitioned by color
	fe;             // fe[c] is first edge of color c

    _usage;         // usage[u][c] is number of times c is used at u
	colorsInGroups; // colorsInGroups[u] is ListSet of colors divided
                    // among the groups that use them; unused colors are
					// in a separate list
	unused;         // unused[u] is first unused color at u
    fc;             // fc[g] is first color used by group g;

	constructor(eg, nc=1) {
		super(nc);	// nc is number of colors in palette
		this.eg = eg;

		this._color = new Int32Array(eg.graph.edgeRange+1);
		this.edgesByColor = new ListSet(eg.graph.edgeRange);
		this.fe = new Int32Array(this.nc+1);

		this._usage = new Array(eg.graph.n+1);
		this.colorsInGroups = new Array(eg.ni+1);
		this.unused = new Int32Array(eg.ni+1);
		this.fc = new Int32Array(eg.ng+1);
		for (let u = 1; u <= eg.graph.n; u++)
			this._usage[u] = new Int32Array(nc+1);
		for (let u = 1; u <= eg.ni; u++) {
			this.colorsInGroups[u] = new ListSet(nc);
			for (let c = 1; c <= nc; c++)
				this.unused[u] = this.colorsInGroups[u].join(this.unused[u],c);
		}
	}

	get nc() { return this.n; }

	maxColor() { return Math.max(...this._color); }

	clear() {
		for (let e = this.eg.graph.first(); e; e = this.eg.graph.next(e))
			this.color(e,0);
	}

	/** Assign one GroupColors object to another by copying its contents.
	 *  @param other is another object whose contents is copied to this one
	 */
	assign(other) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
		if (this.eg == other.eg && this.nc == other.nc)
			this.clear();
		else
			this.reset(other.eg, other.nc);

		for (let e = eg.graph.first(); e; e = eg.graph.next(e))
			if (other.color(e)) this.color(e, other.color(e));
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param other is another graph whose contents is transferred to this one
	 */
	xfer(other) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
		this._n = other.nc;
		this.eg = other.eg;
		this._color = other._color;
		this.edgesByColor = other.edgesByColor;
		this.fe = other.fe;
		this._usage = other._usage;
		this.colorsInGroups = other.colorsInGroups;
		this.fc = other.fc;

		other.eg = other._color = other.edgesByColor = other.fe = null;
		other._usage = other._colorsInGroups = other.fc = null;
	}

	avail(c,e) {
		let [u,v] = [this.eg.input(e),this.eg.output(e)]
		if (this._usage[v][c]  > 0) return false;
		if (this._usage[u][c] == 0) return true;
		let g = this.eg.group(e);
		for (let cg = this.firstColorIn(g); cg; cg = this.nextColorIn(g,cg)) {
			if (cg == c) return true;
		}
		return false;
	}

	usage(c,u) { return this._usage[u][c]; }

	firstEdgeWithColor(c) { return this.fe[c]; }
	nextEdgeWithColor(c,e) { return this.edgesByColor.next(e); }

	/** Get the first color used by a group.
	 *  @param g is a valid group defined by this.eg
	 *  @return the first color used by g (there must be one)
	 */
	firstColorIn(g) { return this.fc[g]; }

	/** Get the next color used by a group.
	 *  @param g is a valid group defined by eg
	 *  @param c is a color used by some edge in g
	 *  @return the color that follows c in g's list of colors
	 */
	nextColorIn(g,c) {
		ea && assert(this.eg.firstInGroup(g));
		let u = this.eg.center(g);
		return this.colorsInGroups[u].next(c);
	}

	/** Get/set an edge color.
	 *  @param e is an edge
	 *  @param c (if specified) is 0 or a color that is either not being used at
	 *  at e's input or is being used by another edge in e's group; client must
	 *  ensure this is true; if c=0, the edge is "uncolored"
	 *  @return the color of e
	 */
	color(e, c=-1) {
		ea && assert(this.eg.graph.validEdge(e) && c <= this.nc);
		if (c != -1) {
			// set the edge color
			let [u,v] = [this.eg.input(e),this.eg.output(e)];
			let g = this.eg.group(e);
			let oc = this._color[e];  // old color
			if (oc) {
				this._color[e] = 0;
				this.fe[oc] = this.edgesByColor.delete(e, this.fe[oc]);
				// move oc to list of unused colors if necessary
				if (this.usage(oc,u) == 1) {
					this.fc[g] = this.colorsInGroups[u].delete(oc, this.fc[g])
					this.unused[u] =
						this.colorsInGroups[u].join(this.unused[u], oc);
				}
				this._usage[u][oc]--; this._usage[v][oc]--;
			}
			if (c != 0) {
				ea && assert(this.avail(c,e));
				this._color[e] = c;
				this.fe[c] = this.edgesByColor.join(this.fe[c], e);
				if (this.usage(c,u) == 0) {
					this.unused[u] =
						this.colorsInGroups[u].delete(c, this.unused[u]);
					this.fc[g] = this.colorsInGroups[u].join(this.fc[g], c);
					this._usage[u][c] = 0;
				}
				this._usage[u][c]++; this._usage[v][c]++;
			}
		}
		return this._color[e];
	}
	
	/** Compare another GroupColoring to this one.
	 *  @param other is a GroupColoring object or a string representing one.
	 *  @return true if g is equal to this; that is, it has the same
	 *  vertices, edges and edge weights
	 *
	 *  Bug: comparison expects group graphs to have matching group numbers.
	 */
	equals(other) {
		if (this === other) return true;
        if (typeof other == 'string') {
            let s = other;
			other = new this.constructor(this.eg,this.nc);
			assert(other.fromString(s), other.constructor.name +
						 ':equals: fromString cannot parse ' + s);
				// note: this assert must always be enabled
			if (other.nc > this.nc) return false;
			if (other.nc < this.nc) other.expand(this.nc);
        } else if (other.constructor.name != this.constructor.name ||
		    other.nc != this.nc) {
			return false;
		}
		if (!this.eg.equals(other.eg)) return false;

		// now make sure the colors in the groups match
		let clist = new List(this.nc);
		for (let g = this.eg.firstGroup(); g; g = this.eg.nextGroup(g)) {
			clist.clear(); let len1 = 0; let len2 = 0;
			for (let c = this.firstColorIn(g); c; c = this.nextColorIn(g,c)) {
				clist.enq(c); len1++;
			}
			for (let c = other.firstColorIn(g); c; c = other.nextColorIn(g,c)) {
				if (!clist.contains(c)) return false;
				len2++;
			}
			if (len1 != len2) return false;
		}
		return other;
	}

	/** Construct a string representation of the GroupColors object.
	 */
	toString(showAllGroups=false) {
		let s = '{\n'; let cgroups = new List(this.eg.ng);
		for (let c = 1; c <= this.nc; c++) {
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
				let ss = ''; let cnt = 0;
				let e1 = this.eg.firstInGroup(g);
				for (let e = e1; e; e = this.eg.nextInGroup(g,e)) {
					if (this.color(e) != c) continue
					if (ss) ss += ' ';
					ss += this.eg.x2s(this.eg.output(e));
					cnt++;
				}
				s += this.eg.graph.x2s(this.eg.input(e1)) + '(' + ss + ')';
				if (showAllGroups || cnt != this.eg.fanout(g))
					s += this.eg.g2s(g);
			}
			s += ']\n';
		}
		s += '}\n';
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
							if (v <= this.eg.ni) return false;
							pairs.push([v,c]);
						}
						let g = sc.nextIndexUpper();
						if (g <= 0 || g > this.eg.ng) return false;
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
				if (u > this.eg.ni) return false;
				if (!nextGroup(u,c,sc)) return false;
			}
		}

		if (cmax == this.nc) this.clear();
		else this.reset(this.eg, this.nc);

		for (let i = 0; i < pairs.length; i++) {
			let [e,c] = pairs[i]; this.color(e,c);
		}
		return true;
	}
}
