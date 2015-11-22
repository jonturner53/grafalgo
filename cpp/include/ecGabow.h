/** @file ecGabow.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef ECGABOW_H
#define ECGABOW_H

#include "Graph.h"
#include "Dlist.h"
#include "Glist.h"
#include "ClistSet.h"

namespace grafalgo {

/** This class encapsulates data and methods used to find an
 *  edge coloring in a bipartite graph, using Gabow's algorithm.
 *  The algorithm is invoked using the constructor.
 *
 *  It uses a divide-and-conquer algorithm invented by Harold Gabow.
 */
class ecGabow {
public:
	ecGabow(Graph&, int*);
	~ecGabow();
private:
	Graph 	*gp;		///< graph we're coloring
	Graph 	*cg;		///< current graph in recursive algorithm
	int	*color;		///< color[e] is the color assigned to e
	Glist<edge> *match;	///< used by matching method
	ClistSet *euler;	///< used to define euler partition on edges
	Glist<edge> *handle;	///< reference edge for each subset of euler
	Dlist	*start;		///< used by eulerPartition method
	
	int	nextColor;	///< next edge color to be used

	void	rColor(int);
	void	eulerPartition();
};

} // ends namespace

#endif
