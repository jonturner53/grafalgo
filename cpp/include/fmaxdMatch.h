#ifndef FMAXDMATCH_H
#define FMAXDMATCH_H

#include "maxdMatch.h"
#include "Dlist.h"

using namespace grafalgo;

/** This class encapsulates data and methods used to find a matching
 *  that matches all vertices of maximum degree in a bipartite graph.
 *  The algorithm is invoked using the constructor.
 *
 *  This version adds several optimizations designed to speed up
 *  the basic algorithm implemented by maxdMatch. These include finding
 *  an initial maximal matching and avoiding most of the initialization
 *  that the basic algorithm does at the start of every path search.
 */
class fmaxdMatch : public maxdMatch {
public:

	fmaxdMatch(Graph&,Dlist&);
private:
	edge* 	mEdge;		///< mEdge[u] is matching edge incident to  u
	Dlist*	maxdVerts;	///< list of max degree vertices
	List*	q;		///< queue of edges used in findpath
	int*	visited;	///< visited[u]=i if u visited in phase i
	int	phase;		///< each call to findpath starts new phase
	
	void 	extend(edge);	
	edge 	findPath();

	void	init(Graph&, Dlist&);
	void	cleanup();
};

#endif
