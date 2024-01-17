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
import Flograph from '../../dataStructures/graphs/flograph.mjs';
import mcflowJEK from '../../graphAlgorithms/mcflow/mcflowJEK.mjs';
import bimatchHK from '../../graphAlgorithms/match/bimatchHK.mjs';
import {wcUbound, maxOutDegree} from './egcCommon.mjs';
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

	let Gamma_i = 0;
	for (let u = 1; u <= eg.n_i; u++)
		Gamma_i = Math.max(Gamma_i, eg.groupCount(u));
	let Delta_o = 0;
	for (let v = eg.n_i + 1; v <= eg.n_i + eg.n_o; v++)
		Delta_o = Math.max(Delta_o, eg.graph.degree(v));

	// Yang and Masson bound
	let k = 2;
	let b0 = (Gamma_i-1)*k + (Delta_o-1)*(eg.n_o**(1/k)) + 1;
	let b1 = (Gamma_i-1)*(k+1) + (Delta_o-1)*(eg.n_o**(1/(k+1))) + 1;
	while (b0 > b1) {
		k++;
		b0 = b1;
		b1 = (Gamma_i-1)*(k+1) + (Delta_o-1)*(eg.n_o**(1/(k+1))) + 1;
	}
	let ubound = Math.ceil(b0);

	egc = new EdgeGroupColors(eg, ubound);
	colorCount = new Int32Array(ubound+1);
	coloredGroupCount = new Int32Array(ubound+1);

	let lo = Math.max(Gamma_i, Delta_o); let hi = ubound;
	let C; let best;
	while (lo < hi) {
		C = ~~((lo + hi)/2);
		if (colorAll(C) || tryAgain(C)) {
			best = egc; hi = C;
		} else {
			lo = C+1;
		}
	}
	C = hi;

	colorAll(C) || tryAgain(C);

	if (trace) {
		ts += '\ngraph with palletes ' +
			  eg.toString(1,g=>egc.palette2string(g)) + '\n';
		ts += 'colors: ' + egc.toString(0);
	}
	return [egc, ts, {'Cmax': C, 'ubound': ubound}]
}

function colorAll(C) {
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

function tryAgain(C) {
	let egg = eg.graph;

	// define palette extension graph
	let Delta_o = maxOutDegree(eg);
	let pxg = new Graph(eg.n_g+egc.n_c, Delta_o*egc.n_c);
	let io = new ListPair(eg.n_g + egc.n_c);
	for (let g = 1; g <= eg.n_g; g++) io.swap(g);

	let uncolored = new List(eg.graph.edgeRange);
		// uncolored edges at current output
	for (let v = eg.n_i+1; v <= egg.n; v++) {
		uncolored.clear();
		for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
			if (!egc.color(e)) uncolored.enq(e);
		}
		if (uncolored.length == 0) continue;
		recolor(v,uncolored);
		while (uncolored.length > 0) {
			// try to extend palettes of groups with uncolored edges at v
			pxg.clear();
			for (let e = uncolored.first(); e; e = uncolored.next(e)) {
				let g = eg.group(e); let u = eg.hub(g);
				for (let c = 1; c <= C; c++) {
					if (!egc.owner(c,u) && egc.usage(c,v) == 0)
						pxg.join(g, eg.n_g+c);
				}
			}
			let [match] = bimatchHK(pxg,0,io);
			if (match.size() == 0) {
				// try to extend palettes of other groups at v
				for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
					if (uncolored.contains(e)) continue;
					let g = eg.group(e); let u = eg.hub(g);
					for (let c = 1; c <= C; c++) {
						if (!egc.owner(c,u) && egc.usage(c,v) == 0)
							pxg.join(g,eg.n_g+c);
					}
				}
				[match] = bimatchHK(pxg,0,io);
			}
			if (match.size() == 0) return false;
		
			// add matched colors to palettes
			for (let e = match.first(); e; e = match.next(e)) {
				let [g,c] = [pxg.left(e),pxg.right(e)-eg.n_g];
				egc.bind(c,g);
			}

			// and recolor with expanded palettes
			recolor(v,uncolored);
		}
	}
	return true;
}

function recolor(v,uncolored) {
	let egg = eg.graph;

	// construct palette graph for v and find matching
	let Delta_o = maxOutDegree(eg);
	let pg = new Graph(eg.n_g+egc.n_c, Delta_o*egc.n_c);
	let io = new ListPair(eg.n_g + egc.n_c);
	for (let g = 1; g <= eg.n_g; g++) io.swap(g);
	for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
		let g = eg.group(e);
		for (let c = egc.firstColor(g); c; c = egc.nextColor(g,c)) {
			pg.join(g,eg.n_g+c);
		}
	}
	let [match] = bimatchHK(pg,0,io);

	// color edges using matching
	uncolored.clear();
	for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
		let g = eg.group(e); let u = eg.hub(g);
		let me = match.at(g);
		if (!me) { uncolored.enq(e); continue; }
		let c = pg.mate(g,me) - eg.n_g;
		let cc = egc.color(e);
		if (c == cc) continue;
		egc.color(e, c);
		//if (egc.usage(cc,u) == 0) egc.release(cc,g);
			// release redundant colors from their palettes
	}
}
