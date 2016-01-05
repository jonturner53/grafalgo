/** @file mflo_dst.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MFLO_DST_H
#define MFLO_DST_H

#include "stdinc.h"
#include "Graph_f.h"
#include "PathSet.h"
#include "Dtrees.h"
#include "List.h"

namespace grafalgo {

/** This class encapsulates data and methods used by the version
 *  of Dinic's algorithm that uses dynamic trees.
 *
 *  The algorithm is invoked using the constructor.
 */
class mflo_dst {
public:	
		mflo_dst(Graph_f&);
		mflo_dst(Graph_f&,string&);
private:
	Graph_f* g;		///< graph we're finding flow on
	int*	nextEdge;	///< pointer into adjacency list
	int*	upEdge;		///< upEdge[u] is edge for dtrees link from u
	int*	level;		///< level[u]=# of edges in path from source
	Dtrees*	dt;		///< dynamic trees data structure

	bool	findPath();
	int	augment();
	bool	newPhase();	
};

} // ends namespace

#endif
