/** @file matchwb_h.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MATCHWB_H_H
#define MATCHWB_H_H

#include "stdinc.h"
#include "List.h"
#include "List_d.h"
#include "List_g.h"
#include "ListPair.h"
#include "Heap_d.h"
#include "Graph_w.h"

namespace grafalgo {

/** Header file for class that implements Hungarian algorithm for
 *  finding a weighted matching in a bipartite graph. To use,
 *  invoke the constructor.
 */
class matchwb_h {
public: matchwb_h(const Graph_w&, edge*);
private:
	const Graph_w* gp;	// graph we're finding matching for
	ListPair *split;	// splits bipartite graph into independent sets
	List_d	*roots;		// unmatched vertices in "in-set"
	edge	*mEdge;		// mEdge[u]=matching edge incident to u
	edge	*pEdge;		// p[u]=parent of u in forest
	edgeWeight *lab;	// lab[u] is vertex label used in shortest
				// path computation

	void	initLabels();
	vertex	findPath();
	void	augment(vertex);
};

} // ends namespace

#endif
