/** @file becolor.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BECOLOR_H
#define BECOLOR_H

#include "Graph_wd.h"
#include "List_d.h"
#include "Heap_d.h"

namespace grafalgo {

/** This class encapsulates data and methods used by algorithms
 *  to find a a bounded edge coloring in a bipartite graph. It is
 *  used as a base class by various algorithms.
 *  Each algorithm is invoked using its constructor.
 */
class becolor {
public:
	becolor(const Graph_wd&, int*);
	~becolor();
protected:
	const Graph_wd *gp;	///< graph being colored
	int	*color;		///< color[e] is the color assigned to e
	int	bmax;		///< largest edge bound
	int	cmax;		///< upper bound on number of colors needed
	int	maxColor;	///< largest color used so far
	List_d	*avail;		///< avail[u] is list of unused colors at u
	Graph_wd *ugp;		///< uncolored subgraph
	Heap_d<int> *vbd;	///< vertices ordered by degree in ugp

	void	allocate(int, vertex);
	void	free(int, vertex);
	void	assign(int, edge);

	bool	isConsistent();
};

inline void becolor::assign(int c, edge e) {
	vertex u = gp->tail(e); vertex v = gp->head(e);
	color[e] = c; allocate(c,u); allocate(c,v);
	vbd->changekey(u,vbd->key(u)+1); vbd->changekey(v,vbd->key(v)+1);
	ugp->remove(e);
}

} // ends namespace

#endif
