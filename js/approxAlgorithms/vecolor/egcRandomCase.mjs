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
 *  @param n_i is the number of input vertices in the graph
 *  @param d_g is the group degree at the inputs
 *  @param n_o is the number of outputs
 *  @param d_o is the degree of the outputs
 *  @param k is an upper bound on the number of colors needed to
 *  color the graph; must be at least as big as d_g and d_o
 */
export default function egcRandomCase(n_i, d_g, n_o=n_i, d_o=d_g, 
									  k=Math.max(d_g,d_o)+2) {
	let d_i = ~~(n_o*d_o/n_i);
	ea && assert(d_g <= d_i && d_g <= k && d_o <= k && d_o <= n_o &&
		   		 d_i <= n_o && d_i*n_i == d_o*n_o);

	let gg = randomRegularBigraph(n_i, d_i, n_o);
	let eg = new EdgeGroups(gg, k*n_i);

	// add edges to eg using groups consistent with a k-coloring
	let colors = range(k);
	for (let v = n_i+1; v <= gg.n; v++) {
		let i = 1; scramble(colors);
		for (let e = gg.firstAt(v); e; e = gg.nextAt(v,e)) {
			let c = colors[i++];
			let u = gg.mate(v,e);
			eg.add(e, (u-1)*k+c);
		}
	}

	// merge groups at inputs so as to satisfy maximum group count
	let gvec = new Int32Array(k);
	for (let u = 1; u <= n_i; u++) {
		let i = 0;
		for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g))
			gvec[i++] = g;
		i--;
		while (i >= d_g) {
			let j = randomInteger(0,i); let g2 = gvec[j];
			gvec[j] = gvec[i--];
			j = randomInteger(0,i); let g1 = gvec[j]; 
			eg.merge(g1, g2); // g2 now gone from graph
		}
	}
	return eg;
}
