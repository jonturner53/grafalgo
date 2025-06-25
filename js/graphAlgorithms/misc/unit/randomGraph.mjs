/** \file randomGraph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertFail } from '../../../common/Assert.mjs';
import { randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomBigraph, randomDigraph, randomDag, randomTree,
		 randomConnectedGraph, randomFlograph, randomRegularGraph,
		 randomRegularBigraph, add2graph} from '../RandomGraph.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';
import {randomSample} from '../../../common/Random.mjs';

try {
	console.log('testing RandomGraph');
	let g = randomGraph(10, 2.5);
	console.log('sparse undirected (10,2.5)\n', g.toString(1));
	g = randomGraph(10, 2.5, 3);
	console.log('same with bounded degree (10,2.5,3)\n', g.toString(1));
	g.randomWeights(randomInteger, 1, 9);
	console.log('same with weights (1,9)\n', g.toString(1));

	g.fromString('{a[b c] d[e] f[g h] i[j]}');
	console.log('undirected graph with random extension (3,4) \n',g.toString());
	add2graph(g, 3, 4);
	console.log(g.toString(1));
	
	g = randomGraph(10, 6);
	console.log('dense undirected graph (10,6)\n', g.toString(1));

	g = randomBigraph(8, 2.5, 12);
	console.log('undirected bigraph (8,2.5,12)\n', g.toString(1));

	g = randomBigraph(8, 2.5, 12, 3);
	console.log('same with bounded degree (8,2.5,12,3)\n', g.toString(1));

	g = randomDigraph(10, 2);
	console.log('sparse directed graph (10,2)\n', g.toString(1));

	g = randomDigraph(10, 4);
	console.log('dense directed graph (10,4)\n', g.toString(1));

	g = randomDag(10, 1.5);
	console.log('sparse dag (10,1.5)\n', g.toString(1));

	g = randomDag(10, 1.5, 2);
	console.log('same with degree bound (10,1.5,2)\n', g.toString(1));

	g = randomTree(12);
	console.log('tree (10)\n', g.toString(1));

	g = randomTree(12,3);
	console.log('same with degree bound (10,3)\n', g.toString(1));

	g = randomConnectedGraph(10,2.5,3);
	console.log('connected graph (10,2.5,3)\n', g.toString(1));

	g = randomRegularGraph(10, 3);
	console.log('regular graph (10,3)\n', g.toString(1));

	g = randomRegularGraph(10, 3, 1.5);
	console.log('seimi-regular graph (10,3,1.5) \n', g.toString(1));

	g = randomRegularBigraph(8,6,16);
	console.log('regular bigraph (8,6,16)\n', g.toString(1));

	g = randomRegularBigraph(8,6.5,16,3);
	console.log('semi-regular bigraph (8,6.5,16,3)\n', g.toString(1));

	g = randomFlograph(16, 2.5, 3);
	g.randomCapacities(randomInteger,1,9);
	console.log('flow graph (16,2.5,3)\n', g.toString(1));
} catch(e) {
	if (e instanceof AssertFail) {
		if (e.message.length > 0)
			console.log(e.name + ': ' + e.message);
	//	else
	//		console.error(e.stack);
	} else {
		throw(e);
	}
		console.error(e.stack);
}
