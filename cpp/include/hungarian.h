/** @file hungarian.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// Header file for class that implements Edmond's algorithm for
// finding a maximum size matching in a general graph. To use,
// invoke the constructor.

#ifndef HUNGARIAN_H
#define HUNGARIAN_H

#include "stdinc.h"
#include "List.h"
#include "Dlist.h"
#include "Glist.h"
#include "ListPair.h"
#include "Dheap.h"
#include "Wgraph.h"

namespace grafalgo {

class hungarian {
public: hungarian(Wgraph&, Glist<edge>&);
private:
	Wgraph* g;		// graph we're finding matching for
	ListPair *split;	// splits bipartite graph into independent sets
	Dlist	*roots;		// unmatched vertices in "in-set"
	edge	*mEdge;		// mEdge[u]=matching edge incident to u
	edge	*pEdge;		// p[u]=parent of u in forest
	edgeWeight *lab;	// lab[u] is vertex label used in shortest
				// path computation

	void	initLabels();
	vertex	findPath();
	void	augment(vertex);
};

} // ends namespace

#endif
