// Header file for class that implements Edmond's algorithm for
// finding a maximum size matching in a general graph. To use,
// invoke the constructor.

#ifndef FASTMATCH_EG_H
#define FASTMATCH_EG_H

#include "stdinc.h"
#include "Graph.h"
#include "List.h"
#include "List_d.h"
#include "List_g.h"
#include "Djsets_rl.h"
#include "Djsets_flt.h"

namespace grafalgo {

class match_egf {
public: match_egf(Graph&, List_g<edge>&);
private:
	Graph* g;		///< graph we're finding matching for
	Djsets_flt *blossoms;	///< partition of the vertices into blossoms
	Djsets_rl* augpath;	///< reversible list used to construct path
	vertex* origin;		///< origin[u] is the original vertex
				///< corresponding to a blossom
	struct BridgePair {	///< for an odd vertex u inside a blossom,
	edge e; vertex v;	///< bridge[u].e is the edge that caused the
	};
	BridgePair *bridge;	///< for innermost blossom containing u
				///< bridge[u].v identifies the endpoint of the
				///< edge that is u's descendant
	enum stype {unreached, odd, even};
	stype *state;		///< state used in computation path search
	edge* mEdge;		///< mEdge[u] is matching edge incident to u
	edge* pEdge;		///< p[u] is parent of u in forest
	bool* mark;		///< used in nearest common ancestor computation
	int  searchNum;		///< number of current path search
	int* latestSearch;	///< latestSearch[u] == searchNum <=>
				///< u is reached
	edge* nextEdge;		///< nextEdge[u] is next edge to search at u
	List* pending;		///< list of vertices used by findpath
	List_d* unmatched;	///< list of unmatched vertices

	vertex nca(vertex,vertex); // return nearest-common ancestor
	edge path(vertex,vertex); // construct augmenting path
	void augment(edge);	// augment the matching
	edge findpath();	// find an altmenting path
};

} // ends namespace

#endif
