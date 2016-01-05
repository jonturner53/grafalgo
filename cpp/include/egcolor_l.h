/** @file egcolor_l.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_L_H
#define EGCOLOR_L_H

#include "Graph_g.h"
#include "egcolor.h"
#include "List_d.h"

namespace grafalgo {

/** This class encapsulates data and methods used by algorithms
 *  to find an edge group coloring in a bipartite graph. It is
 *  used as a base class by various algorithms.
 *  Each algorithm is invoked using its constructor.
 */
class egcolor_l : public egcolor {
public:
	egcolor_l(Graph_g&, int*);
	~egcolor_l();
protected:
	int	**usr;		///< usr[u][c]=an edge at u that uses color c
	int	**nusr;		///< nusr[u][c]=# of edges at u that use c

	Dlists *ugrp;	///< disjoint sets on uncolored group numbers
	int	*ug;		///< fg[u] is some uncolored group at u

	void	colorGroup(int, int=0);
	int	findColor(int, vertex, vertex, int=1);

	int	firstUgroup(vertex);
	int	nextUgroup(vertex, int);
	void	removeUgroup(int);
};

/** Get index of first uncolored group at an input.
 *  @param u is an input
 *  @return the index of the first uncolored edge group at u
 */
inline int egcolor_l::firstUgroup(vertex u) { return ug[u]; }

/** Get index of next uncolored group at an input.
 *  @param u is an input
 *  @param grp is the index of a group at u
 *  @return the index of the first uncolored edge group at u
 */
inline int egcolor_l::nextUgroup(vertex u, int grp) {
	return ugrp->next(grp);
}

/** Remove an uncolored group.
 *  @param grp is the index of a group
 */
inline void egcolor_l::removeUgroup(int grp) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	ug[u] = ugrp->remove(grp,ug[u]);
}

} // ends namespace

#endif
