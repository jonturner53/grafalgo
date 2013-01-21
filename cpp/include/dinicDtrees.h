/** @file dinicDtrees.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DINICDTREES_H
#define DINICDTREES_H

#include "stdinc.h"
#include "Flograph.h"
#include "PathSet.h"
#include "Dtrees.h"
#include "List.h"

using namespace grafalgo;

/** This class encapsulates data and methods used by the version
 *  of Dinic's algorithm that uses dynamic trees.
 *
 *  The algorithm is invoked using the constructor.
 */
class dinicDtrees {
public:	
		dinicDtrees(Flograph&,int&);
		dinicDtrees(Flograph&,int&,string&);
private:
	Flograph* fg;		///< graph we're finding flow on
	int*	nextEdge;	///< pointer into adjacency list
	int*	upEdge;		///< upEdge[u] is edge for dtrees link from u
	int*	level;		///< level[u]=# of edges in path from source
	Dtrees*	dt;		///< dynamic trees data structure

	bool	findPath();
	int	augment();
	bool	newPhase();	
};

#endif
