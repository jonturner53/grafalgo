/** @file matchb_hk.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// Header file for class that implements Edmond's algorithm for
// finding a maximum size matching in a general graph. To use,
// invoke the constructor.

#ifndef MATCHB_HK_H
#define MATCHB_HK_H

#include "stdinc.h"
#include "List.h"
#include "List_d.h"
#include "List_g.h"
#include "ListPair.h"
#include "Graph.h"

namespace grafalgo {

/** Encapsulates data and methods used to implement the Hopcroft-Karp
 *  algorithm for maximum size matching.
 */
class matchb_hk {
public: matchb_hk(const Graph&, edge*);
private:
	const Graph* gp;	// graph we're finding matching for
	ListPair *split;	// splits bipartite graph into independent sets
	List_d	*roots;		// unmatched vertices in "in-set"
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
