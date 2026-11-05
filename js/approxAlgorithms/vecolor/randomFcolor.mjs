/** \file randomFcolor.mjs
 *
 *  @author Jon Turner
 *  @date 2025
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
import { assert, assertEnabled as ae } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import { range, scramble, randomInteger } from '../../common/Random.mjs';
import { randomFraction } from '../../common/Random.mjs';
import { randomBigraph, randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';
import FanGraph from './FanGraph.mjs';
import { itint, tintCount, lowerBounds, upperBounds }
		 from './common.mjs';

/** Generate a random test for the fan graph coloring problem.
 *  @param ni is the number of input vertices in the graph
 *  @param fc is the average fan count at each input
 *  @param no is the number of outputs
 *  @param od is the average degree of the outputs
 *  @param reg is a triple [ir,or,fr] that determines how regular
 *  the graph is; [ir,or] controls the regularity of the input and output
 *  degrees, fr controls the regularity of the fan count
 *  @param tmax is the largest tint, or 0 if no tints
 *  @param cmax is an upper limit on the number of colors needed to
 *  color the graph; must be at least as big as fc and od
 *  @param gap is a number >= 1 used in the crossbar scheduling application
 *  to model crossbars that can process packets at a faster rate than they
 *  arrive; this is done by increasing the assigned bounds in proportion
 *  to the gap
 */
export default function randomFcolor(ni, fc, no=ni, od=fc, reg=[1,1,1], tmax=0,
								     cmax=0, gap=1) {
	let id = no*od/ni;
	ae() && assert(od <= ni && id <= no && fc <= id && gap >= 1);

	if (Number.isFinite(reg)) reg = [reg,reg,reg];
	let g0 = randomRegularBigraph(ni, id, no, [reg[0],reg[1]]);
	let [idmax,odmax] = g0.maxDegree();
	g0.addEdgeProperty(['color',0]);

	// assign random colors to all edges in g0
	// these will be used to assign edges to fans
	let colorSet = range(cmax);
	for (let v = ni+1; v <= g0.n; v++) {
		scramble(colorSet); let i = 1;
		for (let e = g0.firstAt(v); e; e = g0.nextAt(v,e)) {
			g0.color(e,colorSet[i++]);
		}
	}

	// generate fan counts at inputs
	ae() && assert(fc <= id)
	let fanCount = new Int32Array(ni+1); let delta = reg[2]-.00001;
	let nf = 0; let fcmax = 0;
	for (let u = 1; u <= ni; u++) {
		fanCount[u] = randomInteger(Math.ceil(fc-delta), Math.floor(fc+delta));
		fanCount[u] = Math.min(fanCount[u], g0.degree(u));
		fcmax = Math.max(fanCount[u], fcmax);
		nf += fanCount[u];
	}
	if (!cmax) cmax = Math.max(tmax,fcmax,odmax);
	ae() && assert(cmax >= Math.max(tmax,fcmax,odmax));
	// construct FanGraph with same edges as g0
	let	g = new FanGraph(ni, no, nf, g0.edgeRange, 4*cmax, tmax>0);
	for (let e = g0.first(); e; e = g0.next(e)) {
		g.join(g0.left(e), g0.right(e), e);
	}

	let ucolors;
	let owner = new Int32Array(cmax+1);
		// owner[c] is fan that owns c at current input, or 0

	if (tmax == 0) {
		ucolors = new List(cmax);
	} else {
		ae() && assert(tmax >= itint(fcmax,gap) && cmax >= Math.max(tmax),
					 cmax, tmax, fcmax, gap);
		// assign random tints to fans at each input
		let tx = range(tintCount(tmax,gap)-1); // vector of tint indexes
		let firstFan = 1;
		for (let u = 1; u <= ni; u++) {
			scramble(tx); owner.fill(0);
			g.tint(firstFan, 1); // make sure tint 1 is assigned to some fan
			let i = 1;
			for (let f = firstFan+1; f < firstFan+fanCount[u]; f++) {
				g.tint(f, itint(1+tx[i++],gap));
			}
			firstFan += fanCount[u];
		}
	}

	// assign edges to fans at each input
	let firstFan = 1;
	for (let u = 1; u <= ni; u++) {
		if (tmax == 0) { // fans have no tints
			// assign each color at u to some fan at u
			ucolors.clear();
			for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
				let c = g0.color(e);
				if (!ucolors.contains(c)) ucolors.enq(c);
			}
			let i = 0;
			for (let c = ucolors.first(); c; c = ucolors.next(c)) {
				owner[c] = firstFan+i;
				i = (i+1 < fanCount[u] ?  i+1 : 0);
			}
		} else {
			// assign colors to fans, using tints to guide assignment
			// first step, create vector of fans, sorted by tint
			let fanVec = new Int32Array(fanCount[u]);
			owner.fill(0); owner[1] = firstFan;
			fanVec[0] = firstFan; let i = 1;
			for (let f = firstFan+1; f < firstFan+fanCount[u]; f++) {
				owner[g.tint(f)] = f; fanVec[i++] = f;
			}
			fanVec.sort((f1,f2)=>g.tint(f1)-g.tint(f2));
	
			// now assign each color to some a fan with a compatible tint
			let k = fanCount[u]-1;
			for (let c = cmax; c > 0; c--) {
				if (owner[c]) continue;
				// let k be largest integer with tint(fanVec[k]) <= c
				while (g.tint(fanVec[k]) > c) k--;
				// assign c to one of the fans close to fanVec[k]
				let j = randomInteger(Math.max(0,k-4), k);
				owner[c] = fanVec[j];
			}
		}

		// finally, use colors to add edges to fans
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			g.add(e, owner[g0.color(e)]);
		}

		firstFan += fanCount[u];
	}

	return [g, lowerBounds(g), upperBounds(g)];
}
