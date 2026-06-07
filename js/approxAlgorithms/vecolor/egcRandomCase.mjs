/** \file egcRandomCase.mjs
 *
 *  @author Jon Turner
 *  @date 2025
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled } from '../../common/Assert.mjs';
import { range, scramble, randomInteger } from '../../common/Random.mjs';
import EdgeGroups from './EdgeGroups.mjs';
import { maxOutDegree } from './egcCommon.mjs';
import { randomFraction } from '../../common/Random.mjs';
import { randomBigraph, randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';
import { egcLbound, egcUbounds } from './egcCommon.mjs';

let ae;

/** Generate a random test case.
 *  @param ni is the number of input vertices in the graph
 *  @param gd is the group degree at the inputs
 *  @param no is the number of outputs
 *  @param od is the avrage degree of the outputs
 *  @param reg determines how regular the underlying graph is;
 *  in particular, it allows the degrees to deviate from the
 *  target value by less than reg.
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
									  Cmax=0, Bmax=0, speedup=1) {
	ae = assertEnabled();
	// define some functions on bounds
	let ibound = (i => 1 + Math.ceil((i-1)*speedup));
		// ibound(i) is the i-th permissible lower bound
	let bcount = (c => 1 + Math.floor((c-1)/speedup));
		// bcount(c) is number of permissible lower bounds that are <= c
	let bfloor = (c => ibound(bcount(c)));
		// bfloor(c) is the largest bound <= c

	let id = no*od/ni;
	ae && assert(gd <= id && od <= ni && id <= no);

	let egg = randomRegularBigraph(ni, id, no,reg);
	let [idmax,odmax] = egg.maxDegree(); let dmax = Math.max(gd, odmax);
	if (!Cmax) Cmax = Math.max(gd, odmax) + 2;
	let	eg = new EdgeGroups(egg, Cmax*ni);


	ae && assert(Cmax >= Bmax && Cmax >= odmax && speedup >= 1 &&
		   		 (!Bmax || bcount(Bmax) >= gd));

	// assign random colors to all edges; no color repeats at an output
	// these are used to generate lower bounds later
	let palette = range(Cmax);
	let color = new Int32Array(egg.edgeRange+1);
	for (let v = ni+1; v <= egg.n; v++) {
		scramble(palette); let c = 1;
		for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
			color[e] = palette[c++];
		}
	}

//console.log(egg.toString(1,(e,u)=>`${egg.x2s(egg.mate(u,e))}/${color[e]}`));
			
	// at each input, assign colors to groups in a way that ensures
	// that lower bounds can be generated

	// Recursive function used to select a random subset of colors in 1..Cmax
	// ensuring that the i-th selected color is >= ibound(i);
	// randomColors(lo, hi, cvec) fills in cvec[lo+1..hi-1]
	function randomColors(lo, hi, cvec) {
		if (hi-lo < 2) return;
		let mid = ~~((lo+hi)/2);
		// ae && assert(cvec[lo]+(ibound(mid)-ibound(lo)) <=
		//				cvec[hi]-(hi-mid),
		//				`${lo} ${hi} ${mid} [${cvec.slice(1,dmax+1)}]`);
		cvec[mid] = randomInteger(cvec[lo]+(ibound(mid)-ibound(lo)), 
							  	  cvec[hi]-(hi-mid));
		randomColors(lo,mid,cvec); randomColors(mid,hi,cvec);
	}

	// at each input, partition the colors among the groups;
	// first assign a primary to each group, where the i-th group's
	// primary is >=ibound(i)
	// then distribute each remaining color to a group with a smaller primary

	let free = new Int8Array(1+bcount(Bmax)); // identifies unused lower bounds
	let owner = new Array(ni+1); // owner[u][c] is group that owns color c at u
	let pri = new Int32Array(gd+2); // pri is vector of primary colors
	let rem = new Int32Array((Cmax-gd)+1); // rem is vector of remaining colors
	pri[1] = 1; pri[gd+1] = Cmax+1; // pri[gd+1] is dummy entry
	for (let u = 1; u <= ni; u++) {
		randomColors(1, gd+1, pri);
		owner[u] = new Int32Array(Cmax+1);
		let i = 1;
		for (let g = (u-1)*gd+1; g <= u*gd; g++) {
			owner[u][pri[i++]] = g;
		}
		// next make vector of remaining colors
		i = 1; let j = 1; let c = 1;
		while (j < rem.length) {
			if (c == pri[i]) i++;
			else rem[j++] = c;
			c++;
		}
		// now assign each remaining color to a group with a smaller primary
		let p = pri.length-1;
		let r = rem.length-1;
		while (r >= 1) {
			while (pri[p] > rem[r]) p--;
			for (let i = p; i; i--) {
				if (i == 1 || randomFraction() < 0.5) {
					owner[u][rem[r]] = owner[u][pri[p]]
					break;
				}
			}
			r--;
		}
		// now assign edges at u to groups based on their color
		for (let e = egg.firstAt(u); e; e = egg.nextAt(u,e)) {
			eg.add(e, owner[u][color[e]]);
		}

		if (Bmax == 0) continue;

		free.fill(1); // all bounds available at u
		let lo = 1; let hi = 1;  // sample from free bounds in ibound(lo..hi)
		let freeCount = 1; // number of free bounds in ibound(lo..hi)
		for (let g = (u-1)*gd+1; g <= u*gd; g++) {
			while (!free[lo]) lo++; // skip past previously selected bounds
			let gpri = pri[1+(g-1)%gd];  // primary assigned to g
			let delta = bcount(Math.min(gpri,Bmax)) - hi;
				// number of new bounds that can be used for g
			hi += delta; freeCount += delta;

			let j = randomInteger(1,freeCount);
			for (let i = lo; i <= hi; i++) {
				if (free[i] && !(--j)) {
					eg.bound(g,ibound(i)); free[i] = 0; freeCount--; break;
				}
			}
		}
	}
	return [eg, egcLbound(eg), egcUbounds(eg)];
}
