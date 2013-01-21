/** @file dinic.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DINIC_H
#define DINIC_H

#include "augPath.h"

/** This class encapsulates data and methods used by Dinic's
 *  algorithms for max flow.
 *  
 *  The algorithm is invoked using the constructor.
 */
class dinic : public augPath {
public:
		dinic(Flograph&,int&);
		dinic(Flograph&,int&,string&);
private:
        int*    nextEdge;       ///< ignore edges before nextEdge[u] in adj list
        int*    level;          ///< level[u]=# of edges in path from source

        bool    findPath() { return findPath(fg->src()); }
        bool	findPath(vertex);

        bool    newPhase(); 
};

#endif
