#ifndef MAXDMATCH_H
#define MAXDMATCH_H

#include "Graph.h"
#include "Glist.h"

namespace grafalgo {

/** This class encapsulates data and methods used to find a matching
 *  that matches all vertices of maximum degree in a bipartite graph.
 *  The algorithm is invoked using the constructor.
 *
 *  The algorithm used is a variant of the augmenting path algorithm
 *  for maximum matchings.
 */
class maxdMatch {
public:
	maxdMatch(Graph&, Glist<edge>&);
	maxdMatch() {};		// for use with derived class
protected:
	Graph* 	g;		///< graph we're finding matching for
	edge* 	mEdge;		///< mEdge[u] is matching edge at u or 0
	edge* 	pEdge;		///< pEdge[u] is edge to parent of u in forest
	int*  	d;		///< d[u] is degree of u
	int	maxd;		///< maximum degree
	
	void 	extend(edge);	
	edge 	findPath();

	void	init(Graph&);
	void	cleanup();
};

} // ends namespace

#endif
