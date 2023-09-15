/** @file egcBasicLayer.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';

/** Find an edge group coloring using basic layer method.
 *  @param g is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcBasicLayer(eg, strict=false, trace=0) {
	let ts = '';
	if (trace) {
		ts += 'graph: ' + eg.toString(5) + '\n';
	}

	let D = 0;
	for (let u = 1; u <= eg.ni; u++) {
		let d = 0;
		for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) d++;
		D = Math.max(D,d);
	}
	let layers = new EdgeGroupLayers(eg, D);

	// assign groups to layers, just assigning one group
	// from each input, proceeding in parallel down the input
	// group lists
	let nextAt = new Int32Array(eg.ni+1);
	for (let u = 1; u <= eg.ni; u++)
		nextAt[u] = eg.firstGroupAt(u);
	for (let l = 1; l <= layers.nl; l++) {
		for (let u = 1; u <= eg.ni; u++) {
			let g = nextAt[u];
			if (g) {
				layers.add(g,l);
				nextAt[u] = eg.nextGroupAt(u,g);
			}
		}	
	}

	let thickness = new Int32Array(layers.nl+1);
	let totalThickness = 0;
	for (let l = 1; l <= layers.nl; l++) {
		thickness[l] = layers.thickness(l);
		totalThickness += thickness[l];
	}

	if (trace) {
		ts += 'layers: ' + layers.toString() + '\n\n';
	}

	// create object to record colors in
	let egc = new EdgeGroupColors(eg, totalThickness);

	// for each layer, construct graph for layer and color it, then transfer
	// colors to egc.
	let lg = new Graph(eg.graph.n,eg.graph.edgeRange);	// layer graph
	let lastColor = 0;
	for (let l = 1; l <= layers.nl; l++) {
		lg.clear();
		for (let g = layers.firstInLayer(l); g; g = layers.nextInLayer(l,g)) {
			for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
				lg.join(eg.input(e), eg.output(e), e);
			}
		}
		for (let v = eg.ni+1; v <= eg.n; v++) {
			let c = strict ? lastColor + 1 : 1;
			for (let e = lg.firstAt(v); e; e = lg.nextAt(v,e)) {
				while (!egc.avail(c,e)) c++;
				egc.color(e,c++);
			}
		}
		lastColor += thickness[l];
	}

	if (trace) {
		ts += 'colors: ' + egc.toString();
	}
	return [egc, ts, {'Cmax': egc.maxColor() }];
}
