/** @file mflo_d.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MFLO_D_H
#define MFLO_D_H

#include "mflo_ff.h"

namespace grafalgo {

/** This class encapsulates data and methods used by Dinic's
 *  algorithms for max flow.
 *  
 *  The algorithm is invoked using the constructor.
 */
class mflo_d : public mflo_ff {
public:
		mflo_d(Graph_f&);
private:
        int*    nextEdge;       ///< ignore edges before nextEdge[u] in adj list
        int*    level;          ///< level[u]=# of edges in path from source

        bool    findPath() { return findPath(g->src()); }
        bool	findPath(vertex);

        bool    newPhase(); 
};

} // ends namespace

#endif
