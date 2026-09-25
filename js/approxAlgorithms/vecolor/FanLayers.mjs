/** @file FanLayers.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Scanner from '../../dataStructures/basic/Scanner.mjs';
import Top from '../../dataStructures/Top.mjs';

/** This class implements a data structure used by some fan
 *  coloring algorithms.
 */
export default class FanLayers extends Top {
	g;            // FanGraph object that layers are defined on
	layers;        // ListSet that partitions fans into layers
	ffl;           // ffl[l] is the first fan in layer l
	fmap;          // fmap[f] is the layer containing f

	constructor(g, nl) {
		super(nl);
		this.g = g;
		this.layers = new ListSet(g.nf);
		this.ffl = new Int32Array(nl+1);
		this.fmap = new Int32Array(g.nf+1);
	}

	get nl() { return this.n; }

	clear() { layers.clear(); ffl.fill(0); }

	/** Get the layer that a specified fan belongs to. */
	layer(f) { return this.fmap[f]; }

	/** Get the first fan in a layer.
	 *  @param l is a layer number
	 *  @return the first fan in layer l
	 */
	firstInLayer(l) { return this.ffl[l]; }

	/** Get the next fan in a layer l.
	 *  @param l is a layer number
	 *  @return the first fan in layer l
	 */
	nextInLayer(l,f) { return this.layers.next(f); }

	/** Add a fan to a layer.
	 *  @param f is a fan that does not belong to any layer
	 *  @param l is a layer number
	 */
	add(f,l) {
		this.ffl[l] = this.layers.join(this.ffl[l],f);
		this.fmap[f] = l;
	}

	/** Remove a fan from a layer.
	 *  @param f is a fan
	 */
	delete(f) {
		let l = this.layer(f);
		this.ffl[l] = this.layers.delete(f,this.ffl[l])
		this.fmap[f] = 0;
	}

	/** Combine two layers segments.
	 *  @param l1 is a layer
	 *  @param l2 is another layer that is assumed to contain fans
	 *  with hubs that are distinct from those in l1
	 */
	join(l1,l2) {
		for (let f = this.firstInLayer(l2); f; f = this.nextInLayer(l2,f))
			this.fmap[f] = l1;
		this.ffl[l1] = this.layers.join(this.ffl[l1], this.ffl[l2]);
	}

	/** Compute the thickness of a layer.
	 *  @param l is a layer number
	 *  @return the layer thickness
	 */
	layerThickness(l) {
		let t = 0; let counts = new Int32Array(this.g.n+1);
		for (let f = this.firstInLayer(l); f; f = this.nextInLayer(l,f)) {
			for (let e = this.g.firstEdgeIn(f); e;
					 e = this.g.nextEdgeIn(f,e)) {
				let v = this.g.output(e); counts[v]++;
				t = Math.max(t, counts[v]);
			}
		}
		return t;
	}

	/** Sort fans in layers.
	 *  Rebuilds the layers so that fans are listed in a specific order.
	 *  @param compare is a comparison function used to compare two fans
	 *  in the same layer; it returns -1 if the first fan should precede
	 *  the second, +1 if the second fan should precede the first and 0
	 *  if either order is acceptable; if compare is omitted, fans are
	 *  sorted in decreasing order of their fanouts
	 */
	sortLayers(compare=null) {
		if (!compare)
			compare = (f1,f2) => this.g.fanout(f2) - this.g.fanout(f1);
		for (let l = 1; l <= this.nl; l++) {
			let layerSize = 0;
			for (let f = this.firstInLayer(l); f; f = this.nextInLayer(l,f))
				layerSize++;
			let fvec = new Int32Array(layerSize);
			let i = 0;
			for (let f = this.firstInLayer(l); f; f = this.firstInLayer(l,f)) {
				fvec[i++] = f; this.delete(f,l);
			}
			fvec.sort(compare);
			for (i = 0; i < layerSize; i++) {
				this.add(fvec[i],l);
			}
		}
	}

	/** Construct a string representation of the FanLayers object.
	 */
	toString(details=false) {
		let s = '{'; let cfans = new List(this.g.n_g);
		for (let l = 1; l <= this.nl; l++) {
			if (details) s += '\n';
			else if (l > 1) s += ' ';
			s += '[';
			for (let f = this.firstInLayer(l); f; f = this.nextInLayer(l,f)) {
				if (f != this.firstInLayer(l)) s += ' ';
				if (details)
					s += this.g.x2s(this.g.hub(f)) +
						 this.g.fan2string(f);
				else
					s += this.g.f2s(f);
			}
			s += ']';
		}
		if (details) s += '\n}\n';
		else s += '}';
		return s;
	}
}
