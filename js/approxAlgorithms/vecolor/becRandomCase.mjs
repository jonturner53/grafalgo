/** \file becRandomCase.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { randomInteger, randomPermutation } from '../../common/Random.mjs';
import { randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';
import ecolorG from '../../graphAlgorithms/ecolor/ecolorG.mjs';
import { lowerBounds, upperBounds, maxColor, maxFloor} from './becCommon.mjs';

/** Generate a random bipartite test case for bounded edge coloring.
 *  @param ni is the number of inputs to the graph
 *  @param id is the max degree of any input vertex
 *  @param no is the number outputs
 *  @param regularity
 *  @param Fmax is the largest floor (must be >= d)
 *  @param Cmax is an upper bound on the number of colors needed
 *  @param speedup specifies speedup factor for use in switching
 *  applications; color floors are selected to emulate packet arrival
 *  times separated by intervals larger than 1
 *  @return a random graph with floors for each edge
 *  that can be colored with Cmax or fewer colors
 */
export default function becRandomCase(ni, id, no=ni, reg=1,
									  Fmax=Math.floor(id+reg[0]-.0001),
									  Cmax=Fmax, speedup=1) {
	// first, define functions on bounds
	let ifloor = (i => 1 + Math.ceil((i-1)*speedup));
		// ifloor(i) is the i-th permissible floor
	let fcount = (c => 1 + Math.floor((c-1)/speedup));
		// fcount(c) is number of permissible floors that are <= c

    // generate a random bipartite graph and color it
	let g = randomRegularBigraph(ni, id, no, reg);
	g.addEdgeProperty('floor', 0); g.addEdgeProperty('color', 0);
	let [idmax,odmax] = g.maxDegree(); let dmax = Math.max(idmax, odmax);
	ea && assert(idmax <= fcount(Fmax) && Fmax <= Cmax && odmax <= Cmax);

	// select a random subset of dmax colors in 1..Cmax
	let palette = new Int32Array(dmax+2);

	// Recursive function to select colors, while ensuring that lower
	// bounds can be generated
	let selectColors = function(lo,hi) {
		// select colors in palette[lo+1..hi-1]
		if (hi-lo < 2) return;
		let mid = ~~((lo+hi)/2);
		// ea && assert(palette[lo]+(ifloor(mid)-ifloor(lo)) <=
		//				palette[hi]-(hi-mid),
		//				`${lo} ${hi} ${mid} [${palette.slice(1,dmax+1)}]`);
		palette[mid] = randomInteger(palette[lo]+(ifloor(mid)-ifloor(lo)), 
								  	 palette[hi]-(hi-mid));

		selectColors(lo,mid); selectColors(mid,hi);
	}
	palette[0] = 0; palette[dmax+1] = Cmax+1;
	selectColors(0,dmax+1);

	// now compute initial coloring and then map initial colors to those
	// in the palette
	let hues = Graph.clone(g,0); hues.addEdgeProperty('color', 0);
	hues.setBipartition(g.getBipartition());
	ecolorG(hues);
	for (let e = g.first(); e; e = g.next(e)) {
		g.color(e, palette[hues.color(e)]);
	}

    // next, assign random floors that are consistent with the colors
	// first, sort adjacency lists in increasing order of edge color
	g.sortAllEplists((e1,e2) => g.color(e1)-g.color(e2));

	// next, build array of permissible floors
	let free = new Int8Array(1+fcount(Fmax));
		// free[i]=1 means that ifloor(i) is free (not yet in use)

	// assign random bounds, by sampling from bounds
	for (let u = 1; u <= ni; u++) {
		free.fill(1); // all bounds available at u
		let lo = 1; let hi = 1;  // sample from free bounds in ifloor(lo..hi)
		let freeCount = 1; // number of free bounds in ifloor(lo..hi)
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			while (!free[lo]) lo++; // skip past previously selected bounds
			let delta = fcount(Math.min(g.color(e),Fmax)) - hi;
				// number of new bounds that can be used for e
			hi += delta; freeCount += delta;

			let j = randomInteger(1,freeCount);
			for (let i = lo; i <= hi; i++) {
				if (free[i] && !(--j)) {
					g.floor(e,ifloor(i)); free[i] = 0; freeCount--; break;
				}
			}
			ea && assert(g.floor(e));
		}
	}
	let cmax = maxColor(g); let fmax = maxFloor(g);
	g.resetColor();  // finally, erase colors used when selecting floors
	g.sortAllEplists((e1,e2,u)=>g.floor(e1)-g.floor(e2));

	return [g, lowerBounds(g,speedup), [cmax,...upperBounds(g,speedup)]];
}
