// AltPath(G,M) class encapsulates data and methods use for alternating
// path algorithm for max size matching. Use constructor to invoke algorithm

#ifndef ALTPATH_H
#define ALTPATH_H

#include "stdinc.h"
#include "Graph.h"
#include "UiList.h"
#include "UiDlist.h"

class altPath {
public:
	altPath(Graph&,UiDlist&,int&);
private:
	Graph* graf;		// graph we're finding matching for
	UiDlist* match;		// matching we're building
	edge* pEdge;		// pEdge[u] is edge to parent of u in forest
	
	void augment(edge);	// augment the matching
	edge findPath();	// find an altmenting path
};

#endif
