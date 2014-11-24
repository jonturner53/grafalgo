/** @file augPath.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef AUGPATH_H
#define AUGPATH_H

#include "stdinc.h"
#include "Flograph.h"
#include "List.h"
#include "Dheap.h"

using namespace grafalgo;

/** This class encapsulates data and routines used by the augmenting
 *  path algorithms for max flow. This serves as a base class for
 *  specific variants of the augmenting path algorithm.
 */
class augPath {
public: 
	augPath(Flograph&,int&);
	~augPath();
protected:
        Flograph* fg;         	///< graph we're finding flow on
	edge *pEdge;		///< pEdge[u] is edge to parent of u in spt

	int	main();
        int   	augment();
	virtual bool findPath() = 0; 	///< find augmenting path
};

#endif
