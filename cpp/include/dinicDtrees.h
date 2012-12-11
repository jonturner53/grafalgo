// DinicDtrees class. Encapsulates data and routines
// used to implement Dinic's algorithm with dynamic trees.
// Use constructor to invoke algorithm.

#ifndef DINICDTREES_H
#define DINICDTREES_H

#include "stdinc.h"
#include "Flograph.h"
#include "Pathset.h"
#include "Dtrees.h"
#include "List.h"

using namespace grafalgo;

class dinicDtrees {
public:	
		dinicDtrees(Flograph&,int&);
		dinicDtrees(Flograph&,int&,string&);
private:
	Flograph* fg;		// graph we're finding flow on
	int*	nextEdge;	// pointer into adjacency list
	int*	upEdge;		// upEdge[u] is edge for dtrees link from u
	int*	level;		// level[u]=# of edges in path from source
	Dtrees*	dt;		// dynamic trees data structure

	bool	findPath();	// find augmenting path
	int	augment();	// add flow to augmenting path
	bool	newPhase();	// prepare for a new phase

	// statistics
	int	numPhase;
	int	numPaths;
	long long int avgPathLength;
	uint32_t phaseTime;
	uint32_t pathTime;
};

#endif
