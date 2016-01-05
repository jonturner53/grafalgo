/** @file mflo_ff.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MFLO_FF_H
#define MFLO_FF_H

#include "stdinc.h"
#include "Graph_f.h"
#include "List.h"
#include "Heap_d.h"

namespace grafalgo {

/** This class encapsulates data and routines used by the Ford-Fulkerson
 *  algorithms for max flow (aka augmenting path algoriths).
 *  This serves as a base class for specific variants.
 */
class mflo_ff {
public: 
	mflo_ff(Graph_f&);
	~mflo_ff();
protected:
        Graph_f* g;         	///< graph we're finding flow on
	edge *pEdge;		///< pEdge[u] is edge to parent of u in spt

	int	main();
        int   	augment();
	virtual bool findPath() = 0; 	///< find augmenting path
};

} // ends namespace

#endif
