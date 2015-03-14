/** @file egColor.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_H
#define EGCOLOR_H

#include "GroupGraph.h"
#include "Dlist.h"

namespace grafalgo {

/** This class encapsulates data and methods used by algorithms
 *  to find an edge group coloring in a bipartite graph. It is
 *  used as a base class by various algorithms.
 *  Each algorithm is invoked using its constructor.
 */
class egColor {
public:
	egColor(GroupGraph&, int*);
	~egColor();
protected:
	GroupGraph *gp;		///< graph being colored
	int	colorBound;	///< upper bound on number of colors needed
	int	maxColor;	///< largest color used so far
	int	*color;		///< color[e] is the color assigned to e
	int	**usr;		///< usr[u][c]=an edge at u that uses color c
	int	**nusr;		///< nusr[u][c]=# of edges at u that use c
	Dlist	*avail;		///< avail[u] is list of unused colors at u

	void	colorGroup1(int);
	void	colorGroup2(int);
	void	recolor(int);
	bool	foundPath(edge, int, int);
	bool	isConsistent();
};

} // ends namespace

#endif
