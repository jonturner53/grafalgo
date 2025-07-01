/** \file egcRandomCase.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import { range, scramble, randomInteger } from '../../common/Random.mjs';
import EdgeGroups from './EdgeGroups.mjs';
import { randomBigraph, randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';

/** Generate a random test case.
 *  @param ni is the number of input vertices in the graph
 *  @param gd is the group degree at the inputs
 *  @param no is the number of outputs
 *  @param od is the degree of the outputs
 *  @param k is an upper bound on the number of colors needed to
 *  color the graph; must be at least as big as gd and od
 *  @param r determines how regular the underlying graph is;
 *  in particluar, it allows the degrees to deviate from the
 *  target value by less than r.
 */
export default function egcRandomCase(ni, gd, no=ni, od=gd, 
									  k=Math.max(gd,od)+2, r=1) {
	let id = no*od/ni;
	ea && assert(gd <= id && gd <= k && od <= k && od <= ni && id <= no);

	let	gg = randomRegularBigraph(ni, id, no, r);
	let maxod = 0; // compute largest output degree
	for (let v = ni+1; v <= ni+no; v++)
		maxod = Math.max(maxod, gg.degree(v));
	k = Math.max(k,maxod); // adjust number of colors
	let	eg = new EdgeGroups(gg, k*ni);

	// add edges to eg using groups consistent with a k-coloring
	let colors = range(k);
	for (let v = ni+1; v <= gg.n; v++) {
		let i = 1; scramble(colors);
		for (let e = gg.firstAt(v); e; e = gg.nextAt(v,e)) {
			let c = colors[i++];
			let u = gg.mate(v,e);
			eg.add(e, (u-1)*k+c);
		}
	}

	// merge groups at inputs so as to satisfy maximum group count
	let gvec = new Int32Array(k);
	for (let u = 1; u <= ni; u++) {
		let i = 0;
		for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g))
			gvec[i++] = g;
		i--;
		while (i >= gd) {
			let j = randomInteger(0,i); let g2 = gvec[j];
			gvec[j] = gvec[i--];
			j = randomInteger(0,i); let g1 = gvec[j]; 
			eg.merge(g1, g2); // g2 now gone from graph
		}
	}

	for (let u = 1; u <= ni; u++) eg.scrambleGroups(u);
	return eg;
}
