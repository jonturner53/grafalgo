/** \file randomGraph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import { randomGraph, randomBigraph, randomDigraph, randomDag, randomTree,
		 randomConnectedGraph, randomFlograph } from '../RandomGraph.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';

try {
	console.log('testing RandomGraph');

	let g = randomGraph(10, 3);
	console.log('sparse undirected graph\n', g.toString(1));

	g = randomGraph(10, 5);
	console.log('dense undirected graph\n', g.toString(1));

	g = randomBigraph(8, 12, 5);
	console.log('undirected bigraph\n', g.toString(1));

	g = randomDigraph(10, 2);
	console.log('sparse directed graph\n', g.toString(1));

	g = randomDigraph(7, 3);
	console.log('dense directed graph\n', g.toString(1));

	g = randomDag(10, 2);
	console.log('sparse dag\n', g.toString(1));

	g = randomTree(10);
	console.log('tree\n', g.toString(1));

	g = randomConnectedGraph(10, 3);
	console.log('connected graph\n', g.toString(1));

	g = randomFlograph(10, 3, 3, 1);
	console.log('flow graph\n', g.toString(1));
} catch(e) {
	if (e instanceof AssertError)
		if (e.message.length > 0)
			console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
	else
		throw(e);
}
