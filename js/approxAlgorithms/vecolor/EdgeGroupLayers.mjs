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
import EdgeGroupGraph from './EdgeGroupGraph.mjs';

/** This class implements a data structure used by some edge-group
 *  coloring algorithms.
 */
export default class EdgeGroupLayers extends Top {
	eg;            // EdgeGroups object that layers are defined on
	layers;        // ListSet that partitions groups into layers
	fgl;           // fgl[l] is the first group in layer l

	constructor(eg, nl) {
		super(nl);
		this.eg = eg;
		this.layers = new ListSet(eg.ng);
		this.fgl = new Int32Array(nl+1);
	}

	get nl() { return this.n; }

	clear() { layers.clear(); fgl.fill(0); }

	/** Assign one object to another by copying its contents.
	 *  @param other is another object whose contents is copied to this one
	 */
	assign(other) {
        ea && assert(other != this &&
                	 this.constructor.name == other.constructor.name,
					 'Top:assign: self-assignment or mismatched types');
		if (this.eg == other.eg && this.nl == other.nl)
			this.clear();
		else
			this.reset(other.eg, other.nl);

		for (let l = 1; l <= this.nl; l++) {
			for (let g = other.firstInLayer(l); g; g = other.nextInLayer(l))
				this.add(g,l);
		}
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param other is another graph whose contents is transferred to this one
	 */
	xfer(other) {
		super.xfer(other);
		this.eg = other.eg; this.layers = other.layers; this.fgl = other.fgl;
		other.eg = other.layers = other.fgl = null;
	}

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
	}

	/** Remove a group from a layer.
	 *  @param g is a group 
	 *  @param l is a layer that includes g
	 */
	delete(g,l) {
		this.fgl[l] = this.layers.delete(g,this.fgl[l])
	}

	/** Combine two layers.
	 *  @param l1 is a layer
	 *  @param l2 is another layer
	 */
	join(l1,l2) {
		this.fgl[l1] = this.layers.join(this.fgl[l1], this.fgl[l2]);
	}

	/** Compute the thickness of a layer. */
	thickness(l) {
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

	/** Construct a string representation of the EdgeGroupLayers object.
	 */
	toString(details=false) {
		let s = '{'; let cgroups = new List(this.eg.ng);
		for (let l = 1; l <= this.nl; l++) {
			if (l > 1) s += ' ';
			s += '[';
			for (let g = this.firstInLayer(l); g; g = this.nextInLayer(l,g)) {
				if (g != this.firstInLayer(l)) s += ' ';
				if (details) s += this.eg.group2string(g);
				s += this.eg.g2s(g);
			}
			s += ']';
		}
		s += '}';
		return s;
	}
}
