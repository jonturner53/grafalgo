/** @file ecolor_g.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef ECOLOR_G_H
#define ECOLOR_G_H

#include "Graph.h"
#include "List_d.h"
#include "List_g.h"
#include "Dlists.h"

namespace grafalgo {

/** This class encapsulates data and methods used to find an
 *  edge coloring in a bipartite graph, using Gabow's algorithm.
 *  The algorithm is invoked using the constructor.
 *
 *  It uses a divide-and-conquer algorithm invented by Harold Gabow.
 */
class ecolor_g {
public:
	ecolor_g(Graph&, int*);
	~ecolor_g();
private:
	Graph 	*gp;		///< graph we're coloring
	Graph 	*cg;		///< current graph in recursive algorithm
	int	*color;		///< color[e] is the color assigned to e
	edge 	*mEdge;		///< used by matching method
	Dlists	*euler;		///< used to define euler partition on edges
	List_g<edge> *handle;	///< reference edge for each subset of euler
	List_d	*start;		///< used by eulerDsets method
	
	int	nextColor;	///< next edge color to be used

	void	rColor(int);
	void	eulerPartition();
};

} // ends namespace

#endif
