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
import { randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';

/** Generate a random test case.
 *  @param ni is the number of input vertices in the graph
 *  @param di is the degree of the inputs
 *  @param no is the number of outputs
 *  @param gd is the group degree at the inputs
 *  @param k is an upper bound on the number of colors needed to
 *  color the graph; must be at least as big as gd and do_
 */
export default function egcRandomCase(ni, di, no=ni, gd=~~(ni*di/no),
									  k=Math.max(gd,~~(ni*di/no))+2) {
	let do_ = ~~(ni*di/no);
	ea && assert(gd <= di && gd <= k && do_ <= k && do_ <= no &&
		   		 di <= no && di*ni == do_*no);

	let gg = randomRegularBigraph(ni, di, no);
	let eg = new EdgeGroups(gg, k*ni);

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
	return eg;
}
