// Header file for class that implements Edmond's algorithm for
// finding a maximum weight matching in a bipartite graph. To use,
// invoke the constructor.

#ifndef EDMONDSGMGBI_H
#define EDMONDSGMGBI_H

#include "stdinc.h"
#include "Wgraph.h"
#include "Dlist.h"
#include "Ddheap.h"

using namespace grafalgo;

/** This class implements Edmond's algorithm using the specific method
 *  method described by Galil, Micali and Gabow. This is a primal-dual
 *  algorithm.
 *
 *  This class handles only bipartite graphs.
 */
class edmondsGMGbi {
public: edmondsGMGbi(Wgraph&, Glist<edge>&);
private:
	Wgraph*	graf;		///< graph we're finding matching for

	enum stype {unreached, odd, even};
	stype	*state;		///< state used in augmenting path search
	edge*	mEdge;		///< mEdge[u] is matching edge incident to u
	edge*	pEdge;		///< p[u] is parent of u in forest
	double*	z;		///< z[u] is label for vertex u (dual variable)

	Ddheap<double>* h1o;	///< heap of odd vertices by label
	Ddheap<double>* h1e;	///< heap of even vertices by label
	Ddheap<double>* h2;	///< edges joining even/unreached by slack
	Ddheap<double>* h3;	///< edges joining even/even by slack

	int	maxwt;		///< maximum edge weight

	double augment(edge);	// augment the matching
	edge findpath();	// find an augmenting path
};

#endif
