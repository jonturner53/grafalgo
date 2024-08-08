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
 *  @return pair [g,tourLength] where random graph that contains a tsp tour
 *  and tourLength is the length of that tour
 */
export default function tspRandom(n, d, scale=1, rand=[randomFraction]) {

	let m = ~~(d*n/2); let g = new Graph(n,m);

	// initialize graph with random tour
	let p = randomPermutation(n);
	let tour = new Int32Array(n); let i = 0;
	for (let u = 1; u < n; u++) tour[i++] = g.join(p[u],p[u+1]);
	tour[n-1] = g.join(p[n],p[1]);

	// augment random edges
	let dense = (d > n/3);
	add2graph(g, m, dense,
					([u,v]) => (n < 2 || u == n-1 && v == n ? null :
						    	(u == 0 ? [1,2] :
								 (v < n ? [u,v+1] : [u+1,u+2]))),
					() => { let u = randomInteger(1,n-1);
							return [u, randomInteger(u+1, n)]; }); 

	g.randomWeights(...rand);

	// apply scale factor to tour edges.
	for (let e of tour)
		g.length(e, Math.max(1, Math.round(g.length(e) * scale)));

	// force lengths to satisfy triangle inequality
	let dg = new Digraph(g.n, 2*m);
	for (let e = g.first(); e; e = g.next(e)) {
		let de = dg.join(g.left(e),g.right(e)); dg.length(de, g.length(e));
			de = dg.join(g.right(e),g.left(e)); dg.length(de, g.length(e));
	}

	let [,dist] = allpairsF(dg);
	for (let e = g.first(); e; e = g.next(e))
		g.weight(e, Math.min(g.weight(e), dist[g.left(e)][g.right(e)]));

	let tourLength = 0;
	for (let e of tour) tourLength += g.length(e);

	return [g,tourLength];
}
