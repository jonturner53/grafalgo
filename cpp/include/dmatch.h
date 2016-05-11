/** @file dmatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DMATCH_H
#define DMATCH_H

#include "stdinc.h"
#include "List.h"
#include "List_d.h"
#include "ListPair.h"
#include "Graph.h"

namespace grafalgo {

/** dmatch is a data structure for maintaining a maximum matching
 *  in a bipartite graph.
 */
class dmatch : public Adt {
public: 	dmatch(Graph&, int);
		~dmatch();
	void	reset();
	int	size() const;
	void	addEdge(edge);
	void	unmatch(edge);
	bool	extendMatch(vertex);
	edge	matchEdge(vertex);
	void	maxMatch();
	bool	isConsistent();
	string	toString() const;
private:
	Graph*	g;		// graph we're maintaining matching for
	int	k;		// left endpoints in g are vertices 1..k
	int	siz;		// number of edges in matching

	List_d	*roots;		// unmatched vertices in "in-set"
	edge	*mEdge;		// mEdge[u]=matching edge incident to u
	edge	*pEdge;		// p[u]=parent of u in forest
};

inline int dmatch::size() const { return siz; }

inline edge dmatch::matchEdge(vertex u) { return mEdge[u]; }

} // ends namespace

#endif
