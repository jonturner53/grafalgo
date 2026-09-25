/** @file fcolorKKPT.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Assert.mjs';
import {randomPermutation, scramble} from '../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import fcolorBsearch from './fcolorBsearch.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import wbimatchH from '../../graphAlgorithms/match/wbimatchH.mjs';
import { lowerBounds } from './common.mjs';

/** Find a fan coloring using Turner's variant of Kirkpatrick,
 *  Klawe and Pippenger alorithm. If the graph to be colored has lower
 *  lower bounds defined, the colorint respects those bounds.
 *  @param g is a fan graph to be colored.
 *  @param C is the number of colors available for coloring the edges
 *  @param fcolor is an optional coloring (possibly incomplete); it is
 *  used as the starting point for the returned coloring
 *  @return an EdgeGroupColors object
 */
export default function fcolorKKPT(g, trace=0) {
	let cmin = Math.max(...lowerBounds(g));
	fcolorBsearch(coreKKPT, g, cmin, g.crange);

	let ts = '';
	if (trace) ts += g.toString(0x9);

	let cmax = g.cmax;
	return [ts, {'cmax': cmax, 'cmin':cmin, 'max/min': (cmax/cmin).toFixed(2)}];
}

export function coreKKPT(g, C) {
	// define a palette graph
	let [,Delta_o] = g.maxDegree();
	let pg = new Graph(g.nf+C, Delta_o*C);
	pg.setBipartition(g.nf);

	// define a palette expansion graph
	let xg = new Graph(g.nf+C, Delta_o*C, 'weight', 0);
	xg.setBipartition(g.nf);

	let clist = new List(C);
	for (let v = g.ni+1; v <= g.ni + g.no; v++) {
		// first, check to see if v's edges can be colored with current palettes
		let dv = g.degree(v);
		pg.clear();
		for (let e = g.firstAt(v); e; e = g.nextAt(v,e)) {
			let f = g.fan(e);
			for (let c = g.firstColor(f); c; c = g.nextColor(f,c)) {
				pg.join(f, g.nf+c);
			}
		}
		let [match] = bimatchHK(pg);
		if (match.size() == dv) continue;

		// Try to expand palettes for the fans with edges at v, without
		// increasing the total number of colors.
		// Do this by solving a min weight matching problem.
		xg.clear();
		for (let e = g.firstAt(v); e; e = g.nextAt(v,e)) {
			let f = g.fan(e); let u = g.hub(f);
			for (let c = 1; c <= C; c++) {
				if (g.tint && g.tint(f) > c) continue;
				if (g.owner(c,u) && g.owner(c,u) != f) continue;
				let xe = xg.join(f, g.nf+c);
				let cost = (g.tint ?
					(g.paletteSize(f)+(c-g.tint(f))) / g.fanout(f) :
					(g.paletteSize(f) / g.fanout(f))) ;
						// perhaps square the paletteSize?
				xg.weight(xe, g.owner(c,u) == f ? 2*C : 2*C-cost);
			}
		}

		[match] = wbimatchH(xg);
		for (let e = match.first(); e; e = match.next(e)) {
			let f = xg.left(e); let c = xg.right(e) - g.nf;
			if (!g.owner(c,g.hub(f))) g.bind(c,f);
		}
	}
	g.colorFromPalettes();
}
