/** @file setCoverRandom.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea} from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { shuffle } from '../../common/Random.mjs';
import { randomBigraph, regularize }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';

/** Generate a random set cover instance.
 *  @param m is the number of sets
 *  @param n is the number of elements in the base set
 *  @param k is the number of sets in the "seed" cover
 *  @param scale is scale factor used to adjust weight of seeded cover
 *  @param randomWeight is a function that returns a random number
 *  @param args collects remaining arguments into an array of arguments
 *  for randomWeight
 *  @return tuple [g,weight,coverWeight] where g is a bipartite graph
 *  representing the sets, the elements and containment relationship;
 *  weight is an array mapping set numbers to weights and coverWeight
 *  is the weight of the seed cover
 */
export default function setCoverRandom(m, n, k, scale, randomWeight, ...args) {

	let ss = n/k;			// average set size
	let coverage = ss*m/n;	// average number of times an item is covered

	let items = new List(m+n);
	let seed = randomBigraph(k, ss, n);
	items.range(k+1,k+n); regularize(seed,1,items);
	let camo = randomBigraph(m-k, ss, n);
	items.range((m-k)+1,(m-k)+n); regularize(camo,coverage-1,items);

	let g = new Graph(m+n, ss*m); g.setBipartition(m);
	for (let e = seed.first(); e; e = seed.next(e))
		g.join(seed.left(e), seed.right(e)+(m-k));
	for (let e = camo.first(); e; e = camo.next(e))
		g.join(camo.left(e)+k, camo.right(e)+k);

	// assign weights to sets and compute weight of seed cover
	let weight = new Int32Array(m+1);
	let coverWeight = 0;
	for (let j = 1; j <= m; j++) {
		weight[j] = randomWeight(...args);
		if (j <= k) {
			weight[j] *= scale; coverWeight += weight[j];
		}
	}

	let maxCover = 0;
	for (let i = g.firstOutput(); i; i = g.nextOutput(i))
		maxCover = Math.max(maxCover, g.degree(i));

	// now, scramble graph, while keeping outputs fixed
	let outputs = new Set();
	for (let i = m+1; i <= m+n; i++) outputs.add(i);
	let [vp] = g.scramble(outputs);
	shuffle(weight, vp.slice(0,m+1)); 

	g.sortAllEplists()

	return [g, weight, coverWeight, maxCover];
}
