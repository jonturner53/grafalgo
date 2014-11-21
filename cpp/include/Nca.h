/** @file Nca.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef NCA_H
#define NCA_H

#include "stdinc.h"
#include "Adt.h"
#include "Util.h"
#include "Pair.h"
#include "Partition.h"
#include "Graph.h"

namespace grafalgo {

/** Class that computes nearest common ancestors in a tree.
 *  The computation is invoked using the constructor.
 */
class Nca {
public:
		Nca(Graph&, vertex, Graph&, vertex[]);
private:
	Graph 	*tp;		// pointer to tree
	vertex	root;		// tree root
	vertex	*ncav;		// pointer to nca vector

	Graph	*gp;		// pointer to graph used to represent pairs
	Partition *pp;		// groups closed vertices by their noa
	vertex	*noa;		// if u is a canonical element, noa[u] is noa

	enum state_t { unreached, open, closed };
	state_t	*state;		// states of vertices in search

	void	compute_nca(vertex, vertex); // recursive search routine
};

} // ends namespace

#endif
