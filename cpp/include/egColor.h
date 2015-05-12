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

	ClistSet *ugrp;		///< partition on uncolored group numbers
	int	*ug;		///< fg[u] is some uncolored group at u

	void	colorGroup(int, int=0);
	int	findColor(int, vertex, vertex, int=1);
	void	recolorGroup(int);
	void	recolor(int);
	bool	foundPath(edge, int, int);

	void	fewColorGroup(int, int);

	int	firstUgroup(vertex);
	int	nextUgroup(vertex, int);
	void	removeUgroup(int);

	bool	isConsistent();
};

/** Get index of first uncolored group at an input.
 *  @param u is an input
 *  @return the index of the first uncolored edge group at u
 */
inline int egColor::firstUgroup(vertex u) { return ug[u]; }

/** Get index of next uncolored group at an input.
 *  @param u is an input
 *  @param grp is the index of a group at u
 *  @return the index of the first uncolored edge group at u
 */
inline int egColor::nextUgroup(vertex u, int grp) {
	return (ugrp->next(grp) == ug[u] ? 0 : ugrp->next(grp));
}

/** Remove an uncolored group.
 *  @param grp is the index of a group
 */
inline void egColor::removeUgroup(int grp) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	if (grp == ug[u]) {
		if (ugrp->next(grp) == grp) ug[u] = 0;
		else ug[u] = ugrp->next(grp);
	}
	ugrp->remove(grp);
}

} // ends namespace

#endif
