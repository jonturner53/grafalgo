/** @file egcCommon.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, AssertEnabled as ae } from '../../common/Assert.mjs';

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

/** Return the largest lower limit on color */
// maybe use floor instead of bound; overloads use of floor
// in flow problem, but that's a different context so may be ok
// issue: floor is separate field in flow graph, so when we use
// flow there, we will be overloading and masking underlying floor
// that seems ok too
export function maxLimit(eg) {
	let max = 0;
	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g))
		max = Math.max(max, eg.bound(g));
	return max;
}

/** Compute lower bound on the number of colors required.
 *  @param eg is an EdgeGroups object
 */
export function egcLbound(eg) {
	let egg = eg.graph;
	let maxOD = maxOutDegree(eg);
	if (!eg.hasBounds) 
		return Math.max(maxGroupCount(eg), maxOD);

/*
maybe separate input/output bounds
also for input bounds, could add maxInDegree + ibound(minFloor) - 1
*/

	let maxBound = eg.maxLimit();

	let lowerBound = 0;
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
export function egcUboundKKPT(Gamma_i, Delta_o, n_o) {
	let k = Math.ceil(2*Math.sqrt((Math.log(2*Delta_o*n_o) /
								   Math.log(Math.log(2*Delta_o*n_o)))));
	return k * Math.max(Gamma_i, Delta_o);
}

export function egcUboundTl(Gamma_i, Delta_o) {
	return Gamma_i*Delta_o;
}

export function egcUboundKKP(Gamma_i, Delta_o, n_o) {
	let kkp = (Gamma_i-1) * Math.floor( Math.log2(2*n_o)) + 2*Delta_o;
}

/** Compute worst-case upper bounds on colors.
 *  @param Gamma_i is max input group count
 *  @param Delta_o is max output degree
 *  @param n_o is number of outputs
 *  @return vector [rand,kkp,ym] of upper bounds, where rand is the randomized
 *  upper bound, kkp is Kirkpatrick, Klawe and Pippenger bound, ym is the
 *  Yang and Masson bound
 */
export function egcUboundYM(Gamma_i, Delta_o, n_o) {
	let k = 2;
	let b0 = (Gamma_i-1)*k + (Delta_o-1)*(n_o**(1/k)) + 1;
	let b1 = (Gamma_i-1)*(k+1) + (Delta_o-1)*(n_o**(1/(k+1))) + 1;
	while (b0 > b1) {
		k++;
		b0 = b1;
		b1 = (Gamma_i-1)*(k+1) + (Delta_o-1)*(n_o**(1/(k+1))) + 1;
	}
	return b0;
}

/** Return array of upper bounds on the cost of a solution. */
export function egcUbounds(eg) {
	let Gamma_i = eg.maxGroupCount();
	let Delta_o = maxOutDegree(eg);
	let n_o = eg.n_o;
	return [egcUboundYM(Gamma_i, Delta_o, n_o),
			egcUboundKKP(Gamma_i, Delta_o, n_o),
			egcUboundKKPT(Gamma_i, Delta_o, n_o),
			egcUboundTl(Gamma_i, Delta_o)];
}
