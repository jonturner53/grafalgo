/** @file pmatch_t.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MATCH_EG_H
#define MATCH_EG_H

#include "stdinc.h"
#include "Graph.h"
#include "List.h"
#include "List_d.h"
#include "List_g.h"
#include "Djsets_rl.h"
#include "Djsets_flt.h"

namespace grafalgo {

/** Encapsulates data and methods used to implement variant of Edmonds
 *  algorithm for the maximum priority matching problem.
 */
class pmatch_t {
public: pmatch_t(Graph&, List_g<edge>&);
private:
	Graph* g;		// graph we're finding matching for
	Djsets_flt *blossoms;	// partition of the vertices into blossoms
	Djsets_rl* augpath;	// reversible list used to construct path
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
	int*  prty;		// prty[u] is priority of vertex u

	vertex nca(vertex,vertex);
	edge path(vertex,vertex);
	void augment(edge);
	edge findpath(int);
	vertex root(vertex);	
	vertex base(vertex);
};

/** Find the base of the blossom containing a given vertex.
 *  @param u is a vertex
 *  @return the base of the blossom containing u if is internal, else u
 */
inline vertex pmatch_t::base(vertex u) { origin[blossoms->find(u)] };

} // ends namespace

#endif
