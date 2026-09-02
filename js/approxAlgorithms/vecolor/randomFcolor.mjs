/** \file randomEgc.mjs
 *
 *  @author Jon Turner
 *  @date 2025
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled } from '../../common/Assert.mjs';
import { range, scramble, randomInteger } from '../../common/Random.mjs';
import { randomFraction } from '../../common/Random.mjs';
import { randomBigraph, randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';
import FanGraph from './FanGraph.mjs';
import { itint, tcount, lowerBounds, upperBounds }
		 from './common.mjs';

let ae;

/** Generate a random test case.
 *  @param ni is the number of input vertices in the graph
 *  @param fc is the fan count at each input
 *  @param no is the number of outputs
 *  @param od is the avrage degree of the outputs
 *  @param reg determines how regular the underlying graph is;
 *  in particular, it allows the degrees to deviate from the
 *  target value by less than reg.
 *  @param tmax is the largest tint, or 0 if no tints
 *  @param cmax is an upper limit on the number of colors needed to
 *  color the graph; must be at least as big as fc and od
 *  @param gap is a number >= 1 used in the crossbar scheduling application
 *  to model crossbars that can process packets at a faster rate than they
 *  arrive; this is done by increasing the assigned bounds in proportion
 *  to the speedup

Alternate approach
1. Assign a tint to the edges at each output.
   Let F be set of tint values
   for each edge e at output v
		select a random tint f from F
		if the number of previously selected tints >=f is <= Cmax-f,
		let tint(e)=f and proceed to next edge
		otherwise, remove f from F and try again
2. Color the edges at each output.
   Let C be the set of colors
   for each edge e at output v in decreasing order of tint value
	    select a color c>=tint(e) at random and assign it to e
3. At each input u, partition the colors among the palettes of
   the fans at u; assign the edges at u to fans based on their color
   define the tint of each fan to be its smallest color

   not good enough; smallest color may not be a tint

Summary of current approach
1. Select random colors for all edges.
2. Assign a "primary color" to each fan at each input.
3. Assign remaining colors to fans, where new colors are >= primary
	each remaining color is assigned to a fan with a compatible tint;
    could select any fan from among those with compatible tint,
    or we could give preference to fans with tints that are close
	to the color. Uniform assignment gives more colors to fans with
	small tints, while geometric assignment assigns more evenly; could
    also go evenly among sets of three, or could explicitly match colors
	to fans; perhaps select series of random matchings
    
	Could just let each fan select a compatible color at random,
	assigning these in top-down order, or assign a random palette
	size for each fan and again select colors randomly from top
	down. This allows for variation in the palette sizes and hence
    the fan sizes; may want to enforce a regularity restriction
	on palette sizes and fan count; given how small the number of
	colors typically is, may just want to let it be random; note
	there is a limit on the number of colors we can give a fan
	with a large tint


4. Place edges in fans based on their colors and the fan palettes.

  

 */
export default function randomEgc(ni, fc, no=ni, od=fc, reg=1, fmax=0,
								  cmax=Math.ceil(Math.max(fmax,fc,od)),
								  speedup=1) {
	ae = assertEnabled();
	let id = no*od/ni;
	ae && assert(fc <= id && od <= ni && id <= no && fmax <= cmax &&
				 (!fmax || fc <= fcount(fmax)) && speedup >= 1);
	
	let erange = Math.ceil(od*no);
	let nf = Math.ceil(ni*cmax);
	let crange = 4*cmax;
	let gap = speedup;

	let g0 = randomRegularBigraph(ni, id, no, reg);
	let	egg = new FanGraph(ni, no, nf, erange, crange, fmax>0)
	for (let e = g0.first(); e; e = g0.next(e))
		egg.join(g0.left(e), g0.right(e));

	let [idmax,odmax] = egg.maxDegree();
	ae && assert(cmax >= odmax);
	let dmax = Math.max(fc, odmax);

	// assign random colors to all edges; no color repeats at an output
	// these are used to generate lower bounds later
	let palette = range(cmax);
	let color = new Int32Array(egg.edgeRange+1);
	for (let v = ni+1; v <= egg.n; v++) {
		scramble(palette); let c = 1;
		for (let e = egg.firstAt(v); e; e = egg.nextAt(v,e)) {
			color[e] = palette[c++];
		}
	}

	// at each input, assign colors to fans in a way that ensures
	// that tints can be generated

	// Recursive function used to select a random subset of colors in 1..cmax
	// ensuring that the i-th selected color is >= itint(i);
	// randomColors(lo, hi, cvec) fills in cvec[lo+1..hi-1]
	function randomColors(lo, hi, cvec) {
		if (hi-lo < 2) return;
		let mid = ~~((lo+hi)/2);
		// ae && assert(cvec[lo]+(itint(mid)-itint(lo),gap) <=
		//				cvec[hi]-(hi-mid),
		//				`${lo} ${hi} ${mid} [${cvec.slice(1,dmax+1)}]`);
		cvec[mid] = randomInteger(cvec[lo]+(itint(mid,gap)-itint(lo,gap)), 
							  	  cvec[hi]-(hi-mid));
		randomColors(lo,mid,cvec); randomColors(mid,hi,cvec);
	}

	// at each input, partition the colors among the fans;
	// first assign a primary to each fan, where the i-th fan's
	// primary is >=itint(i)
	// then distribute each remaining color to a fan with a smaller primary

not accounting for fmax=0 case??
in the absence of tints, we just assign colors randomly to fans and
add edges to fans based on their color?

	let free = new Int8Array(1+fcount(fmax,gap)); // identifies unused tints
	let owner = new Array(ni+1); // owner[u][c] is fan that owns color c at u
	let pri = new Int32Array(fc+2); // pri is vector of primary colors
	let rem = new Int32Array((cmax-fc)+1); // rem is vector of remaining colors
	pri[1] = 1; pri[fc+1] = cmax+1; // pri[fc+1] is dummy entry
	for (let u = 1; u <= ni; u++) {
		randomColors(1, fc+1, pri);
		owner[u] = new Int32Array(cmax+1);
		let i = 1;
		for (let g = (u-1)*fc+1; g <= u*fc; g++) {
			owner[u][pri[i++]] = g;
		}
		// next make vector of remaining colors
		i = 1; let j = 1; let c = 1;
		while (j < rem.length) {
			if (c == pri[i]) i++;
			else rem[j++] = c;
			c++;
		}
		// now assign each remaining color to a fan with a smaller primary
		let p = pri.length-1;
		let r = rem.length-1;
		while (r >= 1) {
			while (pri[p] > rem[r]) p--;
			for (let i = p; i; i--) {
				if (i == 1 || randomFraction() < 0.5) {
					owner[u][rem[r]] = owner[u][pri[i]];
					break;
				}
			}
			r--;
		}
		// now assign edges at u to fans based on their color
		for (let e = egg.firstAt(u); e; e = egg.nextAt(u,e)) {
			egg.add(e, owner[u][color[e]]);
		}

		if (fmax == 0) continue;

		free.fill(1); // all tints available at u
		let lo = 1; let hi = 1;  // sample from free tints in itint(lo..hi)
		let freeCount = 1; // number of free tints in itint(lo..hi)
		for (let g = (u-1)*fc+1; g <= u*fc; g++) {
			while (!free[lo]) lo++; // skip past previously selected tints
			let gpri = pri[1+(g-1)%fc];  // primary assigned to g
			let delta = fcount(Math.min(gpri,fmax),gap) - hi;
				// number of new tints that can be used for g
			hi += delta; freeCount += delta;

			let j = randomInteger(1,freeCount);
			for (let i = lo; i <= hi; i++) {
				if (free[i] && !(--j)) {
					egg.tint(g,itint(i,gap)); free[i] = 0; freeCount--; break;
				}
			}
		}
	}
	return [egg, lowerBounds(egg), upperBounds(egg)];
}
