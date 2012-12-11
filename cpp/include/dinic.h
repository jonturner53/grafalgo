// Dinic class. Encapsulates data and routines used by Dinic's
// algorithm for max flow. Use constructor to invoke algorithm.

#ifndef DINIC_H
#define DINIC_H

#include "augPath.h"

class dinic : public augPath {
public:
		dinic(Flograph&,int&);
		dinic(Flograph&,int&,string&);
private:
        int*    nextEdge;       // ignore edges before nextEdge[u] in adj. list
        int*    level;          // level[u]=# of edges in path from source

        bool    findPath() { return findPath(fg->src()); }
        bool	findPath(vertex); // find augmenting path

        bool    newPhase();     // prepare for a new phase

	// statistics
	int numPhase;
	int numPaths;
        long long int avgPathLength;
        uint32_t phaseTime;
	uint32_t pathTime;
};

#endif
