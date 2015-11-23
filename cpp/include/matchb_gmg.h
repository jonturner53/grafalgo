// Header file for class that implements Edmond's algorithm for
// finding a maximum weight matching in a bipartite graph. To use,
// invoke the constructor.

#ifndef MATCHB_GMG_H
#define MATCHB_GMG_H

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
class matchb_gmg {
public: matchb_gmg(Graph_w&, List_g<edge>&);
private:
	Graph_w*	g;		///< graph we're finding matching for

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
