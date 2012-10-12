// Header file for class that implements Edmond's algorithm for
// finding a maximum size matching in a general graph. To use,
// invoke the constructor.

#ifndef FASTEDMONDS_H
#define FASTEDMONDS_H

#include "stdinc.h"
#include "Graph.h"
#include "UiList.h"
#include "UiDlist.h"
#include "UiRlist.h"
#include "Partition.h"

class fastEdmonds {
public: fastEdmonds(Graph&,UiDlist&,int&);
	string& statString(bool, string&);
private:
	Graph* graf;		// graph we're finding matching for
	UiDlist* match;		// matching we're building
	Partition *blossoms;	// partition of the vertices into blossoms
	UiRlist* augpath;	// reversible list used to construct path
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
	int  searchNum;		// number of current path search
	int* latestSearch;	// latestSearch[u] == searchNum <=> u is reached
	edge* nextEdge;		// nextEdge[u] is next edge to search at u
	UiList* pending;	// list of vertices used by findpath
	UiDlist* unmatched;	// list of unmatched vertices

	int iSize, mSize, stepCount, blossomCount;
	int imatchTime, rmatchTime, pathInitTime, pathFindTime;
	
	vertex nca(vertex,vertex); // return nearest-common ancestor
	edge path(vertex,vertex); // construct augmenting path
	void augment(edge);	// augment the matching
	edge findpath();	// find an altmenting path
};

#endif
