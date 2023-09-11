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

/** Find an edge group coloring using basic layer method.
 *  @param g is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is a GroupColors object,
 *  ts is a traceString and stats is a statistics object.
 */
export default function egcBasicLayer(gg, trace=0) {
	let layers = new EggLayers(gg, gg.maxGroupDegree());

	// assign groups to layers, just taking assigning one group
	// from each input, proceeding in parallel down the input
	// group lists
	let nextAt = new Int32Array(gg.ni+1);
	for (let u = 1; u <= gg.ni; u++)
		nextAt[u] = gg.firstGroupAt(u);
	for (let l = 1; l <= layers.nl; l++) {
		for (let u = 1; u <= gg.ni; u++) {
			let g = nextAt[u];
			if (g) {
				layers.add(g,l);
				nextAt[u] = gg.nextGroupAt(u,g);
			}
		}	
	}

	let thickness = new Int32Array(layers.nc+1);
	let totalThickness = 0;
	for (let l = 1; l <= layers.nl; l++) {
		thickness[l] = layers.thickness(l);
		totalThickness += thickness[l];
	}

	// create object to record colors in
	let gc = new GroupColors(gg, totalThickness);

	// for each layer, construct graph for layer and color it, then transfer
	// colors to gc.
	let lg = new Graph(gg.n,gg.edgeRange);	// layer graph
	let lastColor = 0;
	for (let l = 1; l <= layers.nl; l++) {
		lg.clear();
		for (let g = layers.firstInLayer(l); g; g = layers.nextInLayer(l,g)) {
			for (let e = gg.firstInGroup(g); e; e = gg.nextInGroup(g,e)) {
				lg.join(gg.input(e), gg.output(e), e);
			}
		}
		let [layerColors] = ecolorG(lg);
		for (let e = lg.first(); e; e = lg.next(e))
			gc.color(e, lastColor + layerColors[e]);
		lastColor += thickness[l];
	}
	return [gc, ts, {'Cmax': gc.maxColor(), 'steps': steps }];
}
