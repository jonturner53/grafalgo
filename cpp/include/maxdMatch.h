#ifndef MAXDMATCH_H
#define MAXDMATCH_H

#include "Graph.h"
#include "Dlist.h"

using namespace grafalgo;

/** This class encapsulates data and methods used to find a matching
 *  that matches all vertices of maximum degree in a bipartite graph.
 *  The algorithm is invoked using the constructor.
 *
 *  The algorithm used is a variant of the augmenting path algorithm
 *  for maximum matchings.
 */
class maxdMatch {
public:
	maxdMatch(Graph&,Dlist&);
	maxdMatch() {};		// for use with derived class
protected:
	Graph* 	graf;		///< graph we're finding matching for
	Dlist* 	match;		///< matching we're building
	edge* 	pEdge;		///< pEdge[u] is edge to parent of u in forest
	int*  	d;		///< d[u] is degree of u
	int	maxd;		///< maximum degree
	int	maxe;		///< largest edge number
	
	void 	extend(edge);	
	edge 	findPath();

	void	init(Graph&,Dlist&);
	void	cleanup();
};

#endif
