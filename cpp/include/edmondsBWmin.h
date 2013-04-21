// Header file for class that implements Edmond's algorithm for
// finding a minimum weight matching of maximum size matching in
// a bipartite graph. To use, invoke the constructor.

#ifndef EDMONDSBWMIN_H
#define EDMONDSBWMIN_H

#include "stdinc.h"
#include "Wgraph.h"
#include "Dlist.h"
#include "Ddheap.h"

using namespace grafalgo;

/** This class implements Edmond's algorithm for bipartite weighted graphs.
 *  This is a primal-dual algorithm.
 */
class edmondsBWmin {
public: edmondsBWmin(Wgraph&,Dlist&,int&,int&);
private:
	Wgraph*	graf;		///< graph we're finding matching for
	Dlist*	match;		///< matching we're building

	enum stype {unreached, odd, even};
	stype	*state;		///< state used in augmenting path search
	edge*	mEdge;		///< mEdge[u] is matching edge incident to u
	edge*	pEdge;		///< p[u] is parent of u in forest
	double*	z;		///< z[u] is label for vertex u (dual variable)

	Ddheap*	h1o;		///< heap of odd vertices by label
	Ddheap*	h1e;		///< heap of even vertices by label
	Ddheap*	h2;		///< edges joining even/unreached by slack
	Ddheap*	h3;		///< edges joining even/even by slack

	int	maxwt;		///< maximum edge weight

	double augment(edge);	// augment the matching
	edge findpath();	// find an augmenting path
};

#endif
