/** @file beColor.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BECOLOR_H
#define BECOLOR_H

#include "Wdigraph.h"
#include "Dlist.h"
#include "Dheap.h"

namespace grafalgo {

/** This class encapsulates data and methods used by algorithms
 *  to find a a bounded edge coloring in a bipartite graph. It is
 *  used as a base class by various algorithms.
 *  Each algorithm is invoked using its constructor.
 */
class beColor {
public:
	beColor(const Wdigraph&, int*);
	~beColor();
protected:
	const Wdigraph *gp;	///< graph being colored
	int	*color;		///< color[e] is the color assigned to e
	int	bmax;		///< largest edge bound
	int	cmax;		///< upper bound on number of colors needed
	int	maxColor;	///< largest color used so far
	Dlist	*avail;		///< avail[u] is list of unused colors at u
	Wdigraph *ugp;		///< uncolored subgraph
	Dheap<int> *vbd;	///< vertices ordered by degree in ugp

	void	allocate(int, vertex);
	void	free(int, vertex);
	void	assign(int, edge);

	bool	isConsistent();
};

inline void beColor::assign(int c, edge e) {
	vertex u = gp->tail(e); vertex v = gp->head(e);
	color[e] = c; allocate(c,u); allocate(c,v);
	vbd->changekey(u,vbd->key(u)+1); vbd->changekey(v,vbd->key(v)+1);
	ugp->remove(e);
}

} // ends namespace

#endif
