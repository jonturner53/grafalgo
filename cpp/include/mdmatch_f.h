/** @file mdmatch_f.cpp
 * 
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MDMATCH_F_H
#define MDMATCH_F_H

#include "mdmatch.h"
#include "List_d.h"
#include "List_g.h"

namespace grafalgo {

/** This class encapsulates data and methods used to find a matching
 *  that matches all vertices of maximum degree in a bipartite graph.
 *  The algorithm is invoked using the constructor.
 *
 *  This version adds several optimizations designed to speed up
 *  the basic algorithm implemented by mdmatch. These include finding
 *  an initial maximal matching and avoiding most of the initialization
 *  that the basic algorithm does at the start of every path search.
 */
class mdmatch_f : public mdmatch {
public:

	mdmatch_f(const Graph&, edge*);
private:
	List_d*	roots;		///< list of potential tree roots
	List*	q;		///< queue of edges used in findpath
	int*	visited;	///< visited[u]=i if u visited in phase i
	int	phase;		///< each call to findpath starts new phase
	
	void 	extend(edge);	
	edge 	findPath();

	void	init();
	void	cleanup();
};

} // ends namespace

#endif
