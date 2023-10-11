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
 *  @param refine is an integer which specifies the number of layer
 *  refinement steps to be performed
 *  @param strict is a flag; when true, edges in each layer are assigned
 *  disjoint sets of colors
 *  @return a triple [color, ts, stats] where color is an EdgeGroupColors
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function egcLayer(eg0, refine=2, strict=false, trace=0) {
	eg = eg0;

	let ts = '';
	if (trace) {
		ts += 'graph: ' + eg.toString(5) + '\n';
	}

	let D = maxGroupCount();
	egl = doLayers(D);
	for (let i = 1; i <= refine; i++) refineLayers(D);
	let lstats = layerStats();

	if (trace) {
		ts += `egl:${egl.toString()} [${lstats.thickness.slice(1)}] ` +
			  `${lstats.singles.toFixed(2)} ${lstats.multis.toFixed(2)}\n\n`;
	}

	// create object to record colors in
	let egc = color(lstats.thickness, strict);

	if (trace) {
		ts += 'colors: ' + egc.toString();
	}
	return [egc, ts, {'thickness': lstats.totalThickness/egl.n_l,
					  'singles': lstats.singles, 'multis': lstats.multis,
					  'Cmax': egc.maxColor() }];
}

function doLayers(D) {
	let layers = new EdgeGroupLayers(eg, D);

	// assign groups to layers, just assigning one group
	// from each input, proceeding in parallel down the input
	// group lists
	let nextAt = new Int32Array(eg.n_i+1);
	for (let u = 1; u <= eg.n_i; u++)
		nextAt[u] = eg.firstGroupAt(u);
	for (let l = 1; l <= D; l++) {
		for (let u = 1; u <= eg.n_i; u++) {
			let g = nextAt[u];
			if (g) {
				layers.add(g,l);
				nextAt[u] = eg.nextGroupAt(u,g);
			}
		}	
	}
	return layers;
}

/** Refine the collection of layers by shuffling groups at each input.
 *  @param D is the max number of groups in a layer
 */ 
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

	for (let i = 1; i <= eg.n_i; i++) {
		let u = vperm[i];	// so multiple calls use different random orders
		// construct a bipartite graph with edges connecting groups at input u;
		// each edge has a weight equal to its "replacement score" plus an offset
		// to eliminate negative edges
		sg.clear();
		for (let g1 = eg.firstGroupAt(u); g1; g1 = eg.nextGroupAt(u,g1)) {
			for (let g2 = eg.firstGroupAt(u); g2; g2 = eg.nextGroupAt(u,g2)) {
				let e = sg.join(pos[g1], D+pos[g2]);
				sg.weight(e, offset + replaceScore(g1,g2,ocount));
			}
		}

		let [match] = wbimatchH(sg,io);
		// let match' be directed version with extra edges (D+i,i) for all i;
		// for each cycle with positive weight in match', advance groups on cycle
		// mark matching edges on non-positive cycles
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

/** Compute replacement score for a pair of groups.
 *  @param g1 is a group at an input u
 *  @param g2 is a group at u (possibly the same)
 *  @param ocount is the output counts for the layers
 *  @return the score associated with replacing g2 with g1 in the layer for g2;
 *  score is incremented for every v for which ocount[v] gets closer to 1;
 *  decremented for those v where ocount[v] moves away from 1;
 *  extra increment/decrement when ocount[v] has largest value in its layer
 */
let vlist = null;	// temporary list of vertices

function replaceScore(g1, g2, ocount) {
	if (g1 == g2) return 0;
	let l1 = egl.layer(g1); let l2 = egl.layer(g2);

	if (!vlist || vlist.n != eg.graph.n)
		vlist = new List(eg.graph.n);

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

/** Color the edges by layer.
 *  @param thickness is array of thickness values by layer
 *  @param strict is a flag which enforces disjoint color sets for each layer
 *  @return an EdgeGroupColors object
 */
function color(thickness, strict) {
	let totalThickness = thickness.reduce((sum,val)=>sum+val, 0);
	// create object to record colors in
	let egc = new EdgeGroupColors(eg, totalThickness);

	// for each layer, color edges with smallest available color
	let lastColor = 0;  // used for strict case
	for (let l = 1; l <= egl.n_l; l++) {
		let fc = strict ? lastColor+1 : 1;
		for (let c = fc; c <= lastColor + thickness[l]; c++) {
			for (let g=egl.firstInLayer(l); g; g=egl.nextInLayer(l,g)) {
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

/** Compute the maximum number of groups at an input. */
function maxGroupCount() {
	// let D be the max number of groups at an input
	let D = 0;
	for (let u = 1; u <= eg.n_i; u++) {
		let d = 0;
		for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) d++;
		D = Math.max(D,d);
	}
	return D;
}

/** Compute a statistics object for the layers. */
function layerStats() {
	let thickness = new Int32Array(egl.n_l+1);
	let singles = 0; 
	let multis = 0;
	let totalThickness = 0;
	for (let l = 1; l <= egl.n_l; l++) {
		let [t,s,m] = egl.layerStats(l);
		thickness[l] = t; totalThickness += t;
		singles += s; multis += m;
	}
	singles /= egl.n_l; multis /= egl.n_l;
	return {'thickness': thickness, 'totalThickness': totalThickness,
			'singles': singles, 'multis': multis};
}
