/** @file edmondsGabow.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EDMONDSGABOW_H
#define EDMONDSGABOW_H

#include "stdinc.h"
#include "Graph.h"
#include "List.h"
#include "Dlist.h"
#include "Glist.h"
#include "RlistSet.h"
#include "Partition.h"

namespace grafalgo {

/** Encapsulates data and methods used to implement Gabow's version
 *  of Edmond's algorithm for finding a maximum size matching in a graph.
 */
class edmondsGabow {
public: edmondsGabow(Graph&, Glist<edge>&);
private:
	Graph* g;		// graph we're finding matching for
	Partition *blossoms;	// partition of the vertices into blossoms
	RlistSet* augpath;	// reversible list used to construct path
	vertex* origin;		// origin[u] is the original vertex
				// corresponding to a blossom
	struct BridgePair {	// for an odd vertex u inside a blossom,
	edge e; vertex v;	// bridge[u].e is the edge that caused the
	};
	BridgePair *bridge;	// formation of the innermost blossom containg u
				// bridge[u].v identifies the endpoint of the
				// edge that is u's descendant
	enum stype {unreached, odd, even};
	stype *state;		// state used in computation path search
	edge* mEdge;		// mEdge[u] is matching edge incident to u
	edge* pEdge;		// p[u] is parent of u in forest
	bool* mark;		// used in nearest common ancestor computation

	vertex nca(vertex,vertex); // return nearest-common ancestor
	edge path(vertex,vertex); // construct augmenting path
	void augment(edge);	// augment the matching
	edge findpath();	// find an altmenting path
};

} // ends namespace

#endif
