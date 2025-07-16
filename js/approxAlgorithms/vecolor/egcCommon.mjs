/** @file egcCommon.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Compute largest group count at an input.
 *  @param eg is an EdgeGroups object
 *  @return the largest input group count
 */
export function maxGroupCount(eg) {
	let Gamma_i = 0;
	for (let u = 1; u <= eg.n_i; u++)
		Gamma_i = Math.max(Gamma_i,eg.groupCount(u));
	return Gamma_i;
}

/** Compute largest vertex degree at an output.
 *  @param eg is an EdgeGroups object
 *  @return the largest output degree
 */
export function maxOutDegree(eg) {
	let Delta_o = 0;
	for (let v = eg.n_i+1; v <= eg.graph.n; v++)
		Delta_o = Math.max(Delta_o,eg.graph.degree(v));
	return Delta_o;
}

/** Compute lower bound on the number of colors required.
 *  @param eg is an EdgeGroups object
 *  @param speedup is a parameter that defines the allowed
 *  lower bound sets for the group colors; for example,
 *  if speedup=1.5, the allowed lower bounds are 1,2,4,5,7,8.
 */
export function lowerBound(eg) {
	let egg = eg.graph;
	let maxOD = maxOutDegree(eg);
	let lowerBound = Math.max(maxGroupCount(eg), maxOD);
	if (!eg.hasBounds) return lowerBound;

	let maxBound = 0;
	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g))
		maxBound = Math.max(maxBound, eg.bound(g));

	let bvec = new Int32Array(maxOD);
	for (let v = eg.n_i+1; v <= eg.n_i+eg.n_o; v++) {
		// create ordered vector of bounds at v
		let i = 0;
		for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
			bvec[i++] = eg.bound(eg.group(e));
		}
		i--; // i is index of last valid bound at v
		bvec.fill(maxBound+1,i+1); // fill remaining entries with larger value
		bvec.sort();

		for (let j = 0; j <= i; j++) {
			lowerBound = Math.max(lowerBound, bvec[j] + (i-j));
		}
	}
	return lowerBound;
}

/** Compute randomized upper bound on colors.
 *  @param Gamma_i is max input group count
 *  @param Delta_o is max output degree
 *  @param n_o is number of outputs
 *  @return randomized upper bound
 */
export function randUbound(Gamma_i, Delta_o, n_o) {
	let k = Math.ceil(2*Math.sqrt((Math.log(2*Delta_o*n_o) /
								   Math.log(Math.log(2*Delta_o*n_o)))));
	return k * Math.max(Gamma_i, Delta_o);
}

/** Compute worst-case upper bound on colors.
 *  @param Gamma_i is max input group count
 *  @param Delta_o is max output degree
 *  @param n_o is number of outputs
 *  @return worst-case upper bound
 */
export function wcUbound(Gamma_i, Delta_o, n_o) {
	// Kirkpatrick, Klawe and Pippenger bound

	let kkp = (Gamma_i-1) * Math.floor( Math.log2(2*n_o)) + 2*Delta_o;

	// Yang and Masson bound
	let k = 2;
	let b0 = (Gamma_i-1)*k + (Delta_o-1)*(n_o**(1/k)) + 1;
	let b1 = (Gamma_i-1)*(k+1) + (Delta_o-1)*(n_o**(1/(k+1))) + 1;
	while (b0 > b1) {
		k++;
		b0 = b1;
		b1 = (Gamma_i-1)*(k+1) + (Delta_o-1)*(n_o**(1/(k+1))) + 1;
	}
	let ym = b0;
	
	return Math.ceil(Math.min(Gamma_i*Delta_o, kkp, ym));
}
