/** @file EdgeGroupLayers.mjs
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

/** This class implements a data structure used by some edge-group
 *  coloring algorithms.
 */
export default class EdgeGroupLayers extends Top {
	eg;            // EdgeGroups object that layers are defined on
	layers;        // ListSet that partitions groups into layers
	fgl;           // fgl[l] is the first group in layer l
	gmap;          // gmap[g] is the layer containing g

	constructor(eg, n_l) {
		super(n_l);
		this.eg = eg;
		this.layers = new ListSet(eg.n_g);
		this.fgl = new Int32Array(n_l+1);
		this.gmap = new Int32Array(eg.n_g+1);
	}

	get n_l() { return this.n; }

	clear() { layers.clear(); fgl.fill(0); }

	/** Assign one object to another by copying its contents.
	 *  @param that is another object whose contents is copied to this one
	 */
	assign(that) {
        ea && assert(that != this &&
                	 this.constructor.name == that.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
		if (this.eg == that.eg && this.n_l == that.n_l)
			this.clear();
		else
			this.reset(that.eg, that.n_l);

		for (let l = 1; l <= this.n_l; l++) {
			for (let g = that.firstInLayer(l); g; g = that.nextInLayer(l))
				this.add(g,l);
		}
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param that is another graph whose contents is transferred to this one
	 */
	xfer(that) {
		super.xfer(that);
		this.eg = that.eg; this.layers = that.layers; this.fgl = that.fgl;
		this.gmap = that.gmap;
		that.eg = that.layers = that.fgl = that.gmap = null;
	}

	/** Get the layer that a specified group belongs to. */
	layer(g) { return this.gmap[g]; }

	/** Get the first group in a layer.
	 *  @param l is a layer number
	 *  @return the first group in layer l
	 */
	firstInLayer(l) { return this.fgl[l]; }

	/** Get the next group in a layer l.
	 *  @param l is a layer number
	 *  @return the first group in layer l
	 */
	nextInLayer(l,g) { return this.layers.next(g); }

	/** Add a group to a layer.
	 *  @param g is a group that does not belong to any layer
	 *  @param l is a layer number
	 */
	add(g,l) {
		this.fgl[l] = this.layers.join(this.fgl[l],g);
		this.gmap[g] = l;
	}

	/** Remove a group from a layer.
	 *  @param g is a group
	 */
	delete(g) {
		let l = this.layer(g);
		this.fgl[l] = this.layers.delete(g,this.fgl[l])
		this.gmap[g] = 0;
	}

	/** Combine two layers segments.
	 *  @param l1 is a layer
	 *  @param l2 is another layer that is assumed to contain groups
	 *  with hubs that are distinct from those in l1
	 */
	join(l1,l2) {
		for (let g = this.firstInLayer(l2); g; g = this.nextInLayer(l2,g))
			this.gmap[g] = l1;
		this.fgl[l1] = this.layers.join(this.fgl[l1], this.fgl[l2]);
	}

	/** Compute the thickness of a layer.
	 *  @param l is a layer number
	 *  @return the layer thickness
	 */
	layerThickness(l) {
		let t = 0; let counts = new Int32Array(this.eg.graph.n+1);
		for (let g = this.firstInLayer(l); g; g = this.nextInLayer(l,g)) {
			for (let e = this.eg.firstInGroup(g); e;
					 e = this.eg.nextInGroup(g,e)) {
				let v = this.eg.output(e); counts[v]++;
				t = Math.max(t, counts[v]);
			}
		}
		return t;
	}

	/** Sort groups in layers.
	 *  Rebuilds the layers so that groups are listed in a specific order.
	 *  @param compare is a comparison function used to compare two groups
	 *  in the same layer; it returns -1 if the first group should precede
	 *  the second, +1 if the second group should precede the first and 0
	 *  if either order is acceptable; if compare is omitted, groups are
	 *  sorted in decreasing order of their fanouts
	 */
	sortLayers(compare=null) {
		if (!compare)
			compare = (g1,g2) => this.eg.fanout(g2) - this.eg.fanout(g1);
		for (let l = 1; l <= this.n_l; l++) {
			let layerSize = 0;
			for (let g = this.firstInLayer(l); g; g = this.nextInLayer(l,g))
				layerSize++;
			let gvec = new Int32Array(layerSize);
			let i = 0;
			for (let g = this.firstInLayer(l); g; g = this.firstInLayer(l,g)) {
				gvec[i++] = g; this.delete(g,l);
			}
			gvec.sort(compare);
			for (i = 0; i < layerSize; i++) {
				this.add(gvec[i],l);
			}
		}
	}

	/** Construct a string representation of the EdgeGroupLayers object.
	 */
	toString(details=false) {
		let s = '{'; let cgroups = new List(this.eg.n_g);
		for (let l = 1; l <= this.n_l; l++) {
			if (details) s += '\n';
			else if (l > 1) s += ' ';
			s += '[';
			for (let g = this.firstInLayer(l); g; g = this.nextInLayer(l,g)) {
				if (g != this.firstInLayer(l)) s += ' ';
				if (details)
					s += this.eg.graph.x2s(this.eg.hub(g)) +
						 this.eg.group2string(g);
				else
					s += this.eg.g2s(g);
			}
			s += ']';
		}
		if (details) s += '\n}\n';
		else s += '}';
		return s;
	}
}
