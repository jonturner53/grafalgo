/** @file egcT2.mjs
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

let eg;		// shared reference to EdgeGroups object
let egc;	// shared reference to EdgeGroupColors object

let colorCount;          // colorCount[u] is number of colors in use at u
let coloredGroupCount;   // coloredGroupCount[u] # of colored groups at u

/** Find an edge group coloring using Turner's hybrid algorithm.
 *  @param g is a group graph to be colored.
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */

export default function egcT2(eg0, trace=0) {
	eg = eg0; eg.sortAllGroups();
	let ts = '';

	let Gamma_i = maxGroupCount(eg);
	let Delta_o = maxOutDegree(eg);
	let Cmin = lowerBound(Gamma_i, Delta_o);

	// identify viable range of values for binary search.
	let lo = Cmin; let hi = lo;
	while(1) {
		egc = new EdgeGroupColors(eg, hi);
		colorCount = new Int32Array(hi+1);
		coloredGroupCount = new Int32Array(hi+1);
		if (colorAllGroups(hi) || expandPalettes(hi, Delta_o))
			break;
		lo = hi+1; hi *= 2;
	}
	// now proceed with binary search
	let C;
	while (lo < hi) {
		C = ~~((lo + hi)/2);
		if (colorAllGroups(C) || expandPalettes(C, Delta_o))
			hi = C;
		else
			lo = C+1;
	}
	C = hi;

	colorAllGroups(C) || expandPalettes(C, Delta_o);

	if (trace) {
		ts += '\ngraph with palletes ' +
			  eg.toString(1,g=>egc.palette2string(g)) + '\n';
		ts += 'colors: ' + egc.toString(0);
	}
	return [egc, ts, {'C': C, 'R': (C/Cmin).toFixed(2)}]
}

function colorAllGroups(C) {
	egc.clear(); colorCount.fill(0); coloredGroupCount.fill(0);
	let success = true;
	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g)) {
		if (!colorGroup(g, C)) success = false;
	}
	return success;
}

/** Assign colors to one group.
 *  @param g is group number
 *  @param C is the largest color
 *  @return the number of uncolored edges
 */
function colorGroup(g, C) {
	// set limit on # of colors per group
	let u = eg.hub(g);
	let limit = Math.ceil((C - colorCount[u]) /
						  (eg.groupCount(u) - coloredGroupCount[u]));
	let colored = 0; // number of edges colored so far
	let k = 0; // number of colors used so far

	while (k < limit && colored < eg.fanout(g)) {
		// first find best color for the remaining uncolored edges
		let bestColor = 0; let bestCount = 0;
		for (let c = 1; c <= C; c++) {
			let count = 0;
			for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
				if (egc.color(e) == 0 && egc.avail(c,e)) count++;
			}
			if (count > bestCount) {
				bestColor = c; bestCount = count;
			}
			// stop early if c can color all remaining edges
			if (colored + bestCount == eg.fanout(g)) break;
		}
		if (!bestColor) break;
		for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e)) {
			if (egc.color(e) == 0 && egc.avail(bestColor,e)) {
				egc.color(e,bestColor); colored++;
			}
		}
		k++;
	}
	if (colored != eg.fanout(g)) return false;
	colorCount[u] += k; coloredGroupCount[u]++;
	return true;
}

function expandPalettes(C, Delta_o) {
	// define a palette graph
	let pg = new Graph(eg.n_g+C, Delta_o*C);
	let io = new ListPair(eg.n_g + C);
	for (let g = 1; g <= eg.n_g; g++) io.swap(g);
	pg.setBipartition(io);

	// define a palette expansion graph
	let xg = new Flograph(eg.n_g+C+2, Delta_o*C + Delta_o + C);
	xg.source = xg.n-1; xg.sink = xg.n;

	for (let v = eg.n_i+1; v <= eg.n_i + eg.n_o; v++) {
		let dv = eg.graph.degree(v);
		// first, check to see if v's edges can be colored with current palettes
		pg.clear();
		for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
			egc.color(e,0);		// removes color but does not affect palette
			let g = eg.group(e); let u = eg.hub(g);
			for (let c = egc.firstColor(g); c; c = egc.nextColor(g,c)) {
				pg.join(g, eg.n_g+c);
			}
		}
		let [match] = bimatchHK(pg,0,io);
		if (match.size() == dv) continue;

		// Expand palette's for the groups with edges at v as needed.
		// Do this by solving a mincost flow problem.
		xg.clear(); let uncolored = 0;
		for (let e = eg.graph.firstAt(v); e; e = eg.graph.nextAt(v,e)) {
			if (!egc.color(e)) uncolored++;
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
		if (uncolored == 0) continue;
		mcflowJEK(xg);
		if (xg.totalFlow() != eg.graph.degree(v)) return false;
		for (let e = xg.firstOutof(xg.source); e;
				 e = xg.nextOutof(xg.source,e)) {
			let g = xg.mate(xg.source,e); let u = eg.hub(g);
			for (let xe = xg.firstOutof(g); xe; xe = xg.nextOutof(g,xe)) {
				let c = xg.mate(g,xe) - eg.n_g;
				if (xg.f(xe) == 1 && !egc.owner(c,u)) egc.bind(c,g);
			}
		}
	}
	egc.colorFromPalettes();
	return true;
}
