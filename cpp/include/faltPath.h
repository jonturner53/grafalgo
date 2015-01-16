// AltPath(G,M) class encapsulates data and methods use for alternating
// path algorithm for max size matching. Use constructor to invoke algorithm

#ifndef FALTPATH_H
#define FALTPATH_H

#include "stdinc.h"
#include "Graph.h"
#include "List.h"
#include "Dlist.h"

namespace grafalgo {

class faltPath {
public:
	faltPath(Graph&,Dlist&,int&);
private:
	Graph* graf;		// graph we're finding matching for
	Dlist* match;		// matching we're building

	enum stype {odd, even};
	stype* state;		// odd/even status of vertices
	int* visit;		// visit[u]=# of most recent search to visit u
	edge* mEdge;		// mEdge[u]=matching edge incident to u
	edge* pEdge;		// pEdge[u]=edge to parent of u in forest
	Dlist* free;		// list of free vertices
	List* leaves;		// list of leaves in current forest

	int	sNum;		// index of current search
	
	void augment(edge);	// augment the matching
	edge findPath();	// find an augmenting path
	edge expand(vertex);	// expand tree at given vertex
};
 } // ends namespace

#endif
