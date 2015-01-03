/** @file fastMaxDmatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef FASTMAXDMATCH_H
#define FASTMAXDMATCH_H

#include "maxdMatch.h"
#include "Dlist.h"
#include "Glist.h"

namespace grafalgo {

/** This class encapsulates data and methods used to find a matching
 *  that matches all vertices of maximum degree in a bipartite graph.
 *  The algorithm is invoked using the constructor.
 *
 *  This version adds several optimizations designed to speed up
 *  the basic algorithm implemented by maxdMatch. These include finding
 *  an initial maximal matching and avoiding most of the initialization
 *  that the basic algorithm does at the start of every path search.
 */
class fastMaxdMatch : public maxdMatch {
public:

	fastMaxdMatch(Graph&, Glist<edge>&);
private:
	Dlist*	roots;		///< list of potential tree roots
	List*	q;		///< queue of edges used in findpath
	int*	visited;	///< visited[u]=i if u visited in phase i
	int	phase;		///< each call to findpath starts new phase
	
	void 	extend(edge);	
	edge 	findPath();

	void	init(Graph&);
	void	cleanup();
};

} // ends namespace

#endif
