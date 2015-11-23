/** @file egcolor.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_H
#define EGCOLOR_H

#include "Graph_g.h"
#include "List_d.h"

namespace grafalgo {

/** This class encapsulates data and methods used by algorithms
 *  to find an edge group coloring in a bipartite graph. It is
 *  used as a base class by various algorithms.
 *  Each algorithm is invoked using its constructor.
 */
class egcolor {
public:
	egcolor(Graph_g&, int*);
	~egcolor();
protected:
	Graph_g *gp;		///< graph being colored
	int	colorBound;	///< upper bound on number of colors needed
	int	maxColor;	///< largest color used so far
	int	*color;		///< color[e] is the color assigned to e
	List_d	*avail;		///< avail[u] is list of unused colors at u

	void	allocate(int, vertex);
	void	free(int, vertex);

	bool	isConsistent();
};

} // ends namespace

#endif
