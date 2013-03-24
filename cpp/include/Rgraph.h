/** @file RandomGraph.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef RANDOMGRAPH_H
#define RANDOMGRAPH_H

#include "Adt.h"
#include "Wgraph.h"
#include "Wdigraph.h"
#include "Wflograph.h"

namespace grafalgo {

/** Static class for generating random graphs of various kinds.  */
class RandomGraph : {
public:

	static void rgraph(Graph&, int, int, int);
	static void rgraph(Graph&, int, int);
	static void rbigraph(Graph&, int, int, int);
	static void rtree(Graph& int);
	static void rcgraph(Graph& int,int);
	static void addEdges(Graph&, int);
	static void addEdges(Graph&, int, int, int);
	static void scramble();
	static void shuffle(int*, int*);

	static void rdag(Digraph& int, int);
	static void randomWeights(int, int):
};

#endif
