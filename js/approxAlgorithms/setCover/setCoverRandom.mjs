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
import setCoverSizeBound from './setCoverSizeBound.mjs';
import setCoverSplitBound from './setCoverSplitBound.mjs';
import setCoverLabelBound from './setCoverLabelBound.mjs';

/** Generate a random set cover instance.
 *  @param k is the number of sets
 *  @param h is the number of elements in the base set
 *  @param coverage is the number of times each item appears in a subset
 *  @param scale is scale factor used to adjust weight of seeded cover
 *  @param randomWeight is a function that returns a random number
 *  @param args collects remaining arguments into an array of arguments
 *  for randomWeight
 *  @return tuple [g,weight,properties] and properties is an object containing
 *  several properties of the graph g: the lower bounds, sizeBound and
 *  splitBound, the weight of the seed cover built into the graph and the
 *  maximum number of times any item of the base set is included in a subset
 */
export default function setCoverRandom(k, h, coverage, scale,
									   randomWeight, ...args) {

	let subSize = coverage*h/k; // average subset size
	let seedSize = Math.round(k/coverage);
							 	// number of subsets in hidden "seed"

	let items = new List(h);
	let seed = randomBigraph(seedSize, subSize, h);
	items.range(seedSize+1,seedSize+h); regularize(seed,1,items);
	let camo = randomBigraph(k-seedSize, subSize, h);
	items.range((k-seedSize)+1,(k-seedSize)+h);
		regularize(camo,coverage-1,items);

	let g = new Graph(k+h, subSize*k); g.setBipartition(k);
	for (let e = seed.first(); e; e = seed.next(e))
		g.join(seed.left(e), seed.right(e)+(k-seedSize));
	for (let e = camo.first(); e; e = camo.next(e))
		g.join(camo.left(e)+seedSize, camo.right(e)+seedSize);

	// assign weights to sets and compute weight of seed cover
	let weight = new Array(k+1);
	let seedWeight = 0; let allInteger = true;
	for (let j = 1; j <= k; j++) {
		weight[j] = randomWeight(...args);
		if (!Number.isInteger(weight[j])) allInteger = false;
	}
	for (let j = 1; j <= seedSize; j++) {
		weight[j] = scale*weight[j];
		if (allInteger) weight[j] = Math.round(weight[j]);
		seedWeight += weight[j];
	}

	let maxCover = 0;
	for (let i = g.firstOutput(); i; i = g.nextOutput(i))
		maxCover = Math.max(maxCover, g.degree(i));

	// now, scramble graph, while keeping outputs fixed
	let outputs = new Set();
	for (let i = k+1; i <= k+h; i++) outputs.add(i);
	let [vp] = g.scramble(outputs);
	shuffle(weight, vp.slice(0,k+1)); 

	g.sortAllEplists()

	let sb = setCoverSizeBound(g,weight);
	let wsb = setCoverSplitBound(g,weight);
	let lb = setCoverLabelBound(g,weight);

	return [g, weight, {'sizeBound':sb, 'splitBound':wsb, 'labelBound':lb,
						'seedWeight':seedWeight, 'subsetSize':subSize} ];
}
