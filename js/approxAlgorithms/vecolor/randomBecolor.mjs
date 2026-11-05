/** \file randomBecolor.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled as ae } from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { range, scramble } from '../../common/Random.mjs';
import { randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';
import ecolorG from '../../graphAlgorithms/ecolor/ecolorG.mjs';
import { lowerBounds, upperBounds, maxColor, tintCount, itint, maxTint}
		from './common.mjs';

/** Generate a random bipartite test case for bounded edge coloring.
 *  @param ni is the number of inputs to the graph
 *  @param id is the average degree of any input vertex
 *  @param no is the number outputs
 *  @param degree regularity [i,j] means the input degrees may differ
 *  by <i and the output degrees by <j; can abbreviate [i,i] as i.
 *  @param tmax is the largest tint (tintCount(tmax,gap) must be 
 *  at least equal to largest input vertex degree)
 *  @param gap specifies speedup factor for use in switching
 *  applications; color tints are selected to emulate packet arrival
 *  times separated by intervals larger than 1
 *  @return a random graph with tints for each edge
 *  that can be colored with cmax or fewer colors
 */
export default function randomBecolor(ni, id, no=ni, reg=1, tmax=0, gap=1) {
    // generate a random bipartite graph
	let g = randomRegularBigraph(ni, id, no, reg);
	g.addEdgeProperty(['tint',0]); g.addEdgeProperty(['color',0]);
	let [idmax,odmax] = g.maxDegree(); let dmax = Math.max(idmax, odmax);
	if (!tmax) tmax = itint(idmax,gap);
	let tcm = tintCount(tmax,gap);
	ae() && assert(tcm >= idmax);

	// assign random tints to edges at each input
	let x = range(tcm);
	for (let u = 1; u <= ni; u++) {
		scramble(x); let i = 1;
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			g.tint(e, itint(x[i++],gap));
		}
	}
	return [g, lowerBounds(g,gap), upperBounds(g,gap)];
}
