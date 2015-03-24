/** @file hopcroftKarp.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// Header file for class that implements Edmond's algorithm for
// finding a maximum size matching in a general graph. To use,
// invoke the constructor.

#ifndef HOPCROFTKARP_H
#define HOPCROFTKARP_H

#include "stdinc.h"
#include "List.h"
#include "Dlist.h"
#include "Glist.h"
#include "ListPair.h"
#include "Graph.h"

namespace grafalgo {

class hopcroftKarp {
public: hopcroftKarp(Graph&, Glist<edge>&);
private:
	Graph* g;		// graph we're finding matching for
	ListPair *split;	// splits bipartite graph into independent sets
	Dlist	*roots;		// unmatched vertices in "in-set"
	edge	*mEdge;		// mEdge[u]=matching edge incident to u
	edge	*pEdge;		// p[u]=parent of u in forest
	int	*level;		// level[u]=distance from closest root
	edge	*nextEdge;	// remembers current position in dfs

	bool	newPhase();
	vertex	findPath(vertex);
	void	augment(vertex);
};

} // ends namespace

#endif
