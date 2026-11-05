/** @file fcolorTl.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import wbimatchH from '../../graphAlgorithms/match/wbimatchH.mjs';
import FanLayers from './FanLayers.mjs';

let g;	// shared reference to EGGraph object
let egl;	// shared reference to FanLayers object
let fcMax;  // largest fan count

let trace;
let traceString;

/** Find an edge fan coloring using Turner's layering method.
 *  @param g0 is a fan graph to be colored.
 *  @param strict is a flag; when true, edges in each layer are assigned
 *  disjoint sets of colors
 *  @return pair [ts, stats]; the coloring is returned in g
 *  object, ts is a traceString and stats is a statistics object.
 */
export default function fcolorTl(g0, strict=false, traceFlag=0) {
	g = g0;

	trace = traceFlag; traceString = '';

	fcMax = g.maxFanCount();
	let [,odMax] = g.maxDegree();
	let cmin = Math.max(fcMax,odMax);

	egl = new FanLayers(g,fcMax);
	buildLayers();

	let thickness = new Int32Array(fcMax+1);
	for (let l = 1; l <= egl.nl; l++)
		thickness[l] = egl.layerThickness(l);
	let totalThickness = thickness.reduce((sum, v) => sum + v, 0);
	let maxThickness = Math.max(...thickness);

	if (trace) {
		traceString += `\nlayers:\n${egl.toString(1)}[${thickness.slice(1)}]\n`;
	}

	color(thickness, strict);
	let cmax = g.cmax;

	if (trace) {
		traceString += '\ngraph with coloring: ' + g.toString(0x9);
	}
	return [traceString, {'cmax': cmax, 'max/min': (cmax/cmin).toFixed(2),
					  'thickness': totalThickness }];
}

/** Assign fans to layers, using maximum weight matchings to form layers.
 */
function buildLayers() {
	// create vector of graph inputs in decreasing order of fan counts
	let invec = new Array(g.ni);
	for (let u = 1; u <= g.ni; u++) invec[u-1] = [u,g.fanCount(u)];
	invec.sort((a,b) => b-a);

	// initialize each layer with a fan at the first input of invec;
	// initialize olist, so olist[l]=outputs covered by layer i
	let olist = new Array(fcMax+1);
	for (let j = 1; j <= fcMax; j++) {
		olist[j] = new List(g.n); olist[j].addProperty(['value',0]);
	}
	let [u] = invec[0]; let l = 1;
	for (let f = g.firstFanAt(u); f; f = g.nextFanAt(u,f)) {
		egl.add(f,l);
		for (let e = g.firstEdgeIn(f); e; e = g.nextEdgeIn(f,e)) {
			let v = g.right(e); olist[l].enq(v); olist[l].value(v,1);
		}
		l++;
	}

	// create matching graph for expanding layers
	let mg = new Graph(fcMax+g.nf, fcMax*g.nf);
	mg.addEdgeProperty(['weight',0]); mg.setBipartition(fcMax);

	if (trace) traceString += 'matchings:\n'

	// for each input u, use matching to assign fans at u to layers
	for (let j = 1; j < invec.length; j++) { 
		let [u] = invec[j];

		// construct matching graph with edges (l,f) where l is a layer and
		// f a fan at u; set weight to number of outputs already covered
		// by l, divided by the resulting thickness if f is added to l
		mg.clear();
		for (let l = 1; l <= fcMax; l++) {
			for (let f = g.firstFanAt(u); f; f = g.nextFanAt(u,f)) {
				let length = olist[l].length; let thick = 1;
				for (let e = g.firstEdgeIn(f); e; e= g.nextEdgeIn(f,e)) {
					let v = g.right(e);
					if (olist[l].contains(v)) {
						thick = Math.max(thick, 1+olist[l].value(v));
					} else {
						length++;
					}
				}
				let me = mg.join(l,fcMax+f); 
				mg.weight(me, length / thick);
			}
		}

		// match fans in u to layers
		let [match] = wbimatchH(mg);
		if (trace) {
			traceString += matching2string(match) + '\n';
		}

		// add each matched fan to it's paired layer and
		// add its outputs to the olist for that layer
		for (let e = match.first(); e; e = match.next(e)) {
			let l = mg.left(e); let f = mg.right(e)-fcMax;
			egl.add(f,l); let ol = olist[l];
			for (let e = g.firstEdgeIn(f); e; e = g.nextEdgeIn(f,e)) {
				let v = g.right(e);
				if (ol.contains(v)) {
					ol.value(v, 1+ol.value(v));
				} else {
					ol.enq(v); ol.value(v,1);
				}
			}
		}
	}
}

function matching2string(match) {
	let s = '['; let mg = match.g;
	let f2s = (f => f <= 26 ? '-ABCDEFGHIJKLMNOPQRSTUVWXYZ'[f] : f);
	for (let e = match.first(); e; e = match.next(e)) {
		let [l,g] =  [mg.left(e),mg.right(e)-fcMax];
		if (e != match.first()) s += ' ';
		let w = mg.weight(e);
		s += l + f2s(g) + ':' + (Number.isInteger(w) ? w : w.toFixed(2));
	}
	return s + ']';
}

/** Color the edges by layer.
 *  @param thickness is array of thickness values by layer
 *  @param strict is a flag which enforces disjoint color sets for each layer
 */
function color(thickness, strict) {
	// create object to record colors in
	let totalThickness = thickness.reduce((sum,val)=>sum+val, 0);

	// for each layer, color edges with smallest available color
	let lastColor = 0;  // used for strict case
	for (let l = 1; l <= egl.nl; l++) {
		let fc = strict ? lastColor+1 : 1;
		for (let c = fc; c <= lastColor + thickness[l]; c++) {
			for (let f = egl.firstInLayer(l); f; f = egl.nextInLayer(l,f)) {
				for (let e = g.firstEdgeIn(f); e; e = g.nextEdgeIn(f,e)) {
					if (!g.color(e) && g.avail(c,e))
						g.color(e,c);
				}
			}
		}
		lastColor += thickness[l];
	}
}
