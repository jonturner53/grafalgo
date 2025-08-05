/** @file egcKKPT.mjs
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
import egcBsearch from './egcBsearch.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import wbimatchH from '../../graphAlgorithms/match/wbimatchH.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';
import { lowerBound, maxOutDegree } from './egcCommon.mjs';

/** Find an edge group coloring using Turner's variant of Kirkpatrick,
 *  Klawe and Pippenger alorithm. If the graph to be colored has lower
 *  lower bounds defined, the colorint respects those bounds.
 *  @param g is a group graph to be colored.
 *  @param C is the number of colors available for coloring the edges
 *  @param egc is an optional coloring (possibly incomplete); it is
 *  used as the starting point for the returned coloring
 *  @return an EdgeGroupColors object
 */
export default function egcKKPT(eg, trace=0) {
	let Cmin = lowerBound(eg);
	let egc = egcBsearch(coreKKPT, eg, Cmin, 10*Cmin);
	assert(egc);

	let ts = '';
	if (trace) {
		ts += '\ngraph with palettes ' +
			  eg.toString(1,g=>egc.palette2string(g)) + '\n';
		ts += 'colors: ' + egc.toString(0);
	}

	let C = egc.maxColor();
	return [egc, ts, {'C': C, 'Cmin':Cmin, 'R': (C/Cmin).toFixed(2)}];
}

export function coreKKPT(eg, C, egc=0) {
	// define a palette graph
	let Delta_o = maxOutDegree(eg);
	let pg = new Graph(eg.n_g+C, Delta_o*C);
	pg.setBipartition(eg.n_g);

	// define a palette expansion graph
	let xg = new Graph(eg.n_g+C, Delta_o*C);
	xg.setBipartition(eg.n_g);

	if (!egc) egc = new EdgeGroupColors(eg, C);
	let clist = new List(C);
	for (let v = eg.n_i+1; v <= eg.n_i + eg.n_o; v++) {
		// first, check to see if v's edges can be colored with current palettes
		let dv = eg.graph.degree(v);
		pg.clear();
		for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
			let g = eg.group(e);
			for (let c = egc.firstColor(g); c; c = egc.nextColor(g,c)) {
				pg.join(g, eg.n_g+c);
			}
		}
		let [match] = bimatchHK(pg);
		if (match.size() == dv) continue;

		// Try to expand palettes for the groups with edges at v, without
		// increasing the total number of colors.
		// Do this by solving a min weight matching problem.
		xg.clear();
		for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
			let g = eg.group(e); let u = eg.hub(g);
			for (let c = 1; c <= C; c++) {
				if (eg.bound(g) > c) continue;
				if (egc.owner(c,u) && egc.owner(c,u) != g) continue;
				let xe = xg.join(g, eg.n_g+c);
				let cost = (eg.hasBounds ?
							(egc.paletteSize(g)+(c-eg.bound(g))) / eg.fanout(g) :
							 (egc.paletteSize(g) / eg.fanout(g))) ;
				xg.weight(xe, egc.owner(c,u) == g ? 2*C : 2*C-cost);
			}
		}

		[match] = wbimatchH(xg);
		for (let e = match.first(); e; e = match.next(e)) {
			let g = xg.left(e); let c = xg.right(e) - eg.n_g;
			if (!egc.owner(c,eg.hub(g))) egc.bind(c,g);
		}
	}
	egc.colorFromPalettes();
	return egc;
}
