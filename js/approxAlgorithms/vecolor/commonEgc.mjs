/** @file commonEgc.mjs
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

/** Determine the floor value for a specified index and gap.
 *  @param i is a positive integer
 *  @param gap is the nominal inter-floor spacing
 *  @return the i-th floor value
 */
export function ifloor(i,gap) {
	return 1 + Math.ceil((i-1)*gap);
}

/** Determine the number of floors upper-bounded by a given color
 *  @param c is a color
 *  @param gap is the floor spacing
 *  @return the number of floor values <=c.
 */
export function fcount(c,gap) {
	return 1 + Math.floor((c-1)/gap);
}

/** Lower bound based on input group count, output degree
 *  and floor (if present);
 */
export function simpleBound(egg) {
	let [,odMax] = egg.maxDegree();
}

/** Lower bound based on floor values at each output. */
export function outputFloorBound(egg) {
	let [,odMax] = egg.maxDegree();
	if (!floor) return Math.max(egg.maxGroupCount(), odMax);
	let lb = 0; let fvec = new Int32Array(odMax);
	for (let v = egg.ni+1; v <= egg.n; v++) {
		// create ordered vector of floors at v
		let i = 0;
		for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
			fvec[i++] = egg.floor(egg.group(e));
		}
		i--; // i is index of last valid bound at v
		fvec.fill(fmax+1,i+1); // fill remaining entries with larger value
		fvec.sort();

		for (let j = 0; j <= i; j++) {
			lb = Math.max(lb, fvec[j] + (i-j));
		}
	}
	return lb;
}

export function lowerBounds(egg) {
	return [simpleBound(egg), outputFloorBound(egg)];
}

export function tlBound(egg) {
	let [,odMax] = egg.maxDegree();
	return egg.groupCount() * odMax;
}

/** Compute randomized upper bound on colors.
 *  @param gc is max input group count
 *  @param odMax is max output degree
 *  @param no is number of outputs
 *  @return randomized upper bound

think harder about this, relative to Pippenger bound.
he shows existence of a solution among all palettes;
I show probability > 1/2 for random choice of palettes
implying that for this k, there must exist a solution,
so why isn't his bound at least as strong as mine??

 */
export function randomPaletteBound(gc, odMax, no) {
	let k = Math.ceil(2*Math.sqrt((Math.log(2*odMax*no) /
								   Math.log(Math.log(2*odMax*no)))));
	return k * Math.max(gc, odMax);
}

export function kkpBound(gc, odMax, no) {
	return (gc-1) * Math.floor(Math.log2(2*no)) + 2*odMax;
}

/** Compute worst-case upper bounds on colors.
 *  @param gc is max input group count
 *  @param odMax is max output degree
 *  @param no is number of outputs
 *  @return vector [rand,kkp,ym] of upper bounds, where rand is the randomized
 *  upper bound, kkp is Kirkpatrick, Klawe and Pippenger bound, ym is the
 *  Yang and Masson bound
 */
export function ymBound(gc, odMax, no) {
	let k = 2;
	let b0 = (gc-1)*k + (odMax-1)*(no**(1/k)) + 1;
	let b1 = (gc-1)*(k+1) + (odMax-1)*(no**(1/(k+1))) + 1;
	while (b0 > b1) {
		k++;
		b0 = b1;
		b1 = (gc-1)*(k+1) + (odMax-1)*(no**(1/(k+1))) + 1;
	}
	return b0;
}

/** Return array of upper bounds on the cost of a solution. */
export function upperBounds(egg) {
	let gc = egg.maxGroupCount();
	let [,odMax] = egg.maxDegree();
	let no = egg.no;
	return [ymBound(gc,odMax,egg.no),
			kkpBound(gc,odMax,egg.no),
			layerBound(gc,odMax,egg.no)];
}
