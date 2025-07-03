/** @file egcTl.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import wbimatchH from '../../graphAlgorithms/match/wbimatchH.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import { lowerBound, maxGroupCount } from './egcCommon.mjs';

let eg;		// shared reference to EdgeGroups object
let egl;	// shared reference to EdgeGroupLayers object
let Gamma_i;  // largest group count

let trace;
let traceString;

/** Find an edge group coloring using Turner's layering method.
 *  @param eg0 is a group graph to be colored.
 *  @param strict is a flag; when true, edges in each layer are assigned
 *  disjoint sets of colors
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcTl(eg0, strict=false, traceFlag=0) {
	eg = eg0;

	trace = traceFlag; traceString = '';
	if (trace) {
		traceString += 'graph: ' + eg.toString(1,
							(g) => g<=26 ? '-ABCDEFGHIJKLMNOPQRSTUVWXYZ'[g] : g)
							+ '\nmatchings:\n';
	}

	Gamma_i = maxGroupCount(eg);
	let Cmin = lowerBound(eg);

	egl = new EdgeGroupLayers(eg,Gamma_i);
	buildLayers();

	let thickness = new Int32Array(Gamma_i+1);
	for (let l = 1; l <= egl.n_l; l++)
		thickness[l] = egl.layerThickness(l);
	let totalThickness = thickness.reduce((sum, v) => sum + v, 0);
	let maxThickness = Math.max(...thickness);

	if (trace) {
		traceString += `\nlayers:\n${egl.toString(1)}[${thickness.slice(1)}]\n`;
	}

	let egc = color(thickness, strict);
	let C = egc.maxColor();

	if (trace) {
		traceString += '\ncolors: ' + egc.toString(0);
	}
	return [egc, traceString, {'C': C, 'R': (C/Cmin).toFixed(2),
					  'thickness': totalThickness }];
}

/** Assign groups to layers, using maximum weight matchings to form layers.
 */
function buildLayers() {
	// create vector of graph inputs in decreasing order of group counts
	let invec = new Array(eg.n_i);
	for (let u = 1; u <= eg.n_i; u++) invec[u-1] = [u,eg.groupCount(u)];
	invec.sort((a,b) => b-a);

	// initialize each layer with a group at the first input of invec;
	// initialize olist, so olist[l]=outputs covered by layer i
	let egg = eg.graph;
	let olist = new Array(Gamma_i+1);
	for (let j = 1; j <= Gamma_i; j++) olist[j] = new List(egg.n);
	let [u] = invec[0]; let l = 1;
	for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) {
		egl.add(g,l);
		for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
			let v = egg.right(e); olist[l].enq(v); olist[l].value(v,1);
		}
		l++;
	}

	// create matching graph for expanding layers
	let mg = new Graph(Gamma_i+eg.n_g, Gamma_i*eg.n_g);
	mg.setBipartition(Gamma_i);

	// for each input u, use matching to assign groups at u to layers
	for (let j = 1; j < invec.length; j++) { 
		let [u] = invec[j];

		// construct matching graph with edges (l,g) where l is a layer and
		// g a group at u; set weight to number of outputs in olist[l] plus
		// number of outputs in g, all the resulting layer thickness
		mg.clear();
		for (let l = 1; l <= Gamma_i; l++) {
			for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) {
				let length = olist[l].length; let thick = 1;
				for (let e = eg.firstInGroup(g); e; e= eg.nextInGroup(g,e)) {
					let v = egg.right(e);
					if (olist[l].contains(v)) {
						thick = Math.max(thick, 1+olist[l].value(v));
					} else {
						length++;
					}
				}
				let me = mg.join(l,Gamma_i+g); 
				mg.weight(me, length / thick);
			}
		}

		// match groups in u to layers
		let [match] = wbimatchH(mg);
		if (trace) {
			traceString += matching2string(match) + '\n';
		}

		// add each matched group to it's paired layer and
		// add its outputs to the olist for that layer
		for (let e = match.first(); e; e = match.next(e)) {
			let l = mg.left(e); let g = mg.right(e)-Gamma_i;
			egl.add(g,l); let ol = olist[l];
			for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
				let v = egg.right(e);
				if (ol.contains(v)) {
					ol.value(v, 1+ol.value(v));
				} else {
					ol.enq(v); ol.value(v,1);
				}
			}
		}
	}
}

function matching2string(match) {
	let s = '['; let mg = match.g;
	let g2s = (g => g <= 26 ? '-ABCDEFGHIJKLMNOPQRSTUVWXYZ'[g] : g);
	for (let e = match.first(); e; e = match.next(e)) {
		let [l,g] =  [mg.left(e),mg.right(e)-Gamma_i];
		if (e != match.first()) s += ' ';
		let w = mg.weight(e);
		s += l + g2s(g) + ':' + (Number.isInteger(w) ? w : w.toFixed(2));
	}
	return s + ']';
}

/** Color the edges by layer.
 *  @param thickness is array of thickness values by layer
 *  @param strict is a flag which enforces disjoint color sets for each layer
 *  @return an EdgeGroupColors object
 */
function color(thickness, strict) {
	// create object to record colors in
	let totalThickness = thickness.reduce((sum,val)=>sum+val, 0);
	let egc = new EdgeGroupColors(eg, totalThickness);

	// for each layer, color edges with smallest available color
	let lastColor = 0;  // used for strict case
	for (let l = 1; l <= egl.n_l; l++) {
		let fc = strict ? lastColor+1 : 1;
		for (let c = fc; c <= lastColor + thickness[l]; c++) {
			for (let g = egl.firstInLayer(l); g; g = egl.nextInLayer(l,g)) {
				for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
					if (!egc.color(e) && egc.avail(c,e))
						egc.color(e,c);
				}
			}
		}
		lastColor += thickness[l];
	}
	return egc;
}
