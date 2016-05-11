/** @file match_egc.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MATCH_EGC_H
#define MATCH_EGC_H

#include "stdinc.h"
#include "Graph.h"
#include "List.h"
#include "List_d.h"
#include "List_g.h"
#include "Dlists_r.h"
#include "Dsets.h"

namespace grafalgo {

/** Encapsulates common data and methods used to implement Gabow's version
 *  of Edmond's algorithm for finding a maximum size matching in a graph.
 *  Subclasses implement variants of the base algorithm.
 */
class match_egc {
public: match_egc(const Graph&, edge*);
	~match_egc();
protected:
	const Graph* gp;	///< graph we're finding matching for
	Dsets *blossoms;	///< partition of the vertices into blossoms
	Dlists_r* augpath;	///< reversible list used to construct path
	vertex* origin;		///< origin[u] is the original vertex
				///< corresponding to a blossom
	/** information about a blossom's bridge */
	struct BridgePair {
	edge e; 		///< bridge[u].e is the edge that caused the
				///< formation of the innermost blossom
				///< containing u
	vertex v;		///< bridge[u].v identifies the endpoint of the
				///< edge that is u's descendant
	};
	BridgePair *bridge;	///< bridge[u] is bridge info for u
	/** possible states of a vertex during tree construction */
	enum stype {unreached, odd, even};
	stype *state;		///< state used in computation path search
	edge* mEdge;		///< mEdge[u] is matching edge incident to u
	edge* pEdge;		///< p[u] is parent of u in forest
	bool* mark;		///< used in nearest common ancestor computation

	vertex nca(vertex,vertex);
	edge path(vertex,vertex);
	void augment(edge);
	vertex root(vertex);	
	vertex base(vertex);
};

/** Find the base of the blossom containing a given vertex.
 *  @param u is a vertex
 *  @return the base of the blossom containing u if is internal, else u
 */
inline vertex match_egc::base(vertex u) {
	return origin[blossoms->find(u)];
}

} // ends namespace

#endif
