/** @file egcLayer.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ListSet from '../../dataStructures/basic/ListSet.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import EdgeGroupColors from './EdgeGroupColors.mjs';
import EdgeGroupLayers from './EdgeGroupLayers.mjs';
import wbimatchH from '../../graphAlgorithms/match/wbimatchH.mjs';
import findSplit from '../../graphAlgorithms/misc/findSplit.mjs';
import {randomPermutation} from '../../common/Random.mjs';

let eg;		// shared reference to EdgeGroups object
let egl;	// shared reference to EdgeGroupLayers object

/** Find an edge group coloring using basic layer method.
 *  @param g is a group graph to be colored.
 *  @param strict is a flag; when true, edges in each layer are assigned
 *  disjoint sets of colors
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcLayer(eg0, strict=false, trace=0) {
	eg = eg0;

	let ts = '';
	if (trace) {
		ts += 'graph: ' + eg.toString(1) + '\n';
	}

	let D = 0;
	for (let u = 1; u <= eg.n_i; u++)
		D = Math.max(D,eg.groupCount(u));

	egl = new EdgeGroupLayers(eg,D);
	doLayers(D);
	//egl.sortLayers();

	let thickness = new Int32Array(D+1);
	for (let l = 1; l <= egl.n_l; l++)
		thickness[l] = egl.layerThickness(l);
	let totalThickness = thickness.reduce((sum, v) => sum + v, 0);
	let maxThickness = Math.max(...thickness);

	if (trace) {
		ts += `layers:\n${egl.toString(1)}[${thickness.slice(1)}]\n`;
	}

	// create object to record colors in
	let egc = color(thickness, strict);

	if (trace) {
		ts += 'colors: ' + egc.toString(0);
	}
	return [egc, ts, {'thickness': totalThickness/D, 'maxThickness': maxThickness,
					  'Cmax': egc.maxColor() }];
}

/** Assign groups to layers, while trying to minimize the maximum
 *  layer thickness.
 *  @param D is the maximum groupCount of any vertex.
 */
function doLayers(D) {
	let ocount = new Array(D+1);
	let u = 1; while (eg.groupCount(u) < D) u++;
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
		
		for (let l = 1; l <= D; l++) {
			// if l contains a group with same hub as g, go on to next layer
			let skip = 0; let u = eg.hub(g);
			for (let gl = egl.firstInLayer(l); gl; gl = egl.nextInLayer(l,gl)) {
				if (eg.hub(gl) == u) { skip = 1; break; }
			}
			if (skip) continue;

			// count output conflicts of g with groups in l and determine
			// if g conflicts a "thick" output
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

/** Refine the collection of layers by shuffling groups at each input.
 *  @param D is the max number of groups in a layer
function refineLayers(D) {
	// for each layer, let ocount[l][v] be the number of edges in layer l
	// that touch output v
	let ocount = new Array(D+1);
	for (let l = 1; l <= D; l++) {
		ocount[l] = new Int32Array(eg.graph.n+1);
		for (let g = egl.firstInLayer(l); g; g = egl.nextInLayer(l,g)) {
			for (let e = eg.firstInGroup(g); e; e = eg.nextInGroup(g,e))
				ocount[l][eg.output(e)]++;
			ocount[l][0] = Math.max(...ocount[l]);  // layer thickness
		}
	}
	// for each group g, let pos[g] be the position of group g within the
	// list of groups at its hub; and let grp[u][i] be the group at position i
	// in u's list of groups
	let pos = new Int32Array(eg.n_g+1);
	let grp = new Array(eg.n_i+1);
	for (let u = 1; u <= eg.n_i; u++) {
		grp[u] = new Int32Array(D+1);
		let i = 1;
		for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) {
			pos[g] = i; grp[u][i] = g; i++;
		}
	}
	let sg = new Graph(2*D, D*D);
	let io = new ListPair(2*D);
	for (let i = 1; i <= D; i++) io.swap(i);
	let mark = new Int8Array(D*D+1);
	let layer = new Int32Array(eg.n_g+1);
	let vperm = randomPermutation(eg.n_i);
	let offset = eg.graph.n;
	let vlist = new List(eg.graph.n); // temporary list used by replaceScore

	for (let i = 1; i <= eg.n_i; i++) {
		let u = i;//vperm[i];	// so multiple calls use different random orders
		// construct a bipartite graph with edges connecting groups at input u;
		// each edge has a weight equal to its "replacement score" plus an
		// offset to eliminate negative edges
		sg.clear();
		for (let g1 = eg.firstGroupAt(u); g1; g1 = eg.nextGroupAt(u,g1)) {
			for (let g2 = eg.firstGroupAt(u); g2; g2 = eg.nextGroupAt(u,g2)) {
				let e = sg.join(pos[g1], D+pos[g2]);
				sg.weight(e, offset + replaceScore(g1, g2 ,ocount, vlist));
			}
		}

		let [match] = wbimatchH(sg,io);
		// consider graph obtained by mapping each matching edge {i,D+j} (i!=j) to
		// a directed edge (i,j); this graph defines a collection of disjoint
		// cycles; advance groups along the cycles of positive weight
		mark.fill(0);
		for (let e = match.first(); e; e = match.next(e)) {
			if (mark[e]) continue; // already seen e on earlier cycle
			let me = e; let cycleWeight = 0;
			do { 
				mark[me] = 1;
				cycleWeight += (sg.weight(me) - offset);
				me = match.at(sg.right(me)-D);
			} while (me != e);
			if (cycleWeight > 0) continue;
			// cycle containing e has non-positive weight
			me = e;
			do { 
				mark[me] = -1;
				me = match.at(sg.right(me)-D);
			} while (me != e);
		}
		// now all bad cycle edges have mark == -1
		for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g))
			layer[g] = egl.layer(g);
			// make copy of groups' layers before moving them around
		for (let e = match.first(); e; e = match.next(e)) {
			if (mark[e] == -1) continue;
			let g1 = grp[u][sg.left(e)]; let g2 = grp[u][sg.right(e)-D];
			let l1 = layer[g1]; let l2 = layer[g2];
			egl.delete(g1, l1); egl.add(g1, l2);
			for (let ee=eg.firstInGroup(g1); ee; ee=eg.nextInGroup(g1,ee)) {
				let v = eg.output(ee); ocount[l1][v]--; ocount[l2][v]++;
			}
		}
		// update layer thickness values
		for (let l = 1; l <= D; l++) {
			ocount[l][0] = 0; ocount[l][0] = Math.max(...ocount[l]);
		}
	}
}
 */ 

/** Compute replacement score for a pair of groups.
 *  @param g1 is a group at an input u
 *  @param g2 is a group at u (possibly the same)
 *  @param ocount is the output counts for the layers
 *  @param vlist is a temporary list used in the computation; it is created
 *  by the caller to reduce overhead in the score computations
 *  @return the score associated with replacing g2 with g1 in the layer for g2;
 *  score is incremented for every v for which ocount[v] gets closer to 1;
 *  decremented for those v where ocount[v] moves away from 1;
 *  extra increment/decrement when ocount[v] has largest value in its layer
function replaceScore(g1, g2, ocount, vlist) {
	if (g1 == g2) return 0;
	let l1 = egl.layer(g1); let l2 = egl.layer(g2);

	// first, determine the effect of moving g1 into l2
	vlist.clear();
	// first place outputs in g2's layer in vlist
	for (let e = eg.firstInGroup(g2); e; e = eg.nextInGroup(g2,e)) {
		let v = eg.output(e);
		if (!vlist.contains(v)) vlist.enq(v);
	}
	let score = 0;
	for (let e = eg.firstInGroup(g1); e; e = eg.nextInGroup(g1,e)) {
		let v = eg.output(e);
		if (vlist.contains(v)) continue;
		if (ocount[l2][v] == 0) score++;
		else score--;
		if (ocount[l2][v] == ocount[l2][0]) score--;
	}

	// now, determine the effect of moving g2 out of l2
	vlist.clear();
	for (let e = eg.firstInGroup(g1); e; e = eg.nextInGroup(g1,e)) {
		let v = eg.output(e);
		if (!vlist.contains(v)) vlist.enq(v);
	}
	for (let e = eg.firstInGroup(g2); e; e = eg.nextInGroup(g2,e)) {
		let v = eg.output(e);
		if (vlist.contains(v)) continue;
		if (ocount[l2][v] > 1) score++;
		else score--;
		if (ocount[l2][v] == ocount[l2][0]) score++;
	}
	return score;
}
 */

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

