/** @file egcKKP2.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import {randomPermutation, scramble} from '../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import {wcUbound} from './egcCommon.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';

let eg;		// shared reference to EdgeGroups object

let D_i;          // max number of groups per input
let Delta_o;      // max number of edges per output
let Cmin;         // lower bound on # of colors required

let paletteLists; // paletteLists[u] divides colors among palettes
				  // of groups at u
let firstColor;   // firstColor[g] is first color in g's palette

let paletteGraph; // used to check that the edges at an output can
                  // all be colored
let io;           // io separates paletteGraph inputs from outputs

/** Find an edge group coloring using random palette method.
 *  @param g is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcKKP2(eg0, trace=0) {
	eg = eg0; let ts = '';

	D_i = 0;
	for (let u = 1; u <= eg.n_i; u++)
		D_i = Math.max(D_i, eg.groupCount(u));
	let Delta_o = 0;
	for (let v = eg.n_i + 1; v <= eg.n_i + eg.n_o; v++)
		Delta_o = Math.max(Delta_o, eg.graph.degree(v));

	let Cmin = Math.max(D_i, Delta_o);
	let ubound = wcUbound(D_i,Delta_o,eg.n_o);

	let pg = new Graph(eg.n_g+ubound, Delta_o*ubound);
	io = new ListPair(eg.n_g + ubound);
	for (let g = 1; g <= eg.n_g; g++) io.swap(g);

	let xg = new Flograph(eg.n_g+ubound+2, Delta_o*ubound + eg.n_g + ubound);
	xg.setSource(xg.n-1); xg.setSink(xg.n);

	let egc = new EdgeGroupColors(eg, ubound) ;

	let topColor = Cmin; let lastTopColor = topColor; let colorGrowth = ''; 
	let quick = 0;
	for (let v = eg.n_i+1; v <= eg.n_i + eg.n_o; v++) {
		// first check to see if v's edges can be colored with current palettes
		let dv = eg.graph.degree(v);
		pg.clear();
		for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
			let g = eg.group(e); let u = eg.hub(g);
			for (let c = egc.firstColor(g); c; c = egc.nextColor(g,c)) {
				pg.join(g, eg.n_g+c);
			}
		}
		let [match] = bimatchHK(pg,0,io);
		if (match.size() == dv) { quick++; continue; }

		// Try to expand palette's for the groups with edges at v, without
		// increasing the total number of colors.
		// Do this by solving a mincost flow problem.
		xg.clear();
		for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
			let g = eg.group(e); let u = eg.hub(g);
			let psize = egc.paletteSize(g);
			let xe = xg.join(xg.source,g); xg.cap(xe,1);
			for (let c = 1; c <= topColor; c++) {
				if (egc.owner(c,u) && egc.owner(c,u) != g) continue;
				let cv = eg.n_g+c;
				xe = xg.join(g, cv); xg.cap(xe, 1);
				xg.cost(xe, egc.owner(c,u) == g ? 0 : psize);
				if (!xg.firstOut(cv)) {
					xe = xg.join(cv,xg.sink); xg.cap(xe, 1);
				}
			}
		}
		mcflowJEK(xg);
		for (let e = xg.firstOut(xg.source); e; e = xg.nextOut(xg.source,e)) {
			let g = xg.mate(xg.source,e); let u = eg.hub(g);
			if (xg.f(e) == 1) {
				for (let xe = xg.firstOut(g); xe; xe = xg.nextOut(g,xe)) {
					let c = xg.mate(g,xe)-eg.n_g;
					if (xg.f(xe) == 1 && !egc.owner(c,u)) {
						egc.bind(c,g);
					}
				}
			} else {
				// remove colors in g's palette and add new color to it
				//for (let c = egc.firstColor(g); c; c = egc.firstColor(g))
				//	egc.release(c,g);
				egc.bind(++topColor,g);
			}
		}
		if (topColor > lastTopColor) {
			colorGrowth += eg.graph.x2s(v) + ':' + topColor + ' ';
			lastTopColor = topColor;
		}
	}

	if (trace) {
		ts += '\ngraph with palletes ' + eg.toString(1,g=>egc.palette2string(g)) + '\n';
	}

	egc.colorFromPalettes();

	if (trace) {
		ts += 'colors: ' + egc.toString(0);
	}
	return [egc, ts, {'Cmax': topColor, 'ubound': ubound}]
}
