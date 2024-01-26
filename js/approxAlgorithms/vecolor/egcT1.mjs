/** @file egcT1.mjs
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
import EdgeGroupColors from './EdgeGroupColors.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import {lowerBound, maxGroupCount, maxOutDegree} from './egcCommon.mjs';

let eg;		// shared reference to EdgeGroups object
let egl;	// shared reference to EdgeGroupLayers object

/** Find an edge group coloring using Turner's layer method.
 *  @param g is a group graph to be colored.
 *  @param strict is a flag; when true, edges in each layer are assigned
 *  disjoint sets of colors
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcT1(eg0, strict=false, trace=0) {
	eg = eg0;

	let ts = '';
	if (trace) {
		ts += 'graph: ' + eg.toString(1) + '\n';
	}

	let Gamma_i = maxGroupCount(eg);
	let Delta_o = maxOutDegree(eg);
	let Cmin = lowerBound(Gamma_i, Delta_o);

	egl = new EdgeGroupLayers(eg,Gamma_i);
	buildLayers(Gamma_i);

	let thickness = new Int32Array(Gamma_i+1);
	for (let l = 1; l <= egl.n_l; l++)
		thickness[l] = egl.layerThickness(l);
	let totalThickness = thickness.reduce((sum, v) => sum + v, 0);
	let maxThickness = Math.max(...thickness);

	if (trace) {
		ts += `layers:\n${egl.toString(1)}[${thickness.slice(1)}]\n`;
	}

	let egc = color(thickness, strict);
	let C = egc.maxColor();

	if (trace) {
		ts += 'colors: ' + egc.toString(0);
	}
	return [egc, ts, {'C': C, 'R': (C/Cmin).toFixed(2), 'thickness': totalThickness }];
}

/** Assign groups to layers, while trying to minimize the maximum
 *  layer thickness.
 *  @param Gamma_i is the maximum groupCount of any vertex.
 */
function buildLayers(Gamma_i) {
	let ocount = new Array(Gamma_i+1);
	let u = 1; while (eg.groupCount(u) < Gamma_i) u++;
	let l = 1;
	for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) {
		egl.add(g,l);
		ocount[l] = new Int32Array(eg.graph.n+1);
		for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e))
			ocount[l][eg.output(e)]++;
		ocount[l][0] = Math.max(...ocount[l]);  // layer thickness
		l++;
	}

	eg.sortAllGroups();
	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g)) {
		if (egl.layer(g)) continue;
		let bestThin = 0; let thinConflicts = 0;
		let bestThick = 0; let thickConflicts = 0;
		
		for (let l = 1; l <= Gamma_i; l++) {
			// if l contains a group with same hub as g, go on to next layer
			let skip = 0; let u = eg.hub(g);
			for (let gl = egl.firstInLayer(l); gl; gl = egl.nextInLayer(l,gl)) {
				if (eg.hub(gl) == u) { skip = 1; break; }
			}
			if (skip) continue;

			// count output conflicts of g with groups in l and determine
			// if g conflicts with a "thick" output
			let conflicts = 0; let gthick = 0;
			for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
				let v = eg.output(e);
				if (ocount[l][v] > 0) {
					conflicts++;
					if (ocount[l][v] == ocount[l][0])
						gthick = 1;
				}
			}
			// update bestThick or bestThin as appropriate
			if (gthick) {
				if (bestThick == 0 || conflicts < thickConflicts) {
					bestThick = l; thickConflicts = conflicts;
				}
			} else {
				if (bestThin == 0 || conflicts < thinConflicts) {
					bestThin = l; thinConflicts = conflicts;
				}
			}
		}
		let best = (bestThin ? bestThin : bestThick);
		if (best == 0) break;
		egl.add(g, best);
		for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
			let v = eg.output(e);
			ocount[best][v]++;
			if (ocount[best][v] > ocount[best][0]) ocount[best][0]++;
		}
	}
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
