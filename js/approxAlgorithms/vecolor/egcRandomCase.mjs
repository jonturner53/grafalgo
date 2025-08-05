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
import { maxOutDegree } from './egcCommon.mjs';
import { randomBigraph, randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';

/** Generate a random test case.
 *  @param ni is the number of input vertices in the graph
 *  @param gd is the group degree at the inputs
 *  @param no is the number of outputs
 *  @param od is the degree of the outputs
 *  @param reg determines how regular the underlying graph is;
 *  in particluar, it allows the degrees to deviate from the
 *  target value by less than r.
 *  @param Cmax is an upper bound on the number of colors needed to
 *  color the graph; must be at least as big as gd and od
 *  @param Bmax is the largest lower bound value, or 0 if no
 *  lower bounds
 *  @param speedup is a number >= 1 used in the crossbar scheduling application
 *  to model crossbars that can process packets at a faster rate than they
 *  arrive; this is done by increasing the assigned bounds in proportion
 *  to the speedup
 */
export default function egcRandomCase(ni, gd, no=ni, od=gd, reg=1,
									  Cmax=Math.max(gd,od)+2,
									  Bmax=0, speedup=1) {
	let id = no*od/ni;
	assert(gd <= id && od <= ni && id <= no && reg >= 1 &&
		   Cmax >= Bmax && Cmax >= 1+(od+reg-2)*speedup &&
		   (!Bmax || (Bmax >= 1+(gd-1)*speedup && Bmax >= od)) &&
		   speedup >= 1);

	let	egg = randomRegularBigraph(ni, id, no, reg);
	let nc = Math.floor(1+(Cmax-1)/speedup);
	let	eg = new EdgeGroups(egg, nc*ni);
	let maxod = maxOutDegree(eg);

	// add edges to groups consistent with a Cmax-coloring
	let cx = range(nc); // indexes of colors that can be bounds
	let boundLimit = new Int32Array(eg.n_g+1);
		// boundLimit[g] is an upper limit on the bound for group g
	for (let v = ni+1; v <= egg.n; v++) {
		let i = 1; scramble(cx);
		for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
			let u = egg.mate(v,e); let x = cx[i++];
			let g = (u-1)*nc+x; eg.add(e, g);
			boundLimit[g] = Math.min(Math.ceil(1+speedup*(x-1)),Bmax);
		}
	}

	let gvec = new Int32Array(Cmax);  // used to select groups to be merged
	let availableBounds = new Int8Array(Bmax+1);
	let orderedGroups = new Int32Array(Bmax);
	for (let u = 1; u <= ni; u++) {
		// merge groups at inputs so as to satisfy maximum group count
		let gcnt = 0;
		for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) {
			gvec[gcnt++] = g;
		}
		while (gcnt > gd) {
			let j1 = randomInteger(0,gcnt-2);
			let j2 = randomInteger(j1+1,gcnt-1);
			let g1 = gvec[j1]; let g2 = gvec[j2];
			eg.merge(g1,g2); // g2 now gone from eg
			if (boundLimit[g1] > boundLimit[g2])
				boundLimit[g1] = boundLimit[g2];
			gvec[j2] = gvec[--gcnt];  // g2 now effectively gone from gvec
		}
		if (Bmax == 0) continue;

		// now assign each group at u a bound consistent with its limit
		// first create a list of groups ordered by boundLimit
		let i = 0;
		for (let g = eg.firstGroupAt(u); g; g = eg.nextGroupAt(u,g)) {
			orderedGroups[i++] = g;
		}
		if (gcnt < gd) orderedGroups.fill(0,gcnt);
		boundLimit[0] = Bmax+1 // sorting gimmick
		orderedGroups.sort((g1,g2) => boundLimit[g1]-boundLimit[g2]);

		availableBounds.fill(1); // set of bounds not yet in use
		for (let i = 0; i < gcnt; i++) {
			let g = orderedGroups[i];
			let j = randomInteger(1,boundLimit[g]);
			while (!availableBounds[j]) {
				j = (j == boundLimit[g] ? 1 : j+1);
			}
			availableBounds[j] = false;
			eg.bound(g,1+Math.ceil((j-1)*speedup));
		}
		eg.scrambleGroups(u);
	}
	return eg;
}
