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

	static void	scramble();
	static void	rgraph(int, int, int);
	static void	rgraph(int, int);
	static void	addEdges(int);
	static void	rbigraph(int, int, int);
	static void	addEdges(int, int, int);
	static void 	rtree(int);
	static void 	rcgraph(int,int);
	static void 	shuffle(int*, int*);
};

#endif
