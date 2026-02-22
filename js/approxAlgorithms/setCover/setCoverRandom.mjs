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
import { randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';
import { randomFraction } from '../../common/Random.mjs';
import setCoverSizeBound from './setCoverSizeBound.mjs';
import setCoverSplitBound from './setCoverSplitBound.mjs';
import setCoverLabelBound from './setCoverLabelBound.mjs';

/** Generate a random set cover instance.
 *  @param k is the number of sets
 *  @param h is the number of elements in the base set
 *  @param coverage is the average number of times each item appears in a subset
 *  @param uni is a pair [x,y] where x determines how uniform the subset
 *  sizes are and y determines how uniform the item coverages are; specifically,
 *  the subset size can differ from the average size by less than x and the
 *  item coverage can differ from the average by less than y; if a single
 *  value is supplied, it is used for both x and y
 *  @param randomWeight is a function that returns a random number
 *  @param args collects remaining arguments into an array of arguments
 *  for randomWeight
 *  @return tuple [g,weight,lowerBounds,upperBound] and lowerBounds is an
 *  array of three lower bounds on the opimimum cover weight and upperBound
 *  is an upperBound on the weight, specifically it is the weight of
 *  a secret cover that is embedded in the constructed instance.
 */
export default function setCoverRandom(k, h, coverage, uni=1,
									   randomWeight=(()=>1), ...args) {
	let subSize = coverage*h/k; // average subset size

	// determine number of subsets in secret and camouflage
	let secWidth = Math.ceil(h/subSize);
	let camoWidth = k - secWidth

	// average coverage for secret and camouflage
	let secCoverage = secWidth*subSize/h;
	let camoCoverage = coverage - secCoverage;

	// create graphs for  secret and comouflage
	if (Number.isFinite(uni)) uni = [uni,uni];
	let [su,cu] = uni;
	let secret = randomRegularBigraph(
					secWidth, h*secCoverage/secWidth, h, [su,1]);
	let camo = randomRegularBigraph(
					camoWidth, h*camoCoverage/camoWidth, h, [su,cu]);

	// combine the graphs
	let g = new Graph(k+h, subSize*k); g.setBipartition(k);
	for (let e = secret.first(); e; e = secret.next(e))
		g.join(secret.left(e), secret.right(e)+(k-secWidth));
	for (let e = camo.first(); e; e = camo.next(e))
		g.join(camo.left(e)+secWidth, camo.right(e)+secWidth);

	// assign costs to subsets, with lower costs for subsets in secret
	let weightList = new Float32Array(k);
	for (let j in weightList) weightList[j] = randomWeight(...args);
	weightList.sort();
	let weight = new Float32Array(k+1); let upperBound = 0;
	let s = 1; let sr = secWidth;	// next secret subset, # remaining
	let t = secWidth+1; let tr = camoWidth; // next camo subset, # remaining
	for (let w of weightList) {
		if (sr && randomFraction() < Math.sqrt(coverage)*(sr/(sr+tr))) {
			weight[s++] = w; sr--; upperBound += w;
		} else {
			weight[t++] = w; tr--;
		}
	}
	// upperBound is now the total weight of the secret cover

	// now, scramble graph, while keeping outputs fixed
	let outputs = new Set();
	for (let i = k+1; i <= k+h; i++) outputs.add(i);
	let [vp] = g.scramble(outputs);
	shuffle(weight, vp.slice(0,k+1)); 

	g.sortAllEplists()

	let lowerBounds = [ setCoverSizeBound(g,weight),
						setCoverSplitBound(g,weight),
						setCoverLabelBound(g,weight) ];

	return [g, weight, lowerBounds, upperBound];
}
