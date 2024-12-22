/** @file tspRandom.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea} from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import allpairsF from '../../graphAlgorithms/spath/allpairsF.mjs';
import { randomPermutation, randomInteger, randomFraction}
		from '../../common/Random.mjs';
import { add2graph } from '../../graphAlgorithms/misc/RandomGraph.mjs';

/** Generate a random TSP instance.
 *  @param n is the number of cities in the tsp instance
 *  @param d is the average number of direct connections to other cities
 *  (assumed to be at least 2)
 *  @param scale is scale factor used to adjust length of seeded tour
 *  @param rand is a vector that specifies the random the number generator
 *  to be used to generate edge weights and its arguments
 *  @param asym is a boolean which determines if the generated instance is
 *  aysmmetric or not; in symmetric case, the edge lengths satisfy the triangle
 *  inequality, in the asymmetric case, they do not and the retured graph
 *  is a Digraph
 *  @param tri is a boolean which determines if the edge weights must satisfy
 *  the triangle inequality or not
 *  @return pair [g,tourLength] where random graph that contains a tsp tour
 *  and tourLength is the length of that tour
 */
export default function tspRandom(n, d, scale=1, rand=[randomFraction],
								  asym=0, tri=!asym) {
	let m = (asym ? d*n : ~~(d*n/2));
	let g = (asym ? new Digraph(n,m) : new Graph(n,m));

	// compute random "seed" tour
	let p = randomPermutation(n);
	let seed = new Int32Array(n); let i = 0;
	for (let u = 1; u < n; u++) seed[i++] = g.join(p[u],p[u+1]);
	seed[n-1] = g.join(p[n],p[1]);

	add2graph(g, d); g.randomWeights(...rand);

	// apply scale factor to seed edges.
	for (let e of seed)
		g.length(e, Math.max(1, Math.round(g.length(e) * scale)));

	let seedLength = 0;
	for (let e of seed) seedLength += g.length(e);

	if (tri) enforceTriangleInequality(g);

	return [g, seed, seedLength];
}

function enforceTriangleInequality(g) {
	let dg = g;
	if (!(dg instanceof Digraph)) {
		dg = new Digraph(g.n, 2*g.m);
		for (let e = g.first(); e; e = g.next(e)) {
			let de = dg.join(g.left(e),g.right(e)); dg.length(de, g.length(e));
				de = dg.join(g.right(e),g.left(e)); dg.length(de, g.length(e));
		}
	}
	let [,dist] = allpairsF(dg);
	for (let e = g.first(); e; e = g.next(e))
		g.length(e, Math.min(g.length(e), dist[g.left(e)][g.right(e)]));
}
