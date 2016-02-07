/** @file matchwb_egmg.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// Header file for class that implements Edmond's algorithm for
// finding a maximum weight matching in a bipartite graph. To use,
// invoke the constructor.

#ifndef MATCHWB_EGMG_H
#define MATCHWB_EGMG_H

#include "stdinc.h"
#include "Graph_w.h"
#include "List_d.h"
#include "Heap_dd.h"

namespace grafalgo {

/** This class implements Edmond's algorithm using the specific method
 *  described by Galil, Micali and Gabow. This is a primal-dual
 *  algorithm.
 *
 *  This version handles only bipartite graphs.
 */
class matchwb_egmg {
public: matchwb_egmg(const Graph_w&, edge*);
private:
	const Graph_w* gp;	///< graph we're finding matching for

	enum stype {unreached, odd, even};
	stype	*state;		///< state used in augmenting path search
	edge*	mEdge;		///< mEdge[u] is matching edge incident to u
	edge*	pEdge;		///< p[u] is parent of u in forest
	double*	z;		///< z[u] is label for vertex u (dual variable)

	Heap_dd<double>* h1o;	///< heap of odd vertices by label
	Heap_dd<double>* h1e;	///< heap of even vertices by label
	Heap_dd<double>* h2;	///< edges joining even/unreached by slack
	Heap_dd<double>* h3;	///< edges joining even/even by slack

	int	maxwt;		///< maximum edge weight

	double augment(edge);	// augment the matching
	edge findpath();	// find an augmenting path
};

} // ends namespace

#endif
