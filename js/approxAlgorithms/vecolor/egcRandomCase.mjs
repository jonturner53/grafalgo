/** \file egcRandomCase.mjs
 *
 *  @author Jon Turner
 *  @date 2025
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
export default function egcRandomCase(ni,gd, no=ni,od=gd, k=Math.max(gd,od)+2,
									   r=1, bounded=0, speedup=1) {
	let id = no*od/ni;
	ea && assert(gd <= id && gd <= k && od <= k && od <= ni && id <= no);

	let	egg = randomRegularBigraph(ni, id, no, r);
	let maxod = 0; // compute largest output degree
	for (let v = ni+1; v <= ni+no; v++)
		maxod = Math.max(maxod, egg.degree(v));
	k = Math.max(k,maxod); // adjust number of colors
	let	eg = new EdgeGroups(egg, k*ni);

	// add edges to eg using groups consistent with a k-coloring
	let colors = range(k);
	for (let v = ni+1; v <= egg.n; v++) {
		let i = 1; scramble(colors);
		for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
			let c = colors[i++]; let g = (egg.mate(v,e)-1)*k+c;
			eg.add(e, g);
		}
	}

	// assign bounds to groups
	if (bounded) {
		for (let u = 1; u <= ni; u++) {
			let bounds = range(k);
			let groups = new Int32Array(k+1);
			for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g))
				groups[g-(u-1)*k] = g;
			for (let c = 1; c <= k; c++) {
				if (!groups[c]) continue;
				let g = groups[c];
				let i = randomInteger(1,c);
				while (!bounds[i]) i = (i<c ? i+1 : 1);
				let b = Math.ceil(1+(bounds[i]-1)*speedup); bounds[i] = 0;
				eg.bound(g,b);
			}
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
			if (bounded) eg.bound(g1, Math.min(eg.bound(g1), eg.bound(g2)));
			eg.merge(g1, g2); // g2 now gone from graph
		}
	}

	for (let u = 1; u <= ni; u++) eg.scrambleGroups(u);
	return eg;
}
