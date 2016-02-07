#ifndef MDMATCH_H
#define MDMATCH_H

#include "Graph.h"
#include "List_g.h"

namespace grafalgo {

/** This class encapsulates data and methods used to find a matching
 *  that matches all vertices of maximum degree in a bipartite graph.
 *  The algorithm is invoked using the constructor.
 *
 *  The algorithm used is a variant of the augmenting path algorithm
 *  for maximum matchings.
 */
class mdmatch {
public:
	mdmatch(const Graph&, edge*);
	mdmatch() {};		// for use with derived class
protected:
	const Graph* gp;	///< graph we're finding matching for
	edge* 	mEdge;		///< mEdge[u] is matching edge at u or 0
	edge* 	pEdge;		///< pEdge[u] is edge to parent of u in forest
	int*  	d;		///< d[u] is degree of u
	int	maxd;		///< maximum degree
	
	void 	extend(edge);	
	edge 	findPath();

	void	init();
	void	cleanup();
};

} // ends namespace

#endif
