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
#include "Util.h"
#include "Partition.h"
#include "Graph.h"

struct VertexPair { vertex v1, v2; };

/** Class that computes nearest common ancestors in a tree.
 *  The computation is invoked using the constructor.
 */
class Nca {
public:
		Nca(Graph&, vertex, VertexPair[], int, vertex[]);
private:
	Graph 	*tp;		// pointer to tree
	vertex	root;		// tree root
	VertexPair *pairs;	// vector of vertex pairs
	int	np;		// number of vertex pairs
	vertex	*ncav;		// pointer to nca vector

	Graph	*gp;		// graph used to represent pairs internally
	Partition *pp;		// groups closed vertices with their noa
	vertex	*noa;		// if u is a canonical element, noa[u] is noa

	enum state_t { unreached, open, closed };
	state_t	*state;		// states of vertices in search

	void	compute_nca(int, int); // recursive search routine
};

#endif
