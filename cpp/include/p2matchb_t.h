/** @file p2matchb_t.h
 *
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef P2MATCHB_T_H
#define P2MATCHB_T_H

#include "Graph.h"
#include "List_d.h"
#include "List_g.h"

namespace grafalgo {

/** This class encapsulates data and methods used to find a matching
 *  that matches as many vertices as possible from a specified set
 *  in a bipartite graph.
 *  The algorithm is invoked using the constructor.
 *
 *  The algorithm used is a variant of the augmenting path algorithm
 *  for maximum matchings.
 */
class p2matchb_t {
public:
	p2matchb_t(Graph&, List_d&, List_g<edge>&);
	~p2matchb_t();
protected:
	Graph* 	g;		///< graph we're finding matching for
	List_d*	vset;		///< set of vertices to be matched
	edge* 	mEdge;		///< mEdge[u] is matching edge at u or 0
	edge* 	pEdge;		///< pEdge[u] is edge to parent of u in forest
	
	void 	extend(edge);	
	edge 	findPath();
};

} // ends namespace

#endif
