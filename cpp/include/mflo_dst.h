/** @file mflo_dDjsets-lct.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MFLO_DDJSETS-LCT_H
#define MFLO_DDJSETS-LCT_H

#include "stdinc.h"
#include "Graph_f.h"
#include "PathSet.h"
#include "Djsets-lct.h"
#include "List.h"

namespace grafalgo {

/** This class encapsulates data and methods used by the version
 *  of Dinic's algorithm that uses dynamic trees.
 *
 *  The algorithm is invoked using the constructor.
 */
class mflo_dDjsets-lct {
public:	
		mflo_dDjsets-lct(Graph_f&);
		mflo_dDjsets-lct(Graph_f&,string&);
private:
	Graph_f* g;		///< graph we're finding flow on
	int*	nextEdge;	///< pointer into adjacency list
	int*	upEdge;		///< upEdge[u] is edge for dtrees link from u
	int*	level;		///< level[u]=# of edges in path from source
	Djsets-lct*	dt;		///< dynamic trees data structure

	bool	findPath();
	int	augment();
	bool	newPhase();	
};

} // ends namespace

#endif
