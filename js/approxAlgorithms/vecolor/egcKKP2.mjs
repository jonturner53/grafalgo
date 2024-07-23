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
import {lowerBound, maxGroupCount, maxOutDegree} from './egcCommon.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';

let eg;          // shared reference to EdgeGroups object
let egc;         // shared reference to EdgeGroupColors object

let Delta_o;     // max degree of an output

/** Find an edge group coloring using random palette method.
 *  @param g is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcKKP2(eg0, trace=0) {
	eg = eg0;
	let ts = '';

	Delta_o = maxOutDegree(eg);
	let Gamma_i = maxGroupCount(eg);
	let Cmin = lowerBound(Gamma_i, Delta_o);

	// identify viable range of values for binary search.
	let lo = Cmin; let hi = lo;
	while(1) {
		egc = new EdgeGroupColors(eg, hi);
		if (buildPalettes(hi)) break;
		lo = hi+1; hi *= 2;
	}
	// now proceed with binary search
	let C;
	while (lo < hi) {
		C = ~~((lo + hi)/2);
		if (buildPalettes(C)) hi = C;
		else lo = C+1;
	}
	C = hi;
	buildPalettes(C);

	if (trace) {
		ts += '\ngraph with palletes ' +
			  eg.toString(1,g=>egc.palette2string(g)) + '\n';
	}

	egc.colorFromPalettes();

	if (trace) {
		ts += 'colors: ' + egc.toString(0);
	}
	return [egc, ts, {'C': C, 'R': (C/Cmin).toFixed(2)}]
}

/** Build collection of color palettes.
 *  @param C is the number of colors to use in the palettes
 *  @return true if the computed palettes are sufficient to color all
 *  the edges; the computed palettes are returned in egc.
 */
function buildPalettes(C) {
	egc.clear;

	// define a palette graph
	let pg = new Graph(eg.n_g+C, Delta_o*C);
	let io = new ListPair(eg.n_g + C);
    for (let g = 1; g <= eg.n_g; g++) io.swap(g);
	pg.setBipartition(io);

	// define a palette expansion graph
	let xg = new Flograph(eg.n_g+C+2, Delta_o*C + Delta_o + C);
	xg.source = xg.n-1; xg.sink = xg.n;

	egc.clear();
	
	let clist = new List(C);
	for (let v = eg.n_i+1; v <= eg.n_i + eg.n_o; v++) {
		// first, check to see if v's edges can be colored with current palettes
		let dv = eg.graph.degree(v);
		pg.clear();
		for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
			let g = eg.group(e); let u = eg.hub(g);
			for (let c = egc.firstColor(g); c; c = egc.nextColor(g,c)) {
				pg.join(g, eg.n_g+c);
			}
		}
		let [match] = bimatchHK(pg,0,io);
		if (match.size() == dv) continue;

		// Try to expand palette's for the groups with edges at v, without
		// increasing the total number of colors.
		// Do this by solving a mincost flow problem.
		xg.clear();
		for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
			let g = eg.group(e); let u = eg.hub(g);
			let psize = egc.paletteSize(g);
			let xe = xg.join(xg.source,g); xg.cap(xe,1);
			for (let c = 1; c <= C; c++) {
				if (egc.owner(c,u) && egc.owner(c,u) != g) continue;
				let cv = eg.n_g+c;
				xe = xg.join(g, cv); xg.cap(xe, 1);
				xg.cost(xe, egc.owner(c,u) == g ? 0 : psize);
				if (!xg.firstOutof(cv)) {
					xe = xg.join(cv,xg.sink); xg.cap(xe, 1);
				}
			}
		}
		mcflowJEK(xg);
		if (xg.totalFlow() != dv) return false;
		for (let e = xg.firstOutof(xg.source); e;
				 e = xg.nextOutof(xg.source,e)) {
			let g = xg.mate(xg.source,e); let u = eg.hub(g);
			for (let xe = xg.firstOutof(g); xe; xe = xg.nextOutof(g,xe)) {
				let c = xg.mate(g,xe) - eg.n_g;
				if (xg.f(xe) == 1 && !egc.owner(c,u)) {
					egc.bind(c,g);
				}
			}
		}
	}
	return true;
}
